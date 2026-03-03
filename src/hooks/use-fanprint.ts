import { useQuery } from '@tanstack/react-query'
import { type FanPrintData } from '@/lib/fanprint/recommendations'

export function useFanPrint() {
  return useQuery<FanPrintData>({
    queryKey: ['fanprint'],
    queryFn: async () => {
      const res = await fetch('/api/fanprint')
      if (!res.ok) throw new Error('Failed to fetch FanPrint data')
      return res.json()
    },
  })
}
