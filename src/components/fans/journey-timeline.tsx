'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Star, TrendingUp, Music, Heart, MessageCircle, Share2, Mail, Zap } from 'lucide-react'

interface Event {
  id: string
  eventType: string
  platform?: string
  description?: string
  occurredAt: string
}

interface JourneyTimelineProps {
  events: Event[]
}

const eventConfig: Record<string, { icon: typeof Star; color: string }> = {
  BECAME_SUPERFAN: { icon: Star, color: '#C9A227' },
  TIER_UPGRADE: { icon: TrendingUp, color: '#8B5CF6' },
  FIRST_STREAM: { icon: Music, color: '#1DB954' },
  FIRST_FOLLOW: { icon: Heart, color: '#E4405F' },
  FIRST_LIKE: { icon: Heart, color: '#E4405F' },
  FIRST_COMMENT: { icon: MessageCircle, color: '#3B82F6' },
  FIRST_SHARE: { icon: Share2, color: '#22C55E' },
  PLAYLIST_ADD: { icon: Music, color: '#1DB954' },
  EMAIL_SUBSCRIBE: { icon: Mail, color: '#C9A227' },
  EMAIL_OPEN: { icon: Mail, color: '#C9A227' },
  MILESTONE_STREAMS: { icon: Zap, color: '#F59E0B' },
  MILESTONE_ENGAGEMENT: { icon: Zap, color: '#F59E0B' },
}

export function JourneyTimeline({ events }: JourneyTimelineProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fan Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-vault-muted py-4">
            No journey events recorded yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fan Journey</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-vault-gray" />

          <div className="space-y-4">
            {events.map((event) => {
              const config = eventConfig[event.eventType] || { icon: Star, color: '#6B7280' }
              const Icon = config.icon

              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center z-10"
                    style={{ backgroundColor: `${config.color}20`, border: `2px solid ${config.color}` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-medium text-warm-white">
                      {event.description || event.eventType.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-vault-muted">
                      {formatDate(event.occurredAt)}
                      {event.platform && ` • ${event.platform}`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
