'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

interface TierData {
  tier: string
  dbTier?: string
  count: number
  color: string
  avgScore?: number
  newThisMonth?: number
  [key: string]: string | number | undefined
}

interface TierChartProps {
  data: TierData[]
}

const TIER_DB_MAP: Record<string, string> = {
  Core: 'SUPERFAN',
  Strong: 'DEDICATED',
  Steady: 'ENGAGED',
  Faint: 'CASUAL',
}

export function TierChart({ data }: TierChartProps) {
  const total = data.reduce((acc, item) => acc + item.count, 0)
  const [activeTier, setActiveTier] = useState<string | null>('Core')

  const handleClick = (tier: string) => {
    setActiveTier(activeTier === tier ? null : tier)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fan Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stacked bar */}
        <div className="flex gap-px h-2 w-full mb-6">
          {data.map((item) => {
            const pct = total > 0 ? (item.count / total) * 100 : 0
            if (pct === 0) return null
            const isActive = activeTier === item.tier
            const isDimmed = activeTier !== null && !isActive
            return (
              <div
                key={item.tier}
                className={cn(
                  'h-full first:rounded-l-full last:rounded-r-full transition-opacity duration-150 cursor-pointer',
                  isDimmed && 'opacity-15',
                )}
                style={{ width: `${pct}%`, backgroundColor: item.color }}
                onClick={() => handleClick(item.tier)}
              />
            )
          })}
        </div>

        {/* Breakdown rows */}
        {data.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
          const isActive = activeTier === item.tier
          const isDimmed = activeTier !== null && !isActive
          return (
            <div
              key={item.tier}
              className={cn(
                'transition-opacity duration-150 cursor-pointer',
                isDimmed && 'opacity-25',
                isActive && 'bg-[#111] -mx-6 px-6'
              )}
              onClick={() => handleClick(item.tier)}
            >
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className={cn(
                    'text-sm',
                    isActive ? 'text-white' : 'text-gray-400'
                  )}>
                    {item.tier}
                  </span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-sm font-mono text-white tabular-nums">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="text-xs font-mono text-gray-600 w-10 text-right tabular-nums">
                    {pct}%
                  </span>
                </div>
              </div>
              {isActive && (
                <div className="flex items-end pb-3 pl-[22px] gap-8">
                  {item.avgScore !== undefined && (
                    <div>
                      <span className="text-[11px] text-gray-600 block mb-1.5">Avg Pulse</span>
                      <span className="text-base font-mono text-white">{item.avgScore}</span>
                    </div>
                  )}
                  {item.newThisMonth !== undefined && (
                    <div>
                      <span className="text-[11px] text-gray-600 block mb-1.5">New this month</span>
                      <span className="text-base font-mono text-white">
                        {item.newThisMonth > 0 ? `+${item.newThisMonth}` : '0'}
                      </span>
                    </div>
                  )}
                  <Link
                    href={`/fans?tier=${TIER_DB_MAP[item.tier] || item.tier.toUpperCase()}`}
                    className="text-xs text-gray-500 hover:text-white transition-colors ml-auto"
                  >
                    View all
                  </Link>
                </div>
              )}
            </div>
          )
        })}

        {/* Total */}
        <div className="mt-4 pt-3 border-t border-[#1a1a1a] flex items-center justify-between">
          <span className="text-xs text-gray-500">Total</span>
          <span className="text-sm font-mono text-gray-400 tabular-nums">
            {total.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
