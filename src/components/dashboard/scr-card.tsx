'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, Activity, Clock, Layers, AlertTriangle } from 'lucide-react'
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
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  // Format SCR for display
  const scrDisplay = scr >= 1 ? scr.toFixed(1) : scr.toFixed(2)
  const scrPercent = Math.round(scr * 100)

  // Get SCR rating
  const getSCRRating = (value: number) => {
    if (value >= 3) return { label: 'Exceptional', color: 'text-status-success' }
    if (value >= 1.5) return { label: 'Strong', color: 'text-gold' }
    if (value >= 0.5) return { label: 'Average', color: 'text-vault-muted' }
    if (value >= 0.2) return { label: 'Below Average', color: 'text-orange-400' }
    return { label: 'Low', color: 'text-status-error' }
  }

  const rating = getSCRRating(scr)

  const componentItems = [
    {
      name: 'Hold Rate (90d)',
      value: components.holdRate,
      icon: Clock,
      description: 'Fan retention',
    },
    {
      name: 'Depth Velocity',
      value: components.depthVelocity,
      icon: TrendingUp,
      description: 'Time to superfan',
    },
    {
      name: 'Platform Spread',
      value: components.platformIndependence,
      icon: Layers,
      description: 'Multi-platform presence',
    },
    {
      name: 'Churn Rate',
      value: components.churnRate,
      icon: AlertTriangle,
      description: 'Fan loss rate',
      isNegative: true,
    },
  ]

  return (
    <div
      className={cn(
        'bg-vault-dark border border-vault-gray rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-vault-gray">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold" />
            <h3 className="text-lg font-semibold text-warm-white">
              Stan Conversion Rate
            </h3>
          </div>
          <span className={cn('text-sm font-medium px-2 py-1 rounded', rating.color, 'bg-vault-darker')}>
            {rating.label}
          </span>
        </div>
      </div>

      {/* Main Score */}
      <div className="px-6 py-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-mono font-bold text-warm-white">
                {scrDisplay}
              </span>
              <span className="text-lg text-vault-muted">SCR</span>
            </div>
            <p className="text-sm text-vault-muted mt-1">{scrPercent}% conversion efficiency</p>
          </div>

          {/* Trend */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-vault-darker">
            <TrendIcon
              className={cn(
                'w-4 h-4',
                trend === 'up' && 'text-status-success',
                trend === 'down' && 'text-status-error',
                trend === 'stable' && 'text-vault-muted'
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                trend === 'up' && 'text-status-success',
                trend === 'down' && 'text-status-error',
                trend === 'stable' && 'text-vault-muted'
              )}
            >
              {trend === 'stable' ? 'Stable' : `${trendPercent > 0 ? '+' : ''}${trendPercent}%`}
            </span>
          </div>
        </div>

        {/* Interpretation */}
        <p className="text-sm text-vault-muted mb-6 pb-6 border-b border-vault-gray">
          {interpretation}
        </p>

        {/* Components Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {componentItems.map((item) => (
            <div key={item.name} className="bg-vault-darker rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <item.icon className="w-4 h-4 text-vault-muted" />
                <span className="text-xs text-vault-muted">{item.name}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={cn(
                    'text-xl font-mono font-semibold',
                    item.isNegative
                      ? item.value > 0.2
                        ? 'text-status-error'
                        : 'text-status-success'
                      : item.value >= 0.6
                        ? 'text-status-success'
                        : item.value >= 0.3
                          ? 'text-gold'
                          : 'text-status-error'
                  )}
                >
                  {Math.round(item.value * 100)}%
                </span>
              </div>
              <p className="text-xs text-vault-muted mt-1">{item.description}</p>
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
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#999' }}
                  formatter={(value: number) => [value?.toFixed(2), 'SCR']}
                />
                <Line
                  type="monotone"
                  dataKey="scr"
                  stroke="#d4af37"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#d4af37' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
