'use client'

import { Card, CardHeader, CardTitle, CardContent, Tabs } from '@/components/ui'
import { formatNumber } from '@/lib/utils'
import { useState } from 'react'

interface CityData {
  city: string
  country: string
  fanCount: number
  avgStanScore: number
  avgConviction: number
  totalRevenue: number
  tiers: { superfan: number; dedicated: number; engaged: number; casual: number }
}

interface CityIntelligenceProps {
  cities: CityData[]
}

type SortMode = 'conviction' | 'revenue' | 'fans'

function stripEmoji(str: string): string {
  return str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim()
}

export function CityIntelligence({ cities }: CityIntelligenceProps) {
  const [sortBy, setSortBy] = useState<SortMode>('conviction')

  const tabs = [
    { value: 'conviction', label: 'Conviction' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'fans', label: 'Fans' },
  ]

  const sorted = [...cities].sort((a, b) => {
    if (sortBy === 'conviction') return b.avgConviction - a.avgConviction
    if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue
    return b.fanCount - a.fanCount
  })

  const maxValue = Math.max(
    ...sorted.map((c) => {
      if (sortBy === 'conviction') return c.avgConviction
      if (sortBy === 'revenue') return c.totalRevenue
      return c.fanCount
    }),
    1
  )

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <CardTitle>City Intelligence</CardTitle>
          <Tabs tabs={tabs} value={sortBy} onChange={(v) => setSortBy(v as SortMode)} className="w-fit" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {sorted.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No city data available</p>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {sorted.map((city, index) => {
              const barValue =
                sortBy === 'conviction'
                  ? city.avgConviction
                  : sortBy === 'revenue'
                    ? city.totalRevenue
                    : city.fanCount
              const barWidth = maxValue > 0 ? (barValue / maxValue) * 100 : 0

              return (
                <div key={`${city.city}-${city.country}`} className="px-6 py-3">
                  <div className="flex items-center">
                    <span className="text-xs font-mono text-gray-500 w-6 flex-shrink-0">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-white">{city.city}</span>
                      <span className="text-xs text-gray-500 ml-2">{stripEmoji(city.country)}</span>
                    </div>
                    <span className="text-sm font-mono tabular-nums text-accent flex-shrink-0 w-16 text-right">
                      {sortBy === 'conviction' && city.avgConviction.toFixed(1)}
                      {sortBy === 'revenue' && `$${city.totalRevenue.toFixed(0)}`}
                      {sortBy === 'fans' && formatNumber(city.fanCount)}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-gray-500 flex-shrink-0 w-20 text-right">
                      {formatNumber(city.fanCount)} fans
                    </span>
                  </div>
                  <div className="ml-6 mt-1.5 h-1 bg-black overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
