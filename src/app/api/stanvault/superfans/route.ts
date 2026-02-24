import { NextRequest, NextResponse } from 'next/server'
import { FanTier } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const ECOSYSTEM_API_SECRET = process.env.ECOSYSTEM_API_SECRET || ''

const tierRank: Record<FanTier, number> = {
  CASUAL: 1,
  ENGAGED: 2,
  DEDICATED: 3,
  SUPERFAN: 4,
}

function validateRequest(request: NextRequest): boolean {
  if (!ECOSYSTEM_API_SECRET) return true
  const secret = request.headers.get('X-Ecosystem-Secret')
  return secret === ECOSYSTEM_API_SECRET
}

function normalizeTier(raw: string | null): FanTier {
  if (raw === 'CASUAL') return 'CASUAL'
  if (raw === 'ENGAGED') return 'ENGAGED'
  if (raw === 'DEDICATED') return 'DEDICATED'
  return 'SUPERFAN'
}

export async function GET(request: NextRequest) {
  if (!validateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const artistName = searchParams.get('artistName')
  const artistId = searchParams.get('artistId')
  const minStanScore = parseInt(searchParams.get('minStanScore') || '70', 10)
  const minTier = normalizeTier(searchParams.get('minTier'))
  const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 1000)

  if (!artistName && !artistId) {
    return NextResponse.json(
      { error: 'artistName or artistId is required' },
      { status: 400 }
    )
  }

  try {
    const artist = await prisma.user.findFirst({
      where: artistId
        ? { id: artistId }
        : {
            OR: [{ artistName: artistName || undefined }, { name: artistName || undefined }],
          },
      select: {
        id: true,
        artistName: true,
        name: true,
      },
    })

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
    }

    const fans = await prisma.fan.findMany({
      where: {
        userId: artist.id,
        stanScore: {
          gte: Number.isNaN(minStanScore) ? 70 : minStanScore,
        },
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        stanScore: true,
        tier: true,
        convictionScore: true,
        engagementScore: true,
        longevityScore: true,
        recencyScore: true,
        platformScore: true,
        city: true,
        country: true,
        lastActiveAt: true,
        platformLinks: {
          select: {
            platform: true,
            shares: true,
            tipCount: true,
            tipAmountUsd: true,
            tipFrequency: true,
            momentSaves: true,
          },
        },
      },
      orderBy: [{ stanScore: 'desc' }, { lastActiveAt: 'desc' }],
      take: Number.isNaN(limit) ? 200 : limit,
    })

    const filteredFans = fans.filter((fan) => tierRank[fan.tier] >= tierRank[minTier])

    return NextResponse.json({
      artist: {
        id: artist.id,
        name: artist.artistName || artist.name || null,
      },
      segment: {
        minTier,
        minStanScore: Number.isNaN(minStanScore) ? 70 : minStanScore,
        requestedLimit: Number.isNaN(limit) ? 200 : limit,
        count: filteredFans.length,
      },
      superfans: filteredFans.map((fan) => ({
        fanId: fan.id,
        displayName: fan.displayName,
        email: fan.email,
        stanScore: fan.stanScore,
        tier: fan.tier,
        convictionScore: fan.convictionScore,
        engagementScore: fan.engagementScore,
        longevityScore: fan.longevityScore,
        recencyScore: fan.recencyScore,
        platformScore: fan.platformScore,
        propagationCount: fan.platformLinks.reduce(
          (acc, link) => acc + (link.shares || 0),
          0
        ),
        tipCount: fan.platformLinks.reduce((acc, link) => acc + (link.tipCount || 0), 0),
        tipAmountUsd: fan.platformLinks.reduce(
          (acc, link) => acc + (link.tipAmountUsd || 0),
          0
        ),
        tipFrequency: fan.platformLinks.reduce(
          (acc, link) => acc + (link.tipFrequency || 0),
          0
        ),
        momentSaves: fan.platformLinks.reduce(
          (acc, link) => acc + (link.momentSaves || 0),
          0
        ),
        city: fan.city,
        country: fan.country,
        lastActiveAt: fan.lastActiveAt,
      })),
    })
  } catch (error: unknown) {
    console.error('[Ecosystem] Superfan segment error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal error', message },
      { status: 500 }
    )
  }
}
