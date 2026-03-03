'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, Avatar, TierBadge } from '@/components/ui'
import { formatRelativeTime } from '@/lib/utils'

interface Moment {
  id: string
  type: string
  description: string
  platform?: string
  occurredAt: string
  fan: {
    id: string
    name: string
    avatar?: string
    tier: string
    score: number
  }
}

interface SuperfanMomentsProps {
  moments: Moment[]
}

const eventDotColor: Record<string, string> = {
  BECAME_SUPERFAN: '#FFFFFF',
  TIER_UPGRADE: '#A3A3A3',
  MILESTONE_STREAMS: '#737373',
  MILESTONE_ENGAGEMENT: '#737373',
}

export function SuperfanMoments({ moments }: SuperfanMomentsProps) {
  if (moments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Moments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            No notable moments yet. Keep building your fanbase!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Moments</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[#1a1a1a]">
          {moments.map((moment) => {
            const dotColor = eventDotColor[moment.type] || '#525252'

            return (
              <Link
                key={moment.id}
                href={`/fans/${moment.fan.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-[#111] transition-colors"
              >
                <div className="relative">
                  <Avatar
                    src={moment.fan.avatar}
                    name={moment.fan.name}
                    size="md"
                  />
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0a]"
                    style={{ backgroundColor: dotColor }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white truncate">
                      {moment.fan.name}
                    </span>
                    <TierBadge tier={moment.fan.tier} />
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {moment.description}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(moment.occurredAt)}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
