import {
  buildSimulationMoments,
  getSimulationPersonas,
  getSimulationSummary,
} from './beta-simulation'

export interface DemoFan {
  id: string
  displayName: string
  email: string
  avatarUrl?: string
  location: string
  stanScore: number
  tier: 'CASUAL' | 'ENGAGED' | 'DEDICATED' | 'SUPERFAN'
  lastActiveAt: string
  firstSeenAt: string
  platformLinks: Array<{ platform: string }>
  personaType?: 'ICP' | 'NON_CUSTOMER' | 'HATER'
  fitBand?: string
  note?: string
}

interface DemoFanQuery {
  tier: string | null
  search: string | null
  sortField: string
  sortOrder: string
  page: number
  pageSize: number
}

function daysSince(dateString: string): number {
  return Math.floor((Date.now() - new Date(dateString).getTime()) / (24 * 60 * 60 * 1000))
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

export function createDemoFans(): DemoFan[] {
  return getSimulationPersonas().map((persona) => ({
    id: persona.id,
    displayName: persona.displayName,
    email: persona.email,
    avatarUrl: undefined,
    location: `${persona.location} · ${persona.region}`,
    stanScore: persona.fitScore,
    tier: persona.tier,
    firstSeenAt: persona.firstSeenAt,
    lastActiveAt: persona.lastActiveAt,
    platformLinks: persona.platformLinks,
    personaType: persona.kind,
    fitBand: persona.fitBand,
    note: persona.thesis,
  }))
}

function sortFans(fans: DemoFan[], sortField: string, sortOrder: string): DemoFan[] {
  const direction = sortOrder === 'asc' ? 1 : -1

  return [...fans].sort((left, right) => {
    let comparison = 0

    if (sortField === 'displayName') {
      comparison = left.displayName.localeCompare(right.displayName)
    } else if (sortField === 'lastActiveAt') {
      comparison = new Date(left.lastActiveAt).getTime() - new Date(right.lastActiveAt).getTime()
    } else if (sortField === 'firstSeenAt') {
      comparison = new Date(left.firstSeenAt).getTime() - new Date(right.firstSeenAt).getTime()
    } else {
      comparison = left.stanScore - right.stanScore
    }

    return comparison * direction
  })
}

export function buildDemoFansResponse(query: DemoFanQuery) {
  const allFans = createDemoFans()
  const normalizedSearch = query.search?.trim().toLowerCase() || ''

  let filtered = allFans

  if (query.tier && query.tier !== 'ALL') {
    filtered = filtered.filter((fan) => fan.tier === query.tier)
  }

  if (normalizedSearch) {
    filtered = filtered.filter((fan) =>
      [fan.displayName, fan.email, fan.location, fan.personaType, fan.fitBand, fan.note]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch))
    )
  }

  const sorted = sortFans(filtered, query.sortField, query.sortOrder)
  const start = (query.page - 1) * query.pageSize
  const fans = sorted.slice(start, start + query.pageSize)

  return {
    fans,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalCount: filtered.length,
      totalPages: Math.ceil(filtered.length / query.pageSize),
    },
    tierCounts: {
      ALL: allFans.length,
      CASUAL: allFans.filter((fan) => fan.tier === 'CASUAL').length,
      ENGAGED: allFans.filter((fan) => fan.tier === 'ENGAGED').length,
      DEDICATED: allFans.filter((fan) => fan.tier === 'DEDICATED').length,
      SUPERFAN: allFans.filter((fan) => fan.tier === 'SUPERFAN').length,
    },
  }
}

