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

const stageColors = ['#737373', '#A3A3A3', '#D4D4D4', '#FF2D92']

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
                  <span className="text-sm font-medium text-white">
                    {stage.stage}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-white">
                      {formatNumber(stage.count)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({stage.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="h-8 bg-black overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
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
