'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Gift } from 'lucide-react'

interface DropData {
  dropId: string
  title: string
  totalClaims: number
  claimsByTier: { superfan: number; dedicated: number; engaged: number; casual: number }
  avgClaimScore: number
}

interface DropPerformanceProps {
  drops: DropData[]
}

const TIER_COLORS: Record<string, string> = {
  superfan: 'bg-purple-500',
  dedicated: 'bg-blue-500',
  engaged: 'bg-emerald-500',
  casual: 'bg-gray-500',
}

const TIER_LABELS: Record<string, string> = {
  superfan: 'Core',
  dedicated: 'Strong',
  engaged: 'Steady',
  casual: 'Faint',
}

export function DropPerformance({ drops }: DropPerformanceProps) {
  const dropsWithClaims = drops.filter((d) => d.totalClaims > 0)
  const maxClaims = Math.max(...drops.map((d) => d.totalClaims), 1)

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Drop Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {drops.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No drops created yet</p>
        ) : (
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              {Object.entries(TIER_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-sm ${TIER_COLORS[key]}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Drop rows */}
            {drops.map((drop) => (
              <div key={drop.dropId} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Gift className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-white truncate">{drop.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-sm font-mono text-white">{drop.totalClaims}</span>
                    <span className="text-xs text-gray-500">claims</span>
                  </div>
                </div>
                {drop.totalClaims > 0 ? (
                  <div className="flex h-2 overflow-hidden bg-black">
                    {(['superfan', 'dedicated', 'engaged', 'casual'] as const).map((tier) => {
                      const count = drop.claimsByTier[tier]
                      if (count === 0) return null
                      const width = (count / drop.totalClaims) * 100
                      return (
                        <div
                          key={tier}
                          className={`${TIER_COLORS[tier]} transition-all duration-300`}
                          style={{ width: `${width}%` }}
                          title={`${TIER_LABELS[tier]}: ${count}`}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-2 bg-black" />
                )}
                {drop.totalClaims > 0 && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    {(['superfan', 'dedicated', 'engaged', 'casual'] as const).map((tier) => {
                      const count = drop.claimsByTier[tier]
                      if (count === 0) return null
                      return (
                        <span key={tier}>
                          {TIER_LABELS[tier]}: {count}
                        </span>
                      )
                    })}
                    <span className="ml-auto">Avg score: {drop.avgClaimScore}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Insight */}
            {dropsWithClaims.length > 0 && (() => {
              const totalDedPlus = dropsWithClaims.reduce(
                (s, d) => s + d.claimsByTier.superfan + d.claimsByTier.dedicated, 0
              )
              const totalCasual = dropsWithClaims.reduce((s, d) => s + d.claimsByTier.casual, 0)
              const totalAll = dropsWithClaims.reduce((s, d) => s + d.totalClaims, 0)
              if (totalAll === 0) return null
              const dedPlusRate = Math.round((totalDedPlus / totalAll) * 100)
              return (
                <p className="text-xs text-gray-500 border-t border-[#1a1a1a] pt-3">
                  DEDICATED+ fans account for <span className="text-accent">{dedPlusRate}%</span> of all drop claims
                  {totalCasual > 0 && `, CASUAL for ${Math.round((totalCasual / totalAll) * 100)}%`}.
                </p>
              )
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
