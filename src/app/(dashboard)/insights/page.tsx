'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout'
import { ConversionFunnel, FanGrowth, TierMigration, SCRTrends } from '@/components/insights'
import { Skeleton, Tabs } from '@/components/ui'
import { useTrends } from '@/hooks/use-dashboard'

const periodTabs = [
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
]

export default function TrendsPage() {
  const [period, setPeriod] = useState('30')
  const days = Number(period)

  const { data: trendsData, isLoading: trendsLoading } = useTrends(days)
  const { data: conversionData, isLoading: conversionLoading } = useQuery({
    queryKey: ['insights', 'conversion'],
    queryFn: async () => {
      const res = await fetch('/api/insights/conversion')
      if (!res.ok) throw new Error('Failed to fetch conversion data')
      return res.json()
    },
    staleTime: 10 * 60 * 1000,
  })

  const history = trendsData?.history ?? []
  const hasData = history.length >= 2

  return (
    <div>
      <PageHeader
        title="Shifts"
        description="Your fanbase shifts"
        actions={<Tabs tabs={periodTabs} value={period} onChange={setPeriod} />}
      />

      {trendsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : !hasData ? (
        <div className="flex items-center justify-center h-64 border border-[#1a1a1a] bg-[#0a0a0a]">
          <p className="text-gray-500 text-sm">
            Shifts appear after a few days of daily snapshots.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FanGrowth data={history} />
          <TierMigration data={history} />

          {conversionLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <ConversionFunnel funnel={conversionData?.funnel || []} />
          )}

          <SCRTrends data={history} />
        </div>
      )}
    </div>
  )
}
