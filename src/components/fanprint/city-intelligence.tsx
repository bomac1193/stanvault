'use client'

import { Card, CardHeader, CardTitle, CardContent, Tabs } from '@/components/ui'
import { formatNumber } from '@/lib/utils'
import { Building2 } from 'lucide-react'
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
      <CardContent>
        <div className="space-y-3">
          {sorted.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No city data available</p>
          ) : (
            sorted.map((city, index) => {
              const barValue =
                sortBy === 'conviction'
                  ? city.avgConviction
                  : sortBy === 'revenue'
                    ? city.totalRevenue
                    : city.fanCount
              const barWidth = maxValue > 0 ? (barValue / maxValue) * 100 : 0

              return (
                <div key={`${city.city}-${city.country}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 w-5 text-right flex-shrink-0">{index + 1}</span>
                    <Building2 className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-white truncate">{city.city}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{city.country}</span>
                    <span className="ml-auto text-sm font-mono text-accent flex-shrink-0">
                      {sortBy === 'conviction' && city.avgConviction.toFixed(1)}
                      {sortBy === 'revenue' && `$${city.totalRevenue.toFixed(0)}`}
                      {sortBy === 'fans' && formatNumber(city.fanCount)}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatNumber(city.fanCount)} fans
                    </span>
                  </div>
                  <div className="h-1.5 bg-black overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
