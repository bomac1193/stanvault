import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

/**
 * Prefetch data for dashboard tabs in the background.
 * Staggers requests so the initial page render isn't blocked.
 * Critical data (metrics) fires immediately; everything else defers.
 */
export function usePrefetchAll() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const fetcher = (url: string) => async () => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Prefetch failed: ${url}`)
      return res.json()
    }

    // Immediate — needed for the Overview page (most common landing)
    queryClient.prefetchQuery({
      queryKey: ['dashboard', 'metrics'],
      queryFn: fetcher('/api/dashboard/metrics'),
      staleTime: 5 * 60 * 1000,
    })

    // Deferred — prefetch the rest after the page is interactive
    const deferred = [
      {
        queryKey: ['dashboard', 'scr'],
        queryFn: fetcher('/api/dashboard/scr'),
        staleTime: 15 * 60 * 1000,
      },
      {
        queryKey: ['dashboard', 'superfan-moments'],
        queryFn: fetcher('/api/dashboard/superfan-moments'),
        staleTime: 10 * 60 * 1000,
      },
      {
        queryKey: ['platforms'],
        queryFn: fetcher('/api/platforms'),
        staleTime: 10 * 60 * 1000,
      },
      {
        queryKey: ['insights', 'conversion'],
        queryFn: fetcher('/api/insights/conversion'),
        staleTime: 10 * 60 * 1000,
      },
      {
        queryKey: ['drops'],
        queryFn: fetcher('/api/drops'),
        staleTime: 5 * 60 * 1000,
      },
    ]

    const timer = setTimeout(() => {
      deferred.forEach((opts) => queryClient.prefetchQuery(opts))
    }, 1500)

    return () => clearTimeout(timer)
  }, [queryClient])
}
