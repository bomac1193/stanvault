'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { DollarSign } from 'lucide-react'

interface PlatformGapData {
  platform: string
  dedicatedPlusFans: number
  dedicatedPlusTotal: number
  percentage: number
  avgRevenue: number
}

interface RevenueVisibility {
  totalVisibleRevenue: number
  fansWithFinancial: number
  totalFans: number
  visibilityRate: number
  topRevenueSource: string
}

interface RevenueCardProps {
  revenue: RevenueVisibility
  platformGaps: PlatformGapData[]
}

function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    SPOTIFY: 'Spotify',
    INSTAGRAM: 'Instagram',
    TIKTOK: 'TikTok',
    YOUTUBE: 'YouTube',
    TWITTER: 'Twitter / X',
    EMAIL: 'Email',
    DASHAM: 'Dasham',
    BANDCAMP: 'Bandcamp',
    KOFI: 'Ko-fi',
    PATREON: 'Patreon',
    MERCH: 'Merch',
  }
  return labels[platform] || platform
}

export function RevenueCard({ revenue, platformGaps }: RevenueCardProps) {
  const visibilityPercent = Math.round(revenue.visibilityRate * 100)
  const revenuePlatforms = platformGaps
    .filter((p) => p.avgRevenue > 0)
    .sort((a, b) => b.avgRevenue * b.dedicatedPlusFans - a.avgRevenue * a.dedicatedPlusFans)

  const totalPlatformRevenue = revenuePlatforms.reduce(
    (sum, p) => sum + p.avgRevenue * p.dedicatedPlusFans,
    0
  )

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Revenue Visibility</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {/* Big number */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#141414]">
              <DollarSign className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-3xl font-mono font-bold text-white">
                ${revenue.totalVisibleRevenue.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Total visible revenue</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-mono font-bold text-white">{visibilityPercent}%</p>
              <p className="text-xs text-gray-500">Visibility rate</p>
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-white">
                {revenue.fansWithFinancial}
              </p>
              <p className="text-xs text-gray-500">Fans with revenue</p>
            </div>
            <div>
              <p className="text-lg xl:text-2xl font-mono font-bold text-white truncate">
                {revenue.topRevenueSource !== 'None'
                  ? getPlatformLabel(revenue.topRevenueSource)
                  : '—'}
              </p>
              <p className="text-xs text-gray-500">Top source</p>
            </div>
          </div>

          {/* Revenue breakdown by platform */}
          {revenuePlatforms.length > 0 && (
            <div className="space-y-2 border-t border-[#1a1a1a] pt-4">
              <p className="text-xs text-gray-500 mb-3">
                Revenue by platform
              </p>
              {revenuePlatforms.map((p) => {
                const platformRevenue = p.avgRevenue * p.dedicatedPlusFans
                const sharePercent =
                  totalPlatformRevenue > 0
                    ? Math.round((platformRevenue / totalPlatformRevenue) * 100)
                    : 0
                return (
                  <div key={p.platform} className="flex items-center gap-3">
                    <span className="text-sm text-white w-24 truncate">
                      {getPlatformLabel(p.platform)}
                    </span>
                    <div className="flex-1 h-1.5 bg-black overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${sharePercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-gray-500 w-10 text-right">
                      {sharePercent}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
