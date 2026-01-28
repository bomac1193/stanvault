import { NextRequest, NextResponse } from 'next/server'
import { getFanUser } from '@/lib/fan-auth'
import { prisma } from '@/lib/prisma'
import { randomBytes, createHmac } from 'crypto'
import { addDays, differenceInMonths } from 'date-fns'

const TOKEN_SECRET = process.env.VERIFICATION_TOKEN_SECRET || process.env.AUTH_SECRET || 'default-secret'

// Get fan's tokens
export async function GET(request: NextRequest) {
  try {
    const user = await getFanUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const artistId = request.nextUrl.searchParams.get('artistId')

    const whereClause = artistId
      ? { fanUserId: user.id, artistId }
      : { fanUserId: user.id }

    const tokens = await prisma.fanUserVerificationToken.findMany({
      where: {
        ...whereClause,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      tokens: tokens.map(t => ({
        id: t.id,
        artistId: t.artistId,
        tier: t.tier,
        stanScore: t.stanScore,
        relationshipMonths: t.relationshipMonths,
        issuedAt: t.issuedAt,
        expiresAt: t.expiresAt,
        usageCount: t.usageCount,
        lastUsedAt: t.lastUsedAt,
        purpose: t.purpose,
      })),
    })
  } catch (error) {
    console.error('Get fan tokens error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Generate a new token
export async function POST(request: NextRequest) {
  try {
    const user = await getFanUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { artistId, purpose, expiryDays = 30 } = body

    if (!artistId) {
      return NextResponse.json({ error: 'artistId is required' }, { status: 400 })
    }

    // Get the fan's relationship with this artist
    const relationship = await prisma.fanUserArtistLink.findUnique({
      where: {
        fanUserId_artistId: {
          fanUserId: user.id,
          artistId,
        },
      },
      include: {
        artist: {
          select: { artistName: true },
        },
      },
    })

    if (!relationship) {
      return NextResponse.json(
        { error: 'No relationship with this artist' },
        { status: 400 }
      )
    }

    // Calculate relationship months
    const relationshipMonths = differenceInMonths(new Date(), relationship.firstSeenAt)

    // Generate token
    const tokenId = randomBytes(16).toString('hex')
    const expiresAt = addDays(new Date(), Math.min(expiryDays, 90)) // Max 90 days

    const payload = {
      type: 'fan_self_service',
      tokenId,
      fanUserId: user.id,
      artistId,
      tier: relationship.tier,
      stanScore: relationship.stanScore,
      relationshipMonths,
      issuedAt: Date.now(),
      expiresAt: expiresAt.getTime(),
    }

    const signature = createHmac('sha256', TOKEN_SECRET)
      .update(JSON.stringify(payload))
      .digest('base64url')

    const token = `${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${signature}`

    // Store token
    await prisma.fanUserVerificationToken.create({
      data: {
        fanUserId: user.id,
        artistId,
        token,
        tier: relationship.tier,
        stanScore: relationship.stanScore,
        relationshipMonths,
        expiresAt,
        purpose,
      },
    })

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      data: {
        artistName: relationship.artist.artistName,
        tier: relationship.tier,
        stanScore: relationship.stanScore,
        relationshipMonths,
      },
    })
  } catch (error) {
    console.error('Generate fan token error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Revoke a token
export async function DELETE(request: NextRequest) {
  try {
    const user = await getFanUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tokenId = request.nextUrl.searchParams.get('tokenId')
    if (!tokenId) {
      return NextResponse.json({ error: 'tokenId is required' }, { status: 400 })
    }

    // Verify ownership and revoke
    const token = await prisma.fanUserVerificationToken.findFirst({
      where: {
        id: tokenId,
        fanUserId: user.id,
      },
    })

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    await prisma.fanUserVerificationToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Revoke fan token error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
