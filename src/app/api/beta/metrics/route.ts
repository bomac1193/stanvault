// Beta metrics dashboard — calculates all 9 success metrics from the 200-user beta plan
// GET /api/beta/metrics
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

function isAdmin(email?: string | null): boolean {
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
  if (!email) return false
  return admins.includes(email.toLowerCase())
}

interface BetaMetrics {
  // 1. Core ICP artist retention (Afrobeats + diaspora + managers)
  coreIcpRetention: { retained: number; total: number; rate: number }
  // 2. Starter tier artist retention
  starterRetention: { retained: number; total: number; rate: number }
  // 3. Fan 90-day retention
  fanRetention: { retained: number; total: number; rate: number }
  // 4. Drops created per retained artist
  dropsPerArtist: { totalDrops: number; retainedArtists: number; avg: number }
  // 5. Fan Spotify verification rate
  spotifyVerificationRate: { verified: number; total: number; rate: number }
  // 6. Fan drop claim rate
  dropClaimRate: { claimers: number; totalFans: number; rate: number }
  // 7. Cross-artist fan verification
  crossArtistVerification: { multiArtistFans: number; totalVerifiedFans: number; rate: number }
  // 8. Starter → Private Circle upgrade
  starterUpgradeRate: { upgraded: number; totalStarter: number; rate: number }
  // 9. New conviction scoring activation (non-Dasham artists)
  convictionActivation: { activated: number; totalNonDasham: number; rate: number }
  // Metadata
  betaStartDate: string | null
  daysRunning: number
  totalArtists: number
  totalFans: number
  cohortBreakdown: {
    artists: Record<string, number>
    fans: Record<string, number>
  }
}

