import { useQuery } from '@tanstack/react-query'

interface TierDistribution {
  tier: string
  count: number
  color: string
  [key: string]: string | number
}

interface RegionSimulationSummary {
  region: string
  icpCount: number
  avgFit: number
  coreCount: number
  verdict: string
}

interface SimulationSummary {
  totalParticipants: number
  icpCount: number
  nonCustomerCount: number
  haterCount: number
  coreAudienceCount: number
  expansionCount: number
  thesis: string
  recommendedRollout: string[]
  regionBreakdown: RegionSimulationSummary[]
  apiPriorities: {
    connect: string[]
    reach: string[]
    rails: string[]
  }
  blindspots: string[]
}

interface DashboardMetrics {
  previewMode?: 'real' | 'demo'
  totalFans: number
  superfans: number
  risingFans: number
  avgStanScore: number
  newFansThisMonth: number
  tierDistribution: TierDistribution[]
  simulationSummary?: SimulationSummary
}

interface Moment {
  id: string
  type: string
  description: string
  reason?: string
  platform?: string
  occurredAt: string
  fan: {
    id: string
    name: string
    avatar?: string
    tier: string
    score: number
  }
}

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/metrics')
      if (!res.ok) throw new Error('Failed to fetch metrics')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,   // 5 min
  })
}

export function useSuperfanMoments() {
  return useQuery<{ moments: Moment[]; previewMode?: 'real' | 'demo' }>({
    queryKey: ['dashboard', 'superfan-moments'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/superfan-moments')
      if (!res.ok) throw new Error('Failed to fetch moments')
      return res.json()
    },
    staleTime: 10 * 60 * 1000,  // 10 min — moments don't change fast
  })
}

interface SCRComponents {
  holdRate: number
  holdRate30Day: number
  depthVelocity: number
  platformIndependence: number
  churnRate: number
}

interface SCRHistoryPoint {
  date: string
  scr: number | null
  holdRate: number | null
  churnRate: number | null
}

interface SCRData {
  scr: number
  components: SCRComponents
  interpretation: string
  trend: 'up' | 'down' | 'stable'
  trendPercent: number
  history: SCRHistoryPoint[]
}

export function useSCR() {
  return useQuery<SCRData>({
    queryKey: ['dashboard', 'scr'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/scr')
      if (!res.ok) throw new Error('Failed to fetch SCR')
      return res.json()
    },
    staleTime: 15 * 60 * 1000, // 15 min — daily metric, no need to recalculate
  })
}

interface TrendPoint {
  date: string
  totalFans: number
  casualCount: number
  engagedCount: number
  dedicatedCount: number
  superfanCount: number
  holdRate90Day: number | null
  holdRate30Day: number | null
  depthVelocity: number | null
  platformIndependence: number | null
  churnRate: number | null
  scr: number | null
  newFansCount: number | null
  churnedFansCount: number | null
  upgradedFansCount: number | null
}

interface TrendsData {
  days: number
  history: TrendPoint[]
}

export function useTrends(days: number = 30) {
  return useQuery<TrendsData>({
    queryKey: ['insights', 'trends', days],
    queryFn: async () => {
      const res = await fetch(`/api/insights/trends?days=${days}`)
      if (!res.ok) throw new Error('Failed to fetch trends')
      return res.json()
    },
    staleTime: 10 * 60 * 1000, // 10 min — daily snapshots
  })
}