export function buildDemoDashboardMetrics() {
  const fans = createDemoFans()
  const summary = getSimulationSummary()
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const totalFans = fans.length
  const superfans = fans.filter((fan) => fan.tier === 'SUPERFAN').length
  const risingFans = fans.filter(
    (fan) => new Date(fan.lastActiveAt).getTime() >= thirtyDaysAgo && fan.stanScore >= 70
  ).length
  const avgStanScore = Math.round(
    fans.reduce((sum, fan) => sum + fan.stanScore, 0) / Math.max(totalFans, 1)
  )
  const newFansThisMonth = fans.filter(
    (fan) => new Date(fan.firstSeenAt).getTime() >= startOfMonth.getTime()
  ).length

  const tierDistribution = [
    { tier: 'Core', dbTier: 'SUPERFAN', count: superfans, color: '#FFFFFF' },
    {
      tier: 'Strong',
      dbTier: 'DEDICATED',
      count: fans.filter((fan) => fan.tier === 'DEDICATED').length,
      color: '#A3A3A3',
    },
    {
      tier: 'Steady',
      dbTier: 'ENGAGED',
      count: fans.filter((fan) => fan.tier === 'ENGAGED').length,
      color: '#525252',
    },
    {
      tier: 'Faint',
      dbTier: 'CASUAL',
      count: fans.filter((fan) => fan.tier === 'CASUAL').length,
      color: '#333333',
    },
  ].map((item) => {
    const tierFans = fans.filter((fan) => fan.tier === item.dbTier)

    return {
      ...item,
      avgScore:
        tierFans.length > 0
          ? Math.round(tierFans.reduce((sum, fan) => sum + fan.stanScore, 0) / tierFans.length)
          : 0,
      newThisMonth: tierFans.filter(
        (fan) => new Date(fan.firstSeenAt).getTime() >= startOfMonth.getTime()
      ).length,
    }
  })

  return {
    totalFans,
    superfans,
    risingFans,
    avgStanScore,
    newFansThisMonth,
    tierDistribution,
    simulationSummary: summary,
    metrics: {
      totalFans: {
        value: totalFans,
        change: newFansThisMonth,
        changeType: 'increase' as const,
      },
      superfans: {
        value: superfans,
        percentage: totalFans > 0 ? Math.round((superfans / totalFans) * 100) : 0,
      },
      risingFans: {
        value: risingFans,
        label: 'High-fit profiles active recently',
      },
      avgStanScore: {
        value: avgStanScore,
        max: 100,
      },
    },
  }
}

export function buildDemoMoments() {
  return buildSimulationMoments()
}

export function buildDemoSCR() {
  const fans = createDemoFans()
  const totalFans = fans.length || 1
  const superfans = fans.filter((fan) => fan.tier === 'SUPERFAN').length
  const multiPlatformFans = fans.filter((fan) => fan.platformLinks.length > 2).length
  const activeFans = fans.filter((fan) => daysSince(fan.lastActiveAt) <= 30).length

  const holdRate = round(0.42 + superfans / totalFans)
  const holdRate30Day = round(0.48 + activeFans / totalFans / 2)
  const depthVelocity = round(0.24 + superfans / totalFans)
  const platformIndependence = round(multiPlatformFans / totalFans)
  const churnRate = round(Math.max(0.05, 0.22 - superfans / totalFans))
  const scr = round(
    holdRate * 1.1 +
      holdRate30Day * 0.7 +
      depthVelocity * 0.9 +
      platformIndependence * 0.8 -
      churnRate * 0.9
  )

  const history = Array.from({ length: 30 }, (_, index) => {
    const dayOffset = 29 - index
    const date = new Date()
    date.setDate(date.getDate() - dayOffset)
    date.setHours(0, 0, 0, 0)

    const drift = Math.sin(index / 5) * 0.08
    const value = round(Math.max(0.4, scr - 0.18 + drift))

    return {
      date: date.toISOString().split('T')[0],
      scr: value,
      holdRate: round(Math.max(0.35, holdRate - 0.06 + drift / 2)),
      churnRate: round(Math.max(0.04, churnRate + 0.01 - drift / 3)),
    }
  })

  let interpretation = 'Moderate fit. The simulation says the product works best when direct channels already exist.'
  if (scr >= 3)
    interpretation = 'Exceptional fit. Africa-first operators convert cleanly into owned relationships.'
  else if (scr >= 1.5)
    interpretation = 'Strong fit. Africa leads, diaspora expansion works, and Asia remains selective.'
  else if (scr < 0.5)
    interpretation = 'Weak fit. Too many profiles still depend on platforms they do not own.'

  return {
    scr,
    components: {
      holdRate,
      holdRate30Day,
      depthVelocity,
      platformIndependence,
      churnRate,
    },
    interpretation,
    trend: 'up' as const,
    trendPercent: 8,
    history,
  }
}
