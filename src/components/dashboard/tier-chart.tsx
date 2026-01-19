'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

interface TierData {
  tier: string
  count: number
  color: string
  [key: string]: string | number
}

interface TierChartProps {
  data: TierData[]
}

export function TierChart({ data }: TierChartProps) {
  const total = data.reduce((acc, item) => acc + item.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fan Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2A2A2A',
                    borderRadius: '8px',
                    color: '#FAF9F7',
                  }}
                  formatter={(value) => [
                    `${Number(value).toLocaleString()} fans`,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-3">
            {data.map((item) => (
              <div key={item.tier} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-warm-white">{item.tier}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-warm-white">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="text-xs text-vault-muted w-12 text-right">
                    {total > 0 ? Math.round((item.count / total) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
