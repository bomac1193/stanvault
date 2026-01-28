import { NextRequest, NextResponse } from 'next/server'
import { getFanUser } from '@/lib/fan-auth'
import { prisma } from '@/lib/prisma'
import { createHmac, randomBytes } from 'crypto'

const EXPORT_SECRET = process.env.EXPORT_SECRET || process.env.AUTH_SECRET || 'default-export-secret'

export type ExportFormat = 'json' | 'jwt' | 'w3c-vc'

interface FanIdentityData {
  version: '1.0'
  exportedAt: string
  fan: {
    id: string
    displayName: string
    memberSince: string
  }
  relationships: Array<{
    artistId: string
    artistName: string
    tier: string
    stanScore: number
    totalStreams: number
    savedTracks: number
    playlistAdds: number
    isFollowing: boolean
    firstSeenAt: string
    lastActiveAt: string
    verified: boolean
    verifiedAt?: string
    verifiedVia?: string
  }>
  aggregateStats: {
    totalArtists: number
    totalScore: number
    superfanCount: number
    avgScore: number
    totalStreams: number
    oldestRelationship: string
  }
}

// GET - Export fan identity
export async function GET(request: NextRequest) {
  try {
    const user = await getFanUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const format = (request.nextUrl.searchParams.get('format') || 'json') as ExportFormat
    const includeRaw = request.nextUrl.searchParams.get('includeRaw') === 'true'

    // Get fan user details
    const fanUser = await prisma.fanUser.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        displayName: true,
        createdAt: true,
      },
    })

    if (!fanUser) {
      return NextResponse.json({ error: 'Fan user not found' }, { status: 404 })
    }

    // Get all artist relationships
    const relationships = await prisma.fanUserArtistLink.findMany({
      where: { fanUserId: user.id },
      include: {
        artist: {
          select: {
            id: true,
            artistName: true,
          },
        },
      },
      orderBy: { stanScore: 'desc' },
    })

    // Build identity data
    const identityData: FanIdentityData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      fan: {
        id: fanUser.id,
        displayName: fanUser.displayName,
        memberSince: fanUser.createdAt.toISOString(),
      },
      relationships: relationships.map((r) => ({
        artistId: r.artistId,
        artistName: r.artist.artistName || 'Unknown Artist',
        tier: r.tier,
        stanScore: r.stanScore,
        totalStreams: r.totalStreams,
        savedTracks: r.savedTracks,
        playlistAdds: r.playlistAdds,
        isFollowing: r.isFollowing,
        firstSeenAt: r.firstSeenAt.toISOString(),
        lastActiveAt: r.lastActiveAt.toISOString(),
        verified: r.verified,
        verifiedAt: r.verifiedAt?.toISOString(),
        verifiedVia: r.verifiedVia || undefined,
      })),
      aggregateStats: {
        totalArtists: relationships.length,
        totalScore: relationships.reduce((sum, r) => sum + r.stanScore, 0),
        superfanCount: relationships.filter((r) => r.tier === 'SUPERFAN').length,
        avgScore:
          relationships.length > 0
            ? Math.round(
                relationships.reduce((sum, r) => sum + r.stanScore, 0) / relationships.length
              )
            : 0,
        totalStreams: relationships.reduce((sum, r) => sum + r.totalStreams, 0),
        oldestRelationship:
          relationships.length > 0
            ? new Date(
                Math.min(...relationships.map((r) => r.firstSeenAt.getTime()))
              ).toISOString()
            : new Date().toISOString(),
      },
    }

    // Record export
    const exportId = randomBytes(16).toString('hex')
    await prisma.fanIdentityExport.create({
      data: {
        id: exportId,
        fanUserId: user.id,
        format,
        artistCount: relationships.length,
        includesRawData: includeRaw,
      },
    })

    // Format response based on requested format
    switch (format) {
      case 'jwt': {
        // Create a signed JWT-like token
        const header = { alg: 'HS256', typ: 'FIP' } // Fan Identity Protocol
        const payload = {
          ...identityData,
          iss: 'stanvault',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year
          jti: exportId,
        }

        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
        const signature = createHmac('sha256', EXPORT_SECRET)
          .update(`${encodedHeader}.${encodedPayload}`)
          .digest('base64url')

        const token = `${encodedHeader}.${encodedPayload}.${signature}`

        return NextResponse.json({
          format: 'jwt',
          token,
          exportId,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }

      case 'w3c-vc': {
        // W3C Verifiable Credentials format
        const vc = {
          '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://stanvault.io/credentials/fan-identity/v1',
          ],
          id: `urn:uuid:${exportId}`,
          type: ['VerifiableCredential', 'FanIdentityCredential'],
          issuer: {
            id: 'did:web:stanvault.io',
            name: 'Stanvault',
          },
          issuanceDate: new Date().toISOString(),
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          credentialSubject: {
            id: `did:stanvault:fan:${fanUser.id}`,
            displayName: fanUser.displayName,
            memberSince: fanUser.createdAt.toISOString(),
            fanProfile: {
              totalArtists: identityData.aggregateStats.totalArtists,
              totalScore: identityData.aggregateStats.totalScore,
              superfanCount: identityData.aggregateStats.superfanCount,
              avgScore: identityData.aggregateStats.avgScore,
            },
            artistRelationships: identityData.relationships.map((r) => ({
              artist: r.artistName,
              tier: r.tier,
              score: r.stanScore,
              verified: r.verified,
              since: r.firstSeenAt,
            })),
          },
          proof: {
            type: 'HmacSha256Signature2024',
            created: new Date().toISOString(),
            verificationMethod: 'did:web:stanvault.io#key-1',
            proofPurpose: 'assertionMethod',
            // In production, this would be a proper cryptographic signature
            proofValue: createHmac('sha256', EXPORT_SECRET)
              .update(JSON.stringify(identityData))
              .digest('base64url'),
          },
        }

        return NextResponse.json({
          format: 'w3c-vc',
          credential: vc,
          exportId,
        })
      }

      case 'json':
      default: {
        // Plain JSON export
        const signature = createHmac('sha256', EXPORT_SECRET)
          .update(JSON.stringify(identityData))
          .digest('base64url')

        return NextResponse.json({
          format: 'json',
          data: identityData,
          signature,
          exportId,
          verifyUrl: `https://stanvault.io/verify/${exportId}`,
        })
      }
    }
  } catch (error) {
    console.error('Fan export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET export history
export async function POST(request: NextRequest) {
  try {
    const user = await getFanUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === 'history') {
      const exports = await prisma.fanIdentityExport.findMany({
        where: { fanUserId: user.id },
        orderBy: { exportedAt: 'desc' },
        take: 20,
      })

      return NextResponse.json({ exports })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Fan export history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
