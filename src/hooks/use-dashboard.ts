import { useQuery } from '@tanstack/react-query'

interface TierDistribution {
  tier: string
  count: number
  color: string
  [key: string]: string | number
}

interface DashboardMetrics {
  totalFans: number
  superfans: number
  risingFans: number
  avgStanScore: number
  newFansThisMonth: number
  tierDistribution: TierDistribution[]
}

interface Moment {
  id: string
  type: string
  description: string
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
  })
}

export function useSuperfanMoments() {
  return useQuery<{ moments: Moment[] }>({
    queryKey: ['dashboard', 'superfan-moments'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/superfan-moments')
      if (!res.ok) throw new Error('Failed to fetch moments')
      return res.json()
    },
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
  })
}
