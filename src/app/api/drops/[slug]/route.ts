import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFanUser } from '@/lib/fan-auth/service'
import { FanTier } from '@prisma/client'

// Tier hierarchy for comparison
const TIER_LEVELS: Record<FanTier, number> = {
  CASUAL: 1,
  ENGAGED: 2,
  DEDICATED: 3,
  SUPERFAN: 4,
}

// GET /api/drops/[slug] - Get drop details (public info)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const drop = await prisma.drop.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          id: true,
          artistName: true,
          name: true,
          image: true,
          spotifyArtistId: true,
        },
      },
      _count: { select: { claims: true } },
    },
  })

  if (!drop) {
    return NextResponse.json({ error: 'Drop not found' }, { status: 404 })
  }

  // Check if drop is active and within time window
  const now = new Date()
  const isAvailable =
    drop.isActive &&
    (!drop.startsAt || drop.startsAt <= now) &&
    (!drop.endsAt || drop.endsAt >= now) &&
    (drop.maxClaims === null || drop._count.claims < drop.maxClaims)

  // Public info (no content URL)
  return NextResponse.json({
    drop: {
      id: drop.id,
      slug: drop.slug,
      title: drop.title,
      description: drop.description,
      contentType: drop.contentType,
      minTier: drop.minTier,
      minScore: drop.minScore,
      minMonths: drop.minMonths,
      startsAt: drop.startsAt,
      endsAt: drop.endsAt,
      maxClaims: drop.maxClaims,
      claimCount: drop._count.claims,
      isAvailable,
      artist: drop.user,
    },
  })
}

// POST /api/drops/[slug] - Verify access and claim drop
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Get logged in fan user
  const fanUser = await getFanUser()
  if (!fanUser) {
    return NextResponse.json(
      { error: 'Login required', requiresAuth: true },
      { status: 401 }
    )
  }

  // Get the drop
  const drop = await prisma.drop.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          id: true,
          artistName: true,
          name: true,
          spotifyArtistId: true,
        },
      },
      _count: { select: { claims: true } },
    },
  })

  if (!drop) {
    return NextResponse.json({ error: 'Drop not found' }, { status: 404 })
  }

  // Check if already claimed
  const existingClaim = await prisma.dropClaim.findUnique({
    where: {
      dropId_fanUserId: {
        dropId: drop.id,
        fanUserId: fanUser.id,
      },
    },
  })

  if (existingClaim) {
    // Already claimed - return content
    return NextResponse.json({
      success: true,
      alreadyClaimed: true,
      content: drop.contentUrl,
      contentType: drop.contentType,
    })
  }

  // Check availability
  const now = new Date()
  if (!drop.isActive) {
    return NextResponse.json({ error: 'This drop is no longer active' }, { status: 403 })
  }
  if (drop.startsAt && drop.startsAt > now) {
    return NextResponse.json({ error: 'This drop has not started yet' }, { status: 403 })
  }
  if (drop.endsAt && drop.endsAt < now) {
    return NextResponse.json({ error: 'This drop has ended' }, { status: 403 })
  }
  if (drop.maxClaims !== null && drop._count.claims >= drop.maxClaims) {
    return NextResponse.json({ error: 'This drop has reached its claim limit' }, { status: 403 })
  }

  // Get fan's relationship with this artist
  const relationship = await prisma.fanUserArtistLink.findUnique({
    where: {
      fanUserId_artistId: {
        fanUserId: fanUser.id,
        artistId: drop.userId,
      },
    },
  })

  if (!relationship) {
    return NextResponse.json(
      {
        error: 'You need to verify your relationship with this artist first',
        requiresVerification: true,
        artistId: drop.userId,
        artistName: drop.user.artistName || drop.user.name,
        spotifyArtistId: drop.user.spotifyArtistId,
      },
      { status: 403 }
    )
  }

  if (!relationship.verified) {
    return NextResponse.json(
      {
        error: 'Your fan status has not been verified yet',
        requiresVerification: true,
        artistId: drop.userId,
      },
      { status: 403 }
    )
  }

  // Check tier requirement
  if (drop.minTier) {
    const requiredLevel = TIER_LEVELS[drop.minTier]
    const fanLevel = TIER_LEVELS[relationship.tier]
    if (fanLevel < requiredLevel) {
      return NextResponse.json(
        {
          error: `This drop requires ${drop.minTier} tier or higher. You are currently ${relationship.tier}.`,
          yourTier: relationship.tier,
          requiredTier: drop.minTier,
        },
        { status: 403 }
      )
    }
  }

  // Check score requirement
  if (drop.minScore && relationship.stanScore < drop.minScore) {
    return NextResponse.json(
      {
        error: `This drop requires a stan score of ${drop.minScore}+. Your score is ${relationship.stanScore}.`,
        yourScore: relationship.stanScore,
        requiredScore: drop.minScore,
      },
      { status: 403 }
    )
  }

  // Check relationship duration
  if (drop.minMonths) {
    const monthsSince = Math.floor(
      (now.getTime() - relationship.firstSeenAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    if (monthsSince < drop.minMonths) {
      return NextResponse.json(
        {
          error: `This drop requires ${drop.minMonths}+ months as a fan. You've been a fan for ${monthsSince} months.`,
          yourMonths: monthsSince,
          requiredMonths: drop.minMonths,
        },
        { status: 403 }
      )
    }
  }

  // All checks passed - create claim
  await prisma.dropClaim.create({
    data: {
      dropId: drop.id,
      fanUserId: fanUser.id,
      tier: relationship.tier,
      stanScore: relationship.stanScore,
    },
  })

  return NextResponse.json({
    success: true,
    alreadyClaimed: false,
    content: drop.contentUrl,
    contentType: drop.contentType,
    message: 'Drop claimed successfully!',
  })
}
