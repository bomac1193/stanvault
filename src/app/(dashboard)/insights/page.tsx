'use client'

import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout'
import { ConversionFunnel, GeographyList, Recommendations } from '@/components/insights'
import { Skeleton } from '@/components/ui'

export default function InsightsPage() {
  const { data: conversionData, isLoading: conversionLoading } = useQuery({
    queryKey: ['insights', 'conversion'],
    queryFn: async () => {
      const res = await fetch('/api/insights/conversion')
      if (!res.ok) throw new Error('Failed to fetch conversion data')
      return res.json()
    },
  })

  const { data: geoData, isLoading: geoLoading } = useQuery({
    queryKey: ['insights', 'geography'],
    queryFn: async () => {
      const res = await fetch('/api/insights/geography')
      if (!res.ok) throw new Error('Failed to fetch geography data')
      return res.json()
    },
  })

  const { data: metricsData } = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/metrics')
      if (!res.ok) throw new Error('Failed to fetch metrics')
      return res.json()
    },
  })

  const { data: platformsData } = useQuery({
    queryKey: ['platforms'],
    queryFn: async () => {
      const res = await fetch('/api/platforms')
      if (!res.ok) throw new Error('Failed to fetch platforms')
      return res.json()
    },
  })

  const superfanPercentage =
    metricsData?.totalFans > 0
      ? Math.round((metricsData.superfans / metricsData.totalFans) * 100)
      : 0

  return (
    <div>
      <PageHeader
        title="Insights"
        description="Deep dive into your fan data"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        {conversionLoading ? (
          <Skeleton className="h-80" />
        ) : (
          <ConversionFunnel funnel={conversionData?.funnel || []} />
        )}

        {/* Geography */}
        {geoLoading ? (
          <Skeleton className="h-80" />
        ) : (
          <GeographyList
            countries={geoData?.countries || []}
            cities={geoData?.cities || []}
          />
        )}

        {/* Recommendations */}
        <div className="lg:col-span-2">
          <Recommendations
            totalFans={metricsData?.totalFans || 0}
            superfanPercentage={superfanPercentage}
            topCountry={geoData?.countries?.[0]?.name}
            connectedPlatforms={platformsData?.connections?.length || 0}
          />
        </div>
      </div>
    </div>
  )
}
