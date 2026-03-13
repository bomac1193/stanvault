'use client'

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
  { id: 'SPOTIFY', name: 'Spotify', signal: 'Streams, saves, repeats', ready: true },
  { id: 'TWITCH', name: 'Twitch', signal: 'Bits, subs, gift subs', ready: false },
  { id: 'EMAIL', name: 'Email List', signal: 'Import existing fans', ready: true },
  { id: 'ORYX', name: 'Oryx', signal: 'Tips, conviction', ready: true },
  { id: 'APPLE_MUSIC', name: 'Apple Music', signal: 'Streams, library adds', ready: false },
  { id: 'AUDIOMACK', name: 'Audiomack', signal: 'Streams, favorites, reposts', ready: false },
  { id: 'BOOMPLAY', name: 'Boomplay', signal: 'Streams, downloads', ready: false },
  { id: 'YOUTUBE', name: 'YouTube', signal: 'Views, subs, comments', ready: true },
  { id: 'DISCORD', name: 'Discord', signal: 'Roles, activity, reactions', ready: false },
  { id: 'BANDCAMP', name: 'Bandcamp', signal: 'Purchases, tips', ready: false },
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
            <div className="flex items-center gap-2 mb-2">
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
