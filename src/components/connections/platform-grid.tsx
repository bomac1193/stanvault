'use client'

interface PlatformGridProps {
  connectedPlatforms: string[]
  onConnect: (platform: string) => void
  isConnecting: string | null
}

interface PlatformDefinition {
  id: string
  name: string
  signal: string
  ready: boolean
  group: 'sources' | 'reach'
}

// Map from grid display ID to Prisma enum value (when they differ)
const PLATFORM_ALIAS: Record<string, string> = {
  ORYX: 'DASHAM',
}

const platforms: PlatformDefinition[] = [
  { id: 'SPOTIFY', name: 'Spotify', signal: 'Streams, saves, repeats', ready: true, group: 'sources' },
  { id: 'YOUTUBE', name: 'YouTube', signal: 'Views, subscribers, comments', ready: true, group: 'sources' },
  { id: 'DISCORD', name: 'Discord', signal: 'Servers, roles, member counts', ready: true, group: 'sources' },
  { id: 'EMAIL', name: 'Email List', signal: 'Import existing fans', ready: true, group: 'sources' },
  { id: 'ORYX', name: 'Oryx', signal: 'Tips, conviction', ready: true, group: 'sources' },
  { id: 'INSTAGRAM', name: 'Instagram', signal: 'Follows, shares, story replies', ready: false, group: 'sources' },
  { id: 'TIKTOK', name: 'TikTok', signal: 'Views, reposts, saves', ready: false, group: 'sources' },
  { id: 'APPLE_MUSIC', name: 'Apple Music', signal: 'Streams, library adds', ready: false, group: 'sources' },
  { id: 'AUDIOMACK', name: 'Audiomack', signal: 'Streams, favorites, reposts', ready: false, group: 'sources' },
  { id: 'BOOMPLAY', name: 'Boomplay', signal: 'Streams, downloads', ready: false, group: 'sources' },
  { id: 'BANDCAMP', name: 'Bandcamp', signal: 'Purchases, tips', ready: false, group: 'sources' },
  { id: 'TWITCH', name: 'Twitch', signal: 'Bits, subs, gift subs', ready: false, group: 'sources' },
  { id: 'WHATSAPP', name: 'WhatsApp', signal: 'Broadcasts, replies, opt-ins', ready: false, group: 'reach' },
  { id: 'SMS', name: 'SMS', signal: 'Texts, reminders, direct reactivation', ready: false, group: 'reach' },
  { id: 'LINE', name: 'LINE', signal: 'Official account messaging', ready: false, group: 'reach' },
  { id: 'KAKAO', name: 'Kakao', signal: 'Fan-club messaging and identity', ready: false, group: 'reach' },
]

const groups = [
  {
    id: 'sources' as const,
    title: 'Audience Sources',
    description: 'Connect identity, engagement, and conviction signals inside Imprint.',
  },
  {
    id: 'reach' as const,
    title: 'Reach Channels',
    description: 'Direct campaign channels. Payment and mobile-money rails stay in Oryx.',
  },
]

function renderPlatformCard(
  platform: PlatformDefinition,
  isConnecting: string | null,
  onConnect: (platform: string) => void
) {
  const isLoading = isConnecting === platform.id

  return (
    <button
      key={platform.id}
      type="button"
      disabled={!platform.ready || !!isConnecting}
      onClick={() => platform.ready && !isConnecting && onConnect(platform.id)}
      className={`bg-[#0a0a0a] p-5 text-left transition-colors group min-h-[132px] flex flex-col ${
        platform.ready
          ? 'hover:bg-[#0f0f0f] cursor-pointer'
          : 'opacity-40 cursor-default'
      }`}
    >
      <div className="flex items-center gap-2 mb-2 min-h-[20px]">
        <span className="text-body-sm text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">
          {platform.name}
        </span>
        {isLoading && (
          <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      <p className="text-caption text-gray-600 leading-tight min-h-[32px]">
        {platform.signal}
      </p>
      {!platform.ready && (
        <p className="text-caption text-gray-700 mt-2">Soon</p>
      )}
    </button>
  )
}

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
    <div className="space-y-6">
      {groups.map((group) => {
        const groupPlatforms = availablePlatforms.filter((platform) => platform.group === group.id)

        if (groupPlatforms.length === 0) {
          return null
        }

        return (
          <div key={group.id}>
            <div className="px-5 py-4 border-b border-[#1a1a1a]">
              <p className="text-sm font-medium text-gray-400">{group.title}</p>
              <p className="text-caption text-gray-600 mt-1">{group.description}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[#1a1a1a]">
              {groupPlatforms.map((platform) => renderPlatformCard(platform, isConnecting, onConnect))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
