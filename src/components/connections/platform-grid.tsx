'use client'

import { Music, Disc3, Heart, Tv, Mail, Headphones, Radio, MessageCircle, Youtube } from 'lucide-react'

interface PlatformGridProps {
  connectedPlatforms: string[]
  onConnect: (platform: string) => void
  isConnecting: string | null
}

// Map from grid display ID to Prisma enum value (when they differ)
const PLATFORM_ALIAS: Record<string, string> = {
  ORYX: 'DASHAM',
}

const platforms = [
  { id: 'SPOTIFY', name: 'Spotify', icon: Music, signal: 'Streams, saves, repeats', ready: true },
  { id: 'TWITCH', name: 'Twitch', icon: Tv, signal: 'Bits, subs, gift subs', ready: true },
  { id: 'EMAIL', name: 'Email List', icon: Mail, signal: 'Import existing fans', ready: true },
  { id: 'ORYX', name: 'Oryx', icon: Heart, signal: 'Tips, conviction', ready: true },
  { id: 'APPLE_MUSIC', name: 'Apple Music', icon: Music, signal: 'Streams, library adds', ready: false },
  { id: 'AUDIOMACK', name: 'Audiomack', icon: Headphones, signal: 'Streams, favorites, reposts', ready: false },
  { id: 'BOOMPLAY', name: 'Boomplay', icon: Radio, signal: 'Streams, downloads', ready: false },
  { id: 'YOUTUBE', name: 'YouTube', icon: Youtube, signal: 'Views, subs, comments', ready: false },
  { id: 'DISCORD', name: 'Discord', icon: MessageCircle, signal: 'Roles, activity, reactions', ready: false },
  { id: 'BANDCAMP', name: 'Bandcamp', icon: Disc3, signal: 'Purchases, tips', ready: false },
]

export function PlatformGrid({ connectedPlatforms, onConnect, isConnecting }: PlatformGridProps) {
  const availablePlatforms = platforms.filter(
    (p) => !connectedPlatforms.includes(p.id) && !connectedPlatforms.includes(PLATFORM_ALIAS[p.id] || '')
  )

  if (availablePlatforms.length === 0) {
    return (
      <div className="text-center py-8 text-caption text-gray-500">
        All platforms connected.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[#1a1a1a]">
      {availablePlatforms.map((platform) => {
        const Icon = platform.icon
        const isLoading = isConnecting === platform.id

        return (
          <button
            key={platform.id}
            type="button"
            disabled={!platform.ready || !!isConnecting}
            onClick={() => platform.ready && !isConnecting && onConnect(platform.id)}
            className={`bg-[#0a0a0a] p-5 text-left transition-colors group ${
              platform.ready
                ? 'hover:bg-[#0f0f0f] cursor-pointer'
                : 'opacity-40 cursor-default'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Icon className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors shrink-0" />
              <span className="text-body-sm text-gray-300 group-hover:text-white transition-colors">
                {platform.name}
              </span>
              {isLoading && (
                <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <p className="text-caption text-gray-600 leading-tight">
              {platform.signal}
            </p>
            {!platform.ready && (
              <p className="text-caption text-gray-700 mt-2">Soon</p>
            )}
          </button>
        )
      })}
    </div>
  )
}
