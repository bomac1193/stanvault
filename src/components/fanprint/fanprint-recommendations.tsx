'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { MapPin, Target, ShoppingBag, DollarSign, Gift, type LucideIcon } from 'lucide-react'
import { type Recommendation } from '@/lib/fanprint/recommendations'

interface FanPrintRecommendationsProps {
  recommendations: Recommendation[]
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  city: MapPin,
  drop: Gift,
  platform: ShoppingBag,
  revenue: DollarSign,
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'border-l-red-400',
  medium: 'border-l-yellow-500',
  low: 'border-l-[#1a1a1a]',
}

const PRIORITY_LABELS: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export function FanPrintRecommendations({ recommendations }: FanPrintRecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-4">
            Not enough data to generate recommendations yet. Keep adding fans and connecting platforms.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Revenue Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[#1a1a1a]">
          {recommendations.map((rec, index) => {
            const Icon = TYPE_ICONS[rec.type] || Target
            return (
              <div
                key={index}
                className={`px-6 py-4 flex items-start gap-4 border-l-2 ${PRIORITY_STYLES[rec.priority]}`}
              >
                <div className="p-2 bg-[#141414] flex-shrink-0">
                  <Icon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-medium text-white">{rec.title}</h4>
                    <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-black flex-shrink-0">
                      {PRIORITY_LABELS[rec.priority]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{rec.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
