'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { formatNumber } from '@/lib/utils'

interface FunnelStage {
  stage: string
  count: number
  percentage: number
}

interface ConversionFunnelProps {
  funnel: FunnelStage[]
}

const stageColors = ['#6B7280', '#3B82F6', '#8B5CF6', '#C9A227']

export function ConversionFunnel({ funnel }: ConversionFunnelProps) {
  const maxCount = Math.max(...funnel.map((s) => s.count))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fan Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnel.map((stage, index) => {
            const width = maxCount > 0 ? (stage.count / maxCount) * 100 : 0

            return (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-warm-white">
                    {stage.stage}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-warm-white">
                      {formatNumber(stage.count)}
                    </span>
                    <span className="text-xs text-vault-muted">
                      ({stage.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="h-8 bg-vault-darker rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500"
                    style={{
                      width: `${width}%`,
                      backgroundColor: stageColors[index],
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
