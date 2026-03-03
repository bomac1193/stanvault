'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

interface TrendPoint {
  date: string
  casualCount: number
  engagedCount: number
  dedicatedCount: number
  superfanCount: number
  upgradedFansCount: number | null
}

interface TierMigrationProps {
  data: TrendPoint[]
}

const TIER_COLORS = {
  casual: '#737373',
  engaged: '#A3A3A3',
  dedicated: '#D4D4D4',
  superfan: '#FFFFFF',
}

export function TierMigration({ data }: TierMigrationProps) {
  const totalUpgraded = data.reduce((s, d) => s + (d.upgradedFansCount ?? 0), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tier Migration</CardTitle>
          <span className="text-xs text-gray-500">
            {totalUpgraded} upgraded
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 mb-4">
          {[
            { label: 'Core', color: TIER_COLORS.superfan },
            { label: 'Strong', color: TIER_COLORS.dedicated },
            { label: 'Steady', color: TIER_COLORS.engaged },
            { label: 'Faint', color: TIER_COLORS.casual },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              <span className="text-xs text-gray-500">{t.label}</span>
            </div>
          ))}
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  const d = new Date(v)
                  return `${d.getMonth() + 1}/${d.getDate()}`
                }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '0',
                  color: '#fff',
                }}
                labelStyle={{ color: '#737373' }}
                labelFormatter={(v) => {
                  const d = new Date(v)
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }}
              />
              <Area
                type="monotone"
                dataKey="superfanCount"
                stackId="1"
                stroke={TIER_COLORS.superfan}
                fill={TIER_COLORS.superfan}
                fillOpacity={0.15}
                name="Core"
              />
              <Area
                type="monotone"
                dataKey="dedicatedCount"
                stackId="1"
                stroke={TIER_COLORS.dedicated}
                fill={TIER_COLORS.dedicated}
                fillOpacity={0.12}
                name="Strong"
              />
              <Area
                type="monotone"
                dataKey="engagedCount"
                stackId="1"
                stroke={TIER_COLORS.engaged}
                fill={TIER_COLORS.engaged}
                fillOpacity={0.08}
                name="Steady"
              />
              <Area
                type="monotone"
                dataKey="casualCount"
                stackId="1"
                stroke={TIER_COLORS.casual}
                fill={TIER_COLORS.casual}
                fillOpacity={0.05}
                name="Faint"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