const CORE_ICP_COHORTS = ['CORE_AFROBEATS', 'DIASPORA', 'MANAGER'] as const

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const retentionDays = parseInt(searchParams.get('days') || '90')
  const cutoff = subDays(new Date(), retentionDays)
  const activeCutoff = subDays(new Date(), 30) // Active = logged in within 30 days

  // Get all beta artists (users with a betaCohort assigned)
  const betaArtists = await prisma.user.findMany({
    where: { betaCohort: { not: null } },
    select: {
      id: true,
      email: true,
      betaCohort: true,
      pricingTier: true,
      betaJoinedAt: true,
      updatedAt: true,
      _count: { select: { drops: true, fans: true } },
    },
  })

  // Get all beta fans
  const betaFans = await prisma.fanUser.findMany({
    where: { betaCohort: { not: null } },
    select: {
      id: true,
      betaCohort: true,
      betaJoinedAt: true,
      updatedAt: true,
      spotifyUserId: true,
      platformConnections: {
        where: {
          platform: 'SPOTIFY',
          status: 'CONNECTED',
        },
        select: { id: true },
      },
      _count: { select: { artistRelationships: true, dropClaims: true } },
    },
  })

  // Find beta start date
  const betaStartDate = betaArtists.reduce<Date | null>((earliest, a) => {
    const d = a.betaJoinedAt
    if (!d) return earliest
    if (!earliest || d < earliest) return d
    return earliest
  }, null)

  // --- Metric 1: Core ICP artist retention ---
  const coreIcpArtists = betaArtists.filter((a) =>
    CORE_ICP_COHORTS.includes(a.betaCohort as (typeof CORE_ICP_COHORTS)[number])
  )
  const coreIcpJoinedBefore = coreIcpArtists.filter(
    (a) => a.betaJoinedAt && a.betaJoinedAt <= cutoff
  )
  const coreIcpRetained = coreIcpJoinedBefore.filter((a) => a.updatedAt >= activeCutoff)

  // --- Metric 2: Starter tier artist retention ---
  const starterArtists = betaArtists.filter((a) => a.pricingTier === 'STARTER')
  const starterJoinedBefore = starterArtists.filter(
    (a) => a.betaJoinedAt && a.betaJoinedAt <= cutoff
  )
  const starterRetained = starterJoinedBefore.filter((a) => a.updatedAt >= activeCutoff)

  // --- Metric 3: Fan 90-day retention ---
  const fansJoinedBefore = betaFans.filter(
    (f) => f.betaJoinedAt && f.betaJoinedAt <= cutoff
  )
  const fansRetained = fansJoinedBefore.filter((f) => f.updatedAt >= activeCutoff)

  // --- Metric 4: Drops per retained artist ---
  const retainedArtists = betaArtists.filter((a) => a.updatedAt >= activeCutoff)
  const totalDrops = retainedArtists.reduce((sum, a) => sum + a._count.drops, 0)

  // --- Metric 5: Fan Spotify verification rate ---
  const fansWithSpotify = betaFans.filter(
    (f) => f.spotifyUserId || f.platformConnections.length > 0
  )

  // --- Metric 6: Fan drop claim rate ---
  const fansWhoClaimed = betaFans.filter((f) => f._count.dropClaims > 0)

  // --- Metric 7: Cross-artist fan verification ---
  const verifiedFanLinks = await prisma.fanUserArtistLink.groupBy({
    by: ['fanUserId'],
    where: {
      verified: true,
      fanUser: { betaCohort: { not: null } },
    },
    _count: true,
  })
  const multiArtistFans = verifiedFanLinks.filter((g) => g._count >= 2).length
  const totalVerifiedFans = verifiedFanLinks.length

  // --- Metric 8: Starter → Private Circle upgrade ---
  // Artists who WERE Starter (have betaCohort suggesting Starter target) but are now Private Circle
  const starterCohorts = ['DIRECT_TO_FAN_INDIE', 'EXPERIMENTAL_NICHE', 'PRODUCER_DJ', 'INDIE_HIPHOP_RNB']
  const originalStarter = betaArtists.filter((a) => starterCohorts.includes(a.betaCohort || ''))
  const upgradedToPC = originalStarter.filter((a) => a.pricingTier === 'PRIVATE_CIRCLE')

  // --- Metric 9: New conviction scoring activation ---
  // Non-Dasham artists whose fans have conviction score > 0
  const nonDashamArtists = betaArtists.filter((a) =>
    starterCohorts.includes(a.betaCohort || '')
  )
  let activatedCount = 0
  if (nonDashamArtists.length > 0) {
    const artistIds = nonDashamArtists.map((a) => a.id)
    const artistsWithConviction = await prisma.fan.groupBy({
      by: ['userId'],
      where: {
        userId: { in: artistIds },
        convictionScore: { gt: 0 },
      },
    })
    activatedCount = artistsWithConviction.length
  }

  // --- Cohort breakdown ---
  const artistCohortCounts: Record<string, number> = {}
  for (const a of betaArtists) {
    const cohort = a.betaCohort || 'UNASSIGNED'
    artistCohortCounts[cohort] = (artistCohortCounts[cohort] || 0) + 1
  }
  const fanCohortCounts: Record<string, number> = {}
  for (const f of betaFans) {
    const cohort = f.betaCohort || 'UNASSIGNED'
    fanCohortCounts[cohort] = (fanCohortCounts[cohort] || 0) + 1
  }

  const safeRate = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10)

  const metrics: BetaMetrics = {
    coreIcpRetention: {
      retained: coreIcpRetained.length,
      total: coreIcpJoinedBefore.length,
      rate: safeRate(coreIcpRetained.length, coreIcpJoinedBefore.length),
    },
    starterRetention: {
      retained: starterRetained.length,
      total: starterJoinedBefore.length,
      rate: safeRate(starterRetained.length, starterJoinedBefore.length),
    },
    fanRetention: {
      retained: fansRetained.length,
      total: fansJoinedBefore.length,
      rate: safeRate(fansRetained.length, fansJoinedBefore.length),
    },
    dropsPerArtist: {
      totalDrops,
      retainedArtists: retainedArtists.length,
      avg:
        retainedArtists.length === 0
          ? 0
          : Math.round((totalDrops / retainedArtists.length) * 10) / 10,
    },
    spotifyVerificationRate: {
      verified: fansWithSpotify.length,
      total: betaFans.length,
      rate: safeRate(fansWithSpotify.length, betaFans.length),
    },
    dropClaimRate: {
      claimers: fansWhoClaimed.length,
      totalFans: betaFans.length,
      rate: safeRate(fansWhoClaimed.length, betaFans.length),
    },
    crossArtistVerification: {
      multiArtistFans,
      totalVerifiedFans,
      rate: safeRate(multiArtistFans, totalVerifiedFans),
    },
    starterUpgradeRate: {
      upgraded: upgradedToPC.length,
      totalStarter: originalStarter.length,
      rate: safeRate(upgradedToPC.length, originalStarter.length),
    },
    convictionActivation: {
      activated: activatedCount,
      totalNonDasham: nonDashamArtists.length,
      rate: safeRate(activatedCount, nonDashamArtists.length),
    },
    betaStartDate: betaStartDate?.toISOString() || null,
    daysRunning: betaStartDate
      ? Math.floor((Date.now() - betaStartDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0,
    totalArtists: betaArtists.length,
    totalFans: betaFans.length,
    cohortBreakdown: {
      artists: artistCohortCounts,
      fans: fanCohortCounts,
    },
  }

  // Add target/kill threshold comparison
  const thresholds = {
    coreIcpRetention: { target: 75, kill: 50 },
    starterRetention: { target: 40, kill: 20 },
    fanRetention: { target: 45, kill: 25 },
    dropsPerArtist: { target: 3, kill: 1 },
    spotifyVerificationRate: { target: 80, kill: 50 },
    dropClaimRate: { target: 55, kill: 30 },
    crossArtistVerification: { target: 20, kill: 10 },
    starterUpgradeRate: { target: 15, kill: null },
    convictionActivation: { target: 60, kill: 30 },
  }

  return NextResponse.json({ metrics, thresholds })
}
