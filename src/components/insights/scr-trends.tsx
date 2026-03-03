'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { CONVERSION_RATE_NAME } from '@/lib/labels'

interface TrendPoint {
  date: string
  holdRate90Day: number | null
  depthVelocity: number | null
  platformIndependence: number | null
  churnRate: number | null
}

interface SCRTrendsProps {
  data: TrendPoint[]
}

const LINES = [
  { key: 'holdRate90Day', label: 'Retention', color: '#FFFFFF' },
  { key: 'depthVelocity', label: 'Depth', color: '#D4D4D4' },
  { key: 'platformIndependence', label: 'Reach', color: '#A3A3A3' },
  { key: 'churnRate', label: 'Churn', color: '#FF0040' },
] as const

export function SCRTrends({ data }: SCRTrendsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{CONVERSION_RATE_NAME} Components</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 mb-4">
          {LINES.map((l) => (
            <div key={l.key} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              <span className="text-xs text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
              <YAxis
                hide
                domain={[0, 1]}
              />
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
                formatter={(value: number) => [`${Math.round(value * 100)}%`]}
              />
              {LINES.map((l) => (
                <Line
                  key={l.key}
                  type="monotone"
                  dataKey={l.key}
                  stroke={l.color}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: l.color }}
                  name={l.label}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
