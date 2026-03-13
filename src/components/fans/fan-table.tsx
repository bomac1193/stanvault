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
  disableLinks?: boolean
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

export function FanTable({ fans, sortField, sortOrder, onSort, disableLinks = false }: FanTableProps) {
  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-black border-b border-[#1a1a1a] text-sm font-medium text-gray-500">
        <div className="col-span-4">
          <button
            onClick={() => onSort('displayName')}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            Fan
            <SortIcon field="displayName" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </div>
        <div className="col-span-2">
          <button
            onClick={() => onSort('stanScore')}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            Pulse
            <SortIcon field="stanScore" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </div>
        <div className="col-span-2">Tier</div>
        <div className="col-span-2">Platforms</div>
        <div className="col-span-2">
          <button
            onClick={() => onSort('lastActiveAt')}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            Last Active
            <SortIcon field="lastActiveAt" sortField={sortField} sortOrder={sortOrder} />
          </button>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#1a1a1a]">
        {fans.map((fan) => (
          disableLinks ? (
            <div
              key={fan.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#0a0a0a] items-center"
            >
              <div className="col-span-4 flex items-center gap-3">
                <Avatar src={fan.avatarUrl} name={fan.displayName} size="md" />
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{fan.displayName}</p>
                  <p className="text-sm text-gray-500 truncate">{fan.location || fan.email}</p>
                </div>
              </div>

              <div className="col-span-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 border border-accent/20">
                  <span className="text-accent font-mono font-semibold">{fan.stanScore}</span>
                </div>
              </div>

              <div className="col-span-2">
                <TierBadge tier={fan.tier} />
              </div>

              <div className="col-span-2 flex items-center gap-1">
                {fan.platformLinks.slice(0, 3).map((link) => {
                  const Icon = platformIcons[link.platform] || Music
                  return (
                    <div
                      key={link.platform}
                      className="w-6 h-6 bg-[#1a1a1a] flex items-center justify-center"
                      title={link.platform}
                    >
                      <Icon className="w-3 h-3 text-gray-500" />
                    </div>
                  )
                })}
                {fan.platformLinks.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{fan.platformLinks.length - 3}
                  </span>
                )}
              </div>

              <div className="col-span-2 text-sm text-gray-500">
                {formatRelativeTime(fan.lastActiveAt)}
              </div>
            </div>
          ) : (
            <Link
              key={fan.id}
              href={`/fans/${fan.id}`}
              className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[#111] transition-colors items-center"
            >
              {/* Fan info */}
              <div className="col-span-4 flex items-center gap-3">
                <Avatar src={fan.avatarUrl} name={fan.displayName} size="md" />
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{fan.displayName}</p>
                  <p className="text-sm text-gray-500 truncate">{fan.location || fan.email}</p>
                </div>
              </div>

              {/* Stan Score */}
              <div className="col-span-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 border border-accent/20">
                  <span className="text-accent font-mono font-semibold">{fan.stanScore}</span>
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
                      className="w-6 h-6 bg-[#1a1a1a] flex items-center justify-center"
                      title={link.platform}
                    >
                      <Icon className="w-3 h-3 text-gray-500" />
                    </div>
                  )
                })}
                {fan.platformLinks.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{fan.platformLinks.length - 3}
                  </span>
                )}
              </div>

              {/* Last Active */}
              <div className="col-span-2 text-sm text-gray-500">
                {formatRelativeTime(fan.lastActiveAt)}
              </div>
            </Link>
          )
        ))}
      </div>
    </div>
  )
}
