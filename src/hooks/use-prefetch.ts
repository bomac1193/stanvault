import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

/**
 * Prefetch data for all dashboard tabs in the background.
 * Runs once on layout mount so clicking any tab serves from cache.
 */
export function usePrefetchAll() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const fetcher = (url: string) => async () => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Prefetch failed: ${url}`)
      return res.json()
    }

    // Prefetch all tab data in parallel — fire and forget
    queryClient.prefetchQuery({
      queryKey: ['dashboard', 'metrics'],
      queryFn: fetcher('/api/dashboard/metrics'),
      staleTime: 5 * 60 * 1000,
    })

    queryClient.prefetchQuery({
      queryKey: ['dashboard', 'superfan-moments'],
      queryFn: fetcher('/api/dashboard/superfan-moments'),
      staleTime: 10 * 60 * 1000,
    })

    queryClient.prefetchQuery({
      queryKey: ['dashboard', 'scr'],
      queryFn: fetcher('/api/dashboard/scr'),
      staleTime: 15 * 60 * 1000,
    })

    queryClient.prefetchQuery({
      queryKey: ['fans', { tier: 'SUPERFAN', search: '', sortField: 'stanScore', sortOrder: 'desc', page: 1, pageSize: 20 }],
      queryFn: fetcher('/api/fans?tier=SUPERFAN&search=&sortField=stanScore&sortOrder=desc&page=1&pageSize=20'),
      staleTime: 5 * 60 * 1000,
    })

    queryClient.prefetchQuery({
      queryKey: ['platforms'],
      queryFn: fetcher('/api/platforms'),
      staleTime: 10 * 60 * 1000,
    })

    queryClient.prefetchQuery({
      queryKey: ['insights', 'conversion'],
      queryFn: fetcher('/api/insights/conversion'),
      staleTime: 10 * 60 * 1000,
    })

    queryClient.prefetchQuery({
      queryKey: ['insights', 'geography'],
      queryFn: fetcher('/api/insights/geography'),
      staleTime: 10 * 60 * 1000,
    })

    queryClient.prefetchQuery({
      queryKey: ['drops'],
      queryFn: fetcher('/api/drops'),
      staleTime: 5 * 60 * 1000,
    })
  }, [queryClient])
}
