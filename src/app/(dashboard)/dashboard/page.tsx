'use client'

import { PageHeader } from '@/components/layout'
import { MetricCard, TierChart, SuperfanMoments } from '@/components/dashboard'
import { MetricCardSkeleton, Skeleton } from '@/components/ui'
import { useDashboardMetrics, useSuperfanMoments } from '@/hooks/use-dashboard'
import { Users, Star, TrendingUp, Target } from 'lucide-react'

export default function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: momentsData, isLoading: momentsLoading } = useSuperfanMoments()

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your fan intelligence overview"
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricsLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Total Fans"
              value={metrics?.totalFans?.toLocaleString() || '0'}
              change={metrics?.newFansThisMonth}
              changeType="increase"
              icon={Users}
            />
            <MetricCard
              title="Superfans"
              value={metrics?.superfans?.toLocaleString() || '0'}
              subtitle={`${metrics?.totalFans ? Math.round((metrics.superfans / metrics.totalFans) * 100) : 0}% of total`}
              icon={Star}
            />
            <MetricCard
              title="Rising Fans"
              value={metrics?.risingFans?.toLocaleString() || '0'}
              subtitle="High engagement recently"
              icon={TrendingUp}
            />
            <MetricCard
              title="Avg Stan Score"
              value={metrics?.avgStanScore || 0}
              subtitle="out of 100"
              icon={Target}
            />
          </>
        )}
      </div>

      {/* Charts and Moments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metricsLoading ? (
          <div className="bg-vault-dark border border-vault-gray rounded-lg p-6">
            <Skeleton className="h-6 w-40 mb-6" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <TierChart data={metrics?.tierDistribution || []} />
        )}

        {momentsLoading ? (
          <div className="bg-vault-dark border border-vault-gray rounded-lg p-6">
            <Skeleton className="h-6 w-40 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <SuperfanMoments moments={momentsData?.moments || []} />
        )}
      </div>
    </div>
  )
}
