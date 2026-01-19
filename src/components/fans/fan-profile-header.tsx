import { Avatar, TierBadge, StanScoreBadge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { MapPin, Calendar, Mail } from 'lucide-react'

interface FanProfileHeaderProps {
  fan: {
    displayName: string
    email?: string
    avatarUrl?: string
    location?: string
    tier: string
    stanScore: number
    firstSeenAt: string
  }
}

export function FanProfileHeader({ fan }: FanProfileHeaderProps) {
  return (
    <div className="bg-vault-dark border border-vault-gray rounded-lg p-6">
      <div className="flex items-start gap-6">
        <Avatar src={fan.avatarUrl} name={fan.displayName} size="xl" />

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-display font-bold text-warm-white">
              {fan.displayName}
            </h1>
            <TierBadge tier={fan.tier} />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-vault-muted mb-4">
            {fan.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                {fan.email}
              </div>
            )}
            {fan.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {fan.location}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Fan since {formatDate(fan.firstSeenAt)}
            </div>
          </div>

          <StanScoreBadge score={fan.stanScore} />
        </div>
      </div>
    </div>
  )
}
