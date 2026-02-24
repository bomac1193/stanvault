// Ecosystem endpoint: Tier query for Dasham BackerRing consumption
// Returns fan tiers and scores for a given artist
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ECOSYSTEM_API_SECRET = process.env.ECOSYSTEM_API_SECRET || ''

function validateRequest(request: NextRequest): boolean {
  if (!ECOSYSTEM_API_SECRET) return true
  const secret = request.headers.get('X-Ecosystem-Secret')
  return secret === ECOSYSTEM_API_SECRET
}

// GET /api/stanvault/tier?artistName=...
// Returns tier distribution + individual fan tiers for an artist
export async function GET(request: NextRequest) {
  if (!validateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const artistName = searchParams.get('artistName')
  const fanEmail = searchParams.get('fanEmail')
  const fanId = searchParams.get('fanId')

  if (!artistName) {
    return NextResponse.json({ error: 'artistName required' }, { status: 400 })
  }

  try {
    // Find artist
    const artist = await prisma.user.findFirst({
      where: {
        OR: [
          { artistName },
          { name: artistName },
        ],
      },
    })

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
    }

    // If querying for a specific fan
    if (fanEmail || fanId) {
      const fan = await prisma.fan.findFirst({
        where: {
          userId: artist.id,
          ...(fanEmail ? { email: fanEmail } : {}),
        },
        select: {
          id: true,
          displayName: true,
          stanScore: true,
          tier: true,
          convictionScore: true,
          platformScore: true,
          engagementScore: true,
          longevityScore: true,
          recencyScore: true,
          firstSeenAt: true,
          lastActiveAt: true,
          city: true,
        },
      })

      if (!fan) {
        return NextResponse.json({
          found: false,
          tier: 'CASUAL',
          stanScore: 0,
        })
      }

      return NextResponse.json({
        found: true,
        fanId: fan.id,
        tier: fan.tier,
        stanScore: fan.stanScore,
        convictionScore: fan.convictionScore,
        breakdown: {
          conviction: fan.convictionScore,
          platform: fan.platformScore,
          engagement: fan.engagementScore,
          longevity: fan.longevityScore,
          recency: fan.recencyScore,
        },
        city: fan.city,
        firstSeenAt: fan.firstSeenAt,
        lastActiveAt: fan.lastActiveAt,
      })
    }

    // Return tier distribution for the artist (for BackerRing)
    const tierCounts = await prisma.fan.groupBy({
      by: ['tier'],
      where: { userId: artist.id },
      _count: { id: true },
    })

    const distribution = {
      SUPERFAN: 0,
      DEDICATED: 0,
      ENGAGED: 0,
      CASUAL: 0,
      total: 0,
    }

    for (const tc of tierCounts) {
      distribution[tc.tier] = tc._count.id
      distribution.total += tc._count.id
    }

    // Also return city heat (top cities by fan count)
    const cityHeat = await prisma.fan.groupBy({
      by: ['city'],
      where: {
        userId: artist.id,
        city: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    return NextResponse.json({
      artistId: artist.id,
      artistName: artist.artistName || artist.name,
      tiers: distribution,
      cityHeat: cityHeat.map((ch) => ({
        city: ch.city,
        fanCount: ch._count.id,
        weight: distribution.total > 0 ? ch._count.id / distribution.total : 0,
      })),
    })
  } catch (error: any) {
    console.error('[Ecosystem] Tier query error:', error)
    return NextResponse.json(
      { error: 'Internal error', message: error.message },
      { status: 500 }
    )
  }
}
