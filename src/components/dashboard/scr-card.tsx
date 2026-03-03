'use client'

import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface SCRComponents {
  holdRate: number
  holdRate30Day: number
  depthVelocity: number
  platformIndependence: number
  churnRate: number
}

interface SCRHistoryPoint {
  date: string
  scr: number | null
}

interface SCRCardProps {
  scr: number
  components: SCRComponents
  interpretation: string
  trend: 'up' | 'down' | 'stable'
  trendPercent: number
  history: SCRHistoryPoint[]
  className?: string
}

export function SCRCard({
  scr,
  components,
  interpretation,
  trend,
  trendPercent,
  history,
  className,
}: SCRCardProps) {
  const scrDisplay = scr >= 1 ? scr.toFixed(1) : scr.toFixed(2)
  const scrPercent = Math.round(scr * 100)

  const getSCRRating = (value: number) => {
    if (value >= 3) return { label: 'Exceptional', color: 'text-status-success' }
    if (value >= 1.5) return { label: 'Strong', color: 'text-accent' }
    if (value >= 0.5) return { label: 'Average', color: 'text-gray-400' }
    if (value >= 0.2) return { label: 'Below Average', color: 'text-gray-500' }
    return { label: 'Low', color: 'text-status-error' }
  }

  const rating = getSCRRating(scr)

  const componentItems = [
    {
      name: 'Retention',
      value: components.holdRate,
      description: '90-day hold',
    },
    {
      name: 'Depth',
      value: components.depthVelocity,
      description: 'Time to Core',
    },
    {
      name: 'Reach',
      value: components.platformIndependence,
      description: 'Cross-platform',
    },
    {
      name: 'Fade Rate',
      value: components.churnRate,
      description: 'Core loss',
      isNegative: true,
    },
  ]

  return (
    <div
      className={cn(
        'bg-[#0a0a0a] border border-[#1a1a1a] overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-400">
            Core Conversion Rate
          </h3>
          <span className={cn('text-sm font-medium px-2 py-1', rating.color, 'bg-black')}>
            {rating.label}
          </span>
        </div>
      </div>

      {/* Main Score */}
      <div className="px-6 py-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-medium text-white tracking-tight">
                {scrDisplay}
              </span>
              <span className="text-sm text-gray-500">CCR</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{scrPercent}% conversion efficiency</p>
          </div>

          {/* Trend */}
          <span
            className={cn(
              'text-sm font-medium px-3 py-1.5 bg-black',
              trend === 'up' && 'text-status-success',
              trend === 'down' && 'text-status-error',
              trend === 'stable' && 'text-gray-500'
            )}
          >
            {trend === 'stable' ? 'Stable' : `${trendPercent > 0 ? '+' : ''}${trendPercent}%`}
          </span>
        </div>

        {/* Interpretation */}
        <p className="text-sm text-gray-500 mb-6 pb-6 border-b border-[#1a1a1a]">
          {interpretation}
        </p>

        {/* Components Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {componentItems.map((item) => (
            <div key={item.name} className="bg-black p-3">
              <span className="text-xs text-gray-500 mb-2 block">{item.name}</span>
              <div className="flex items-baseline gap-1">
                <span
                  className={cn(
                    'text-lg font-mono font-medium',
                    item.isNegative
                      ? 'text-gray-400'
                      : item.value >= 0.6
                        ? 'text-white'
                        : item.value >= 0.3
                          ? 'text-gray-400'
                          : 'text-gray-500'
                  )}
                >
                  {Math.round(item.value * 100)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        {history.length > 1 && (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: '0',
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#737373' }}
                  formatter={(value: number) => [value?.toFixed(2), 'CCR']}
                />
                <Line
                  type="monotone"
                  dataKey="scr"
                  stroke="#D45068"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#D45068' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
