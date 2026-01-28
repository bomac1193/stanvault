import { prisma } from '@/lib/prisma'
import { FanTier, Platform } from '@prisma/client'
import { subDays, differenceInDays, startOfDay } from 'date-fns'

interface SCRComponents {
  holdRate: number         // 0-1: % of fans retained after 90 days
  holdRate30Day: number    // 0-1: % of fans retained after 30 days
  depthVelocity: number    // 0-1: How fast fans progress (inverted days)
  platformIndependence: number  // 0-1: 1 - HHI of platform distribution
  churnRate: number        // 0-1: % of fans who regressed or went dormant
}

interface SCRResult {
  scr: number
  components: SCRComponents
  interpretation: string
}

/**
 * Calculate the Stan Conversion Rate for an artist
 * SCR = (Hold Rate × Depth Velocity × Platform Independence) / Churn Drag
 */
export async function calculateSCR(userId: string): Promise<SCRResult> {
  const components = await calculateSCRComponents(userId)

  // Avoid division by zero - if no churn, use a small value
  const churnDrag = Math.max(components.churnRate, 0.01)

  // Calculate SCR
  // The formula produces values typically between 0.1 and 10+
  // Higher is better
  const scr = (components.holdRate * components.depthVelocity * components.platformIndependence) / churnDrag

  // Generate interpretation
  let interpretation: string
  if (scr >= 3) {
    interpretation = 'Exceptional fan conversion. Your audience builds lasting connections.'
  } else if (scr >= 1.5) {
    interpretation = 'Strong fan conversion. Most listeners become genuine fans.'
  } else if (scr >= 0.5) {
    interpretation = 'Average fan conversion. Room for deeper engagement.'
  } else if (scr >= 0.2) {
    interpretation = 'Below average conversion. Focus on retention and depth.'
  } else {
    interpretation = 'Low conversion. High churn or shallow engagement.'
  }

  return {
    scr: Math.round(scr * 100) / 100, // Round to 2 decimal places
    components,
    interpretation,
  }
}

/**
 * Calculate all SCR components
 */
async function calculateSCRComponents(userId: string): Promise<SCRComponents> {
  const [holdRate, holdRate30, depthVelocity, platformIndependence, churnRate] = await Promise.all([
    calculateHoldRate(userId, 90),
    calculateHoldRate(userId, 30),
    calculateDepthVelocity(userId),
    calculatePlatformIndependence(userId),
    calculateChurnRate(userId),
  ])

  return {
    holdRate,
    holdRate30Day: holdRate30,
    depthVelocity,
    platformIndependence,
    churnRate,
  }
}

/**
 * Calculate Hold Rate: What % of fans acquired N days ago are still active?
 */
async function calculateHoldRate(userId: string, days: number): Promise<number> {
  const targetDate = subDays(new Date(), days)
  const windowStart = subDays(targetDate, 7)
  const windowEnd = targetDate

  // Get fans acquired during the target window
  const fansAcquiredThen = await prisma.fan.findMany({
    where: {
      userId,
      firstSeenAt: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
    select: {
      id: true,
      lastActiveAt: true,
    },
  })

  if (fansAcquiredThen.length === 0) {
    // No fans in this cohort - return default good rate
    return 0.7
  }

  // Count how many are still active (active within last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30)
  const stillActive = fansAcquiredThen.filter(
    fan => fan.lastActiveAt >= thirtyDaysAgo
  )

  return stillActive.length / fansAcquiredThen.length
}

/**
 * Calculate Depth Velocity: How quickly do fans progress through tiers?
 * Returns 0-1 where higher = faster progression
 */
async function calculateDepthVelocity(userId: string): Promise<number> {
  // Get superfans and their journey to superfan status
  const superfans = await prisma.fan.findMany({
    where: {
      userId,
      tier: 'SUPERFAN',
    },
    select: {
      id: true,
      firstSeenAt: true,
      events: {
        where: {
          eventType: 'BECAME_SUPERFAN',
        },
        orderBy: {
          occurredAt: 'asc',
        },
        take: 1,
      },
    },
  })

  if (superfans.length === 0) {
    // No superfans yet - return middle value
    return 0.3
  }

  // Calculate days to superfan for each
  const daysToSuperfan = superfans.map(fan => {
    const becameSuperfanEvent = fan.events[0]
    if (becameSuperfanEvent) {
      return differenceInDays(becameSuperfanEvent.occurredAt, fan.firstSeenAt)
    }
    // If no event, estimate from current date
    return differenceInDays(new Date(), fan.firstSeenAt)
  })

  // Get median days to superfan
  const sorted = daysToSuperfan.sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]

  // Convert to 0-1 scale (faster = higher)
  // 30 days = 1.0 (very fast)
  // 365 days = 0.0 (very slow)
  const maxDays = 365
  const velocity = 1 - Math.min(median / maxDays, 1)

  return Math.max(velocity, 0.1) // Floor at 0.1
}

/**
 * Calculate Platform Independence: How distributed is engagement across platforms?
 * Uses inverse Herfindahl-Hirschman Index (HHI)
 * Returns 0-1 where higher = more distributed
 */
