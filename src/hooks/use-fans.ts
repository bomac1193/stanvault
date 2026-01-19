import { useQuery } from '@tanstack/react-query'
import { useFanFiltersStore } from '@/stores/fan-filters-store'

interface PlatformLink {
  platform: string
}

interface Fan {
  id: string
  displayName: string
  email?: string
  avatarUrl?: string
  location?: string
  stanScore: number
  tier: string
  lastActiveAt: string
  firstSeenAt: string
  platformLinks: PlatformLink[]
}

interface FansResponse {
  fans: Fan[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  tierCounts: {
    ALL: number
    CASUAL: number
    ENGAGED: number
    DEDICATED: number
    SUPERFAN: number
  }
}

export function useFans() {
  const { tier, search, sortField, sortOrder, page, pageSize } = useFanFiltersStore()

  return useQuery<FansResponse>({
    queryKey: ['fans', { tier, search, sortField, sortOrder, page, pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams({
        tier,
        search,
        sortField,
        sortOrder,
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      const res = await fetch(`/api/fans?${params}`)
      if (!res.ok) throw new Error('Failed to fetch fans')
      return res.json()
    },
  })
}
