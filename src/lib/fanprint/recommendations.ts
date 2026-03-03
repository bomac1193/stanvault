interface CityIntelligence {
  city: string
  country: string
  fanCount: number
  avgStanScore: number
  avgConviction: number
  totalRevenue: number
  tiers: { superfan: number; dedicated: number; engaged: number; casual: number }
}

interface DropPerformance {
  dropId: string
  title: string
  totalClaims: number
  claimsByTier: { superfan: number; dedicated: number; engaged: number; casual: number }
  avgClaimScore: number
}

interface PlatformGap {
  platform: string
  dedicatedPlusFans: number
  dedicatedPlusTotal: number
  percentage: number
  avgRevenue: number
}

interface RevenueVisibility {
  totalVisibleRevenue: number
  fansWithFinancial: number
  totalFans: number
  visibilityRate: number
  topRevenueSource: string
}

export interface FanPrintData {
  cityIntelligence: CityIntelligence[]
  dropPerformance: DropPerformance[]
  platformGaps: PlatformGap[]
  revenueVisibility: RevenueVisibility
}

export interface Recommendation {
  type: 'city' | 'drop' | 'platform' | 'revenue'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

export function generateRecommendations(data: FanPrintData): Recommendation[] {
  const recs: Recommendation[] = []

  // ── City-based recommendations ──────────────────────────────
  const highConvictionLowTier = data.cityIntelligence.find(
    (c) => c.avgConviction > 10 && c.tiers.dedicated + c.tiers.superfan < c.fanCount * 0.1
  )
  if (highConvictionLowTier) {
    const topCount = highConvictionLowTier.tiers.dedicated + highConvictionLowTier.tiers.superfan
    recs.push({
      type: 'city',
      priority: 'high',
      title: `${highConvictionLowTier.city} fans are spending but not deepening`,
      description: `${highConvictionLowTier.fanCount} fans, avg conviction ${highConvictionLowTier.avgConviction.toFixed(1)}, but only ${topCount} DEDICATED+. Consider a targeted drop or campaign.`,
    })
  }

  // High revenue city with low fan count
  const highRevenueLowFans = data.cityIntelligence.find(
    (c) => c.totalRevenue > 0 && c.fanCount < 10
  )
  if (highRevenueLowFans) {
    recs.push({
      type: 'city',
      priority: 'medium',
      title: `${highRevenueLowFans.city} has high revenue per fan`,
      description: `$${highRevenueLowFans.totalRevenue.toFixed(2)} from just ${highRevenueLowFans.fanCount} fans. Growing your presence there could multiply revenue.`,
    })
  }

  // ── Platform gap recommendations ────────────────────────────
  const lowMerch = data.platformGaps.find((p) => p.platform === 'MERCH' && p.percentage < 20)
  if (lowMerch) {
    const missing = lowMerch.dedicatedPlusTotal - lowMerch.dedicatedPlusFans
    recs.push({
      type: 'platform',
      priority: 'high',
      title: `Only ${lowMerch.percentage}% of your top fans buy merch`,
      description: `${missing} DEDICATED+ fans haven't purchased merch. Consider launching or promoting a merch store.`,
    })
  }

  const lowBandcamp = data.platformGaps.find(
    (p) => p.platform === 'BANDCAMP' && p.percentage < 30
  )
  if (lowBandcamp) {
    recs.push({
      type: 'platform',
      priority: 'medium',
      title: `Only ${lowBandcamp.percentage}% of top fans are on Bandcamp`,
      description: `Bandcamp purchases are a strong conviction signal. Encourage DEDICATED fans to support you directly on Bandcamp.`,
    })
  }

  const lowKofi = data.platformGaps.find((p) => p.platform === 'KOFI' && p.percentage < 20)
  if (lowKofi) {
    recs.push({
      type: 'platform',
      priority: 'low',
      title: `Ko-fi adoption is ${lowKofi.percentage}% among top fans`,
      description: `Set up a Ko-fi page to give fans an easy way to tip — even small amounts boost conviction visibility.`,
    })
  }

  // ── Drop performance recommendations ────────────────────────
  if (data.dropPerformance.length > 0) {
    const dropsWithClaims = data.dropPerformance.filter((d) => d.totalClaims > 0)
    if (dropsWithClaims.length > 0) {
      // Check if ENGAGED fans claim more than CASUAL
      const totalEngaged = dropsWithClaims.reduce((s, d) => s + d.claimsByTier.engaged, 0)
      const totalCasual = dropsWithClaims.reduce((s, d) => s + d.claimsByTier.casual, 0)
      if (totalEngaged > totalCasual * 3 && totalCasual > 0) {
        recs.push({
          type: 'drop',
          priority: 'medium',
          title: `ENGAGED fans claim drops ${Math.round(totalEngaged / totalCasual)}x more than CASUAL`,
          description: `Lower the min tier on your next drop to convert CASUAL fans upward. Drops are a great tier-promotion tool.`,
        })
      }
    }

    const zeroClaims = data.dropPerformance.filter((d) => d.totalClaims === 0)
    if (zeroClaims.length > 0) {
      recs.push({
        type: 'drop',
        priority: 'low',
        title: `${zeroClaims.length} drop${zeroClaims.length > 1 ? 's have' : ' has'} zero claims`,
        description: `"${zeroClaims[0].title}" hasn't been claimed yet. Share it with your fan community or lower the gating requirements.`,
      })
    }
  } else {
    recs.push({
      type: 'drop',
      priority: 'medium',
      title: 'No drops created yet',
      description: 'Create a gated drop to reward your top fans and drive tier upgrades. Even a simple message or link works.',
    })
  }

  // ── Revenue visibility recommendations ──────────────────────
  if (data.revenueVisibility.visibilityRate < 0.2) {
    recs.push({
      type: 'revenue',
      priority: 'medium',
      title: `${Math.round(data.revenueVisibility.visibilityRate * 100)}% revenue visibility`,
      description: `Most of your fans' spending is invisible. Encourage fans to support via Ko-fi, Bandcamp, or Dasham to improve scoring accuracy.`,
    })
  }

  if (data.revenueVisibility.totalVisibleRevenue === 0 && data.revenueVisibility.totalFans > 0) {
    recs.push({
      type: 'revenue',
      priority: 'high',
      title: 'No visible revenue tracked',
      description: `You have ${data.revenueVisibility.totalFans} fans but no revenue data. Connect revenue-generating platforms (Bandcamp, Dasham, Ko-fi) to see where money flows.`,
    })
  }

  return recs
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, 5)
}