async function calculatePlatformIndependence(userId: string): Promise<number> {
  // Get fan engagement by platform
  const platformLinks = await prisma.fanPlatformLink.findMany({
    where: {
      fan: { userId },
    },
    select: {
      platform: true,
      streams: true,
      likes: true,
      comments: true,
      shares: true,
      videoViews: true,
      emailOpens: true,
    },
  })

  if (platformLinks.length === 0) {
    return 0.5 // Default middle value
  }

  // Calculate engagement score per platform
  const platformEngagement = new Map<Platform, number>()

  for (const link of platformLinks) {
    const current = platformEngagement.get(link.platform) || 0
    const engagement =
      (link.streams || 0) +
      (link.likes || 0) * 2 +
      (link.comments || 0) * 3 +
      (link.shares || 0) * 4 +
      (link.videoViews || 0) +
      (link.emailOpens || 0) * 2

    platformEngagement.set(link.platform, current + engagement)
  }

  // Calculate total engagement
  const totalEngagement = Array.from(platformEngagement.values()).reduce((a, b) => a + b, 0)

  if (totalEngagement === 0) {
    return 0.5
  }

  // Calculate HHI (sum of squared market shares)
  let hhi = 0
  for (const engagement of platformEngagement.values()) {
    const share = engagement / totalEngagement
    hhi += share * share
  }

  // HHI ranges from 1/n (perfectly distributed) to 1 (monopoly)
  // We want the inverse: 1 - HHI
  return 1 - hhi
}

/**
 * Calculate Churn Rate: What % of fans went dormant or regressed?
 */
async function calculateChurnRate(userId: string): Promise<number> {
  const thirtyDaysAgo = subDays(new Date(), 30)
  const sixtyDaysAgo = subDays(new Date(), 60)

  // Get total fans
  const totalFans = await prisma.fan.count({
    where: { userId },
  })

  if (totalFans === 0) {
    return 0.1 // Default low churn
  }

  // Count fans who went dormant (no activity in 60+ days, but were active before)
  const dormantFans = await prisma.fan.count({
    where: {
      userId,
      lastActiveAt: {
        lt: sixtyDaysAgo,
      },
      firstSeenAt: {
        lt: sixtyDaysAgo,
      },
    },
  })

  // Count tier downgrades in last 30 days
  const recentDowngrades = await prisma.fanEvent.count({
    where: {
      fan: { userId },
      eventType: 'TIER_DOWNGRADE',
      occurredAt: {
        gte: thirtyDaysAgo,
      },
    },
  })

  // Churn = (dormant + downgraded) / total
  const churnedFans = dormantFans + recentDowngrades
  return churnedFans / totalFans
}

/**
 * Take a daily snapshot of fan data for historical tracking
 */
export async function takeDailySnapshot(userId: string): Promise<void> {
  const today = startOfDay(new Date())
  const thirtyDaysAgo = subDays(new Date(), 30)

  // Get all fans
  const fans = await prisma.fan.findMany({
    where: { userId },
    select: {
      id: true,
      stanScore: true,
      tier: true,
      lastActiveAt: true,
    },
  })

  // Create snapshots for each fan
  const snapshots = fans.map(fan => ({
    fanId: fan.id,
    date: today,
    stanScore: fan.stanScore,
    tier: fan.tier,
    isActive: fan.lastActiveAt >= thirtyDaysAgo,
  }))

  // Batch insert (skip duplicates if already taken today)
  await prisma.fanSnapshot.createMany({
    data: snapshots,
    skipDuplicates: true,
  })

  // Calculate and store artist metrics
  const scrResult = await calculateSCR(userId)
  const tierCounts = await getTierCounts(userId)

  await prisma.artistMetricsHistory.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      totalFans: fans.length,
      casualCount: tierCounts.CASUAL,
      engagedCount: tierCounts.ENGAGED,
      dedicatedCount: tierCounts.DEDICATED,
      superfanCount: tierCounts.SUPERFAN,
      holdRate90Day: scrResult.components.holdRate,
      holdRate30Day: scrResult.components.holdRate30Day,
      depthVelocity: scrResult.components.depthVelocity,
      platformIndependence: scrResult.components.platformIndependence,
      churnRate: scrResult.components.churnRate,
      scr: scrResult.scr,
      avgStanScore: fans.length > 0
        ? fans.reduce((sum, f) => sum + f.stanScore, 0) / fans.length
        : 0,
    },
    create: {
      userId,
      date: today,
      totalFans: fans.length,
      casualCount: tierCounts.CASUAL,
      engagedCount: tierCounts.ENGAGED,
      dedicatedCount: tierCounts.DEDICATED,
      superfanCount: tierCounts.SUPERFAN,
      holdRate90Day: scrResult.components.holdRate,
      holdRate30Day: scrResult.components.holdRate30Day,
      depthVelocity: scrResult.components.depthVelocity,
      platformIndependence: scrResult.components.platformIndependence,
      churnRate: scrResult.components.churnRate,
      scr: scrResult.scr,
      avgStanScore: fans.length > 0
        ? fans.reduce((sum, f) => sum + f.stanScore, 0) / fans.length
        : 0,
    },
  })
}

async function getTierCounts(userId: string): Promise<Record<FanTier, number>> {
  const counts = await prisma.fan.groupBy({
    by: ['tier'],
    where: { userId },
    _count: true,
  })

  const result: Record<FanTier, number> = {
    CASUAL: 0,
    ENGAGED: 0,
    DEDICATED: 0,
    SUPERFAN: 0,
  }

  for (const count of counts) {
    result[count.tier] = count._count
  }

  return result
}

/**
 * Get SCR history for an artist
 */
export async function getSCRHistory(
  userId: string,
  days = 30
): Promise<{
  date: Date
  scr: number | null
  holdRate: number | null
  churnRate: number | null
}[]> {
  const startDate = subDays(new Date(), days)

  const history = await prisma.artistMetricsHistory.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
    select: {
      date: true,
      scr: true,
      holdRate90Day: true,
      churnRate: true,
    },
  })

  return history.map(h => ({
    date: h.date,
    scr: h.scr,
    holdRate: h.holdRate90Day,
    churnRate: h.churnRate,
  }))
}
