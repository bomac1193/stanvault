'use client'

import Link from 'next/link'
import { Avatar, TierBadge } from '@/components/ui'
import { formatRelativeTime } from '@/lib/utils'
import { ChevronUp, ChevronDown, Music, Instagram, Youtube } from 'lucide-react'

interface PlatformLink {
  platform: string
}

interface Fan {
  id: string
  displayName: string
  email?: string
  avatarUrl?: string
  location?: string
  stanScore: number
  tier: string
  lastActiveAt: string
  platformLinks: PlatformLink[]
}

interface FanTableProps {
  fans: Fan[]
  sortField: string
  sortOrder: string
  onSort: (field: string, order?: string) => void
}

const platformIcons: Record<string, typeof Music> = {
  SPOTIFY: Music,
  INSTAGRAM: Instagram,
  YOUTUBE: Youtube,
  TIKTOK: Music,
  TWITTER: Music,
  EMAIL: Music,
}

function SortIcon({ field, sortField, sortOrder }: { field: string; sortField: string; sortOrder: string }) {
  if (field !== sortField) return null
  return sortOrder === 'asc' ? (
    <ChevronUp className="w-4 h-4" />
  ) : (
    <ChevronDown className="w-4 h-4" />
  )
}

export function FanTable({ fans, sortField, sortOrder, onSort }: FanTableProps) {
  return (
    <div className="bg-vault-dark border border-vault-gray rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-vault-darker border-b border-vault-gray text-sm font-medium text-vault-muted">
        <div className="col-span-4">
          <button
            onClick={() => onSort('displayName')}
            className="flex items-center gap-1 hover:text-warm-white transition-colors"
          >
            Fan
            <SortIcon field="displayName" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </div>
        <div className="col-span-2">
          <button
            onClick={() => onSort('stanScore')}
            className="flex items-center gap-1 hover:text-warm-white transition-colors"
          >
            Stan Score
            <SortIcon field="stanScore" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </div>
        <div className="col-span-2">Tier</div>
        <div className="col-span-2">Platforms</div>
        <div className="col-span-2">
          <button
            onClick={() => onSort('lastActiveAt')}
            className="flex items-center gap-1 hover:text-warm-white transition-colors"
          >
            Last Active
            <SortIcon field="lastActiveAt" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-vault-gray">
        {fans.map((fan) => (
          <Link
            key={fan.id}
            href={`/fans/${fan.id}`}
            className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-vault-gray/50 transition-colors items-center"
          >
            {/* Fan info */}
            <div className="col-span-4 flex items-center gap-3">
              <Avatar src={fan.avatarUrl} name={fan.displayName} size="md" />
              <div className="min-w-0">
                <p className="font-medium text-warm-white truncate">{fan.displayName}</p>
                <p className="text-sm text-vault-muted truncate">{fan.location || fan.email}</p>
              </div>
            </div>

            {/* Stan Score */}
            <div className="col-span-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gold/10 border border-gold/20 rounded-lg">
                <span className="text-gold font-mono font-semibold">{fan.stanScore}</span>
              </div>
            </div>

            {/* Tier */}
            <div className="col-span-2">
              <TierBadge tier={fan.tier} />
            </div>

            {/* Platforms */}
            <div className="col-span-2 flex items-center gap-1">
              {fan.platformLinks.slice(0, 3).map((link) => {
                const Icon = platformIcons[link.platform] || Music
                return (
                  <div
                    key={link.platform}
                    className="w-6 h-6 rounded-full bg-vault-gray flex items-center justify-center"
                    title={link.platform}
                  >
                    <Icon className="w-3 h-3 text-vault-muted" />
                  </div>
                )
              })}
              {fan.platformLinks.length > 3 && (
                <span className="text-xs text-vault-muted">
                  +{fan.platformLinks.length - 3}
                </span>
              )}
            </div>

            {/* Last Active */}
            <div className="col-span-2 text-sm text-vault-muted">
              {formatRelativeTime(fan.lastActiveAt)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
