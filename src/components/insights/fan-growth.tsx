'use client'

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

interface TrendPoint {
  date: string
  totalFans: number
  newFansCount: number | null
  churnedFansCount: number | null
}

interface FanGrowthProps {
  data: TrendPoint[]
}

export function FanGrowth({ data }: FanGrowthProps) {
  const totalNew = data.reduce((s, d) => s + (d.newFansCount ?? 0), 0)
  const totalChurned = data.reduce((s, d) => s + (d.churnedFansCount ?? 0), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fan Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div>
            <span className="text-xs text-gray-500">New</span>
            <p className="text-sm font-mono text-white">+{totalNew}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Churned</span>
            <p className="text-sm font-mono text-[#FF0040]">-{totalChurned}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Net</span>
            <p className="text-sm font-mono text-gray-300">{totalNew - totalChurned >= 0 ? '+' : ''}{totalNew - totalChurned}</p>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
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
                yAxisId="fans"
                hide
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <YAxis yAxisId="delta" hide />
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
              <Bar
                yAxisId="delta"
                dataKey="newFansCount"
                fill="#D45068"
                opacity={0.6}
                name="New"
              />
              <Bar
                yAxisId="delta"
                dataKey="churnedFansCount"
                fill="#FF0040"
                opacity={0.4}
                name="Churned"
              />
              <Line
                yAxisId="fans"
                type="monotone"
                dataKey="totalFans"
                stroke="#ffffff"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: '#ffffff' }}
                name="Total"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
