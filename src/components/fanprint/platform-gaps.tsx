'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { ShoppingBag } from 'lucide-react'

interface PlatformGapData {
  platform: string
  dedicatedPlusFans: number
  dedicatedPlusTotal: number
  percentage: number
  avgRevenue: number
}

interface PlatformGapsProps {
  gaps: PlatformGapData[]
}

function getBarColor(percentage: number): string {
  if (percentage > 50) return 'bg-emerald-500'
  if (percentage >= 20) return 'bg-yellow-500'
  return 'bg-red-400'
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

function getInsight(platform: string, percentage: number): string | null {
  if (percentage >= 50) return null
  const insights: Record<string, string> = {
    MERCH: 'Consider launching or promoting a merch store',
    BANDCAMP: 'Encourage fans to support directly on Bandcamp',
    KOFI: 'Set up a Ko-fi for easy tipping',
    PATREON: 'Offer exclusive content on Patreon',
    DASHAM: 'Promote Dasham for direct fan tipping',
  }
  return insights[platform] || null
}

export function PlatformGaps({ gaps }: PlatformGapsProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Platform Coverage</CardTitle>
        <p className="text-xs text-gray-500 mt-1">DEDICATED+ fans only</p>
      </CardHeader>
      <CardContent>
        {gaps.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No platform data available</p>
        ) : (
          <div className="space-y-4">
            {gaps.map((gap) => {
              const insight = getInsight(gap.platform, gap.percentage)
              return (
                <div key={gap.platform} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-sm text-white">
                        {getPlatformLabel(gap.platform)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-white">{gap.percentage}%</span>
                      <span className="text-xs text-gray-500">
                        ({gap.dedicatedPlusFans}/{gap.dedicatedPlusTotal})
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-black overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getBarColor(gap.percentage)}`}
                      style={{ width: `${gap.percentage}%` }}
                    />
                  </div>
                  {gap.avgRevenue > 0 && (
                    <p className="text-xs text-gray-500">
                      Avg revenue: <span className="text-accent">${gap.avgRevenue.toFixed(2)}</span> per fan
                    </p>
                  )}
                  {insight && (
                    <p className="text-xs text-gray-500 italic">
                      Only {gap.percentage}% of your top fans are here — {insight}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
