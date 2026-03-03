'use client'

import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout'
import { Skeleton } from '@/components/ui'
import {
  CityIntelligence,
  DropPerformance,
  PlatformGaps,
  RevenueCard,
  FanPrintRecommendations,
  FanHeatmap,
} from '@/components/fanprint'
import { useFanPrint } from '@/hooks/use-fanprint'
import { generateRecommendations } from '@/lib/fanprint/recommendations'

export default function FanPrintPage() {
  const { data, isLoading } = useFanPrint()

  const { data: geoData } = useQuery({
    queryKey: ['geography'],
    queryFn: async () => {
      const res = await fetch('/api/insights/geography')
      if (!res.ok) throw new Error('Failed to fetch geography')
      return res.json()
    },
  })

  const recommendations = data ? generateRecommendations(data) : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="FanPrint"
        description="Revenue intelligence from your fan data"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fan Heatmap - full width, above city intelligence */}
        {geoData?.geoPoints?.length > 0 && (
          <FanHeatmap geoPoints={geoData.geoPoints} />
        )}

        {/* City Intelligence */}
        {isLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <CityIntelligence cities={data?.cityIntelligence || []} />
        )}

        {/* Drop Performance */}
        {isLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <DropPerformance drops={data?.dropPerformance || []} />
        )}

        {/* Platform Gaps */}
        {isLoading ? (
          <Skeleton className="h-80" />
        ) : (
          <PlatformGaps gaps={data?.platformGaps || []} />
        )}

        {/* Revenue Visibility */}
        {isLoading ? (
          <Skeleton className="h-80" />
        ) : data ? (
          <RevenueCard revenue={data.revenueVisibility} platformGaps={data.platformGaps} />
        ) : null}

        {/* Recommendations - full width */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <FanPrintRecommendations recommendations={recommendations} />
          )}
        </div>
      </div>
    </div>
  )
}
