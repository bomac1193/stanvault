'use client'

import { formatDate, formatNumber } from '@/lib/utils'
import { RefreshCw, Trash2 } from 'lucide-react'

interface PlatformDisplayConfig {
  name: string
  countLabel?: string
}

interface ConnectionCardProps {
  platform: string
  status: string
  fanCount: number
  lastSyncAt?: string
  onSync: () => void
  onDisconnect: () => void
  isSyncing?: boolean
}

const platformConfig: Record<string, PlatformDisplayConfig> = {
  SPOTIFY: { name: 'Spotify' },
  INSTAGRAM: { name: 'Instagram' },
  YOUTUBE: { name: 'YouTube', countLabel: 'Subscribers' },
  TIKTOK: { name: 'TikTok' },
  TWITTER: { name: 'Twitter' },
  EMAIL: { name: 'Email List' },
  DASHAM: { name: 'Oryx' },
  APPLE_MUSIC: { name: 'Apple Music' },
  AUDIOMACK: { name: 'Audiomack' },
  BOOMPLAY: { name: 'Boomplay' },
  DISCORD: { name: 'Discord' },
}

export function ConnectionCard({
  platform,
  status,
  fanCount,
  lastSyncAt,
  onSync,
  onDisconnect,
  isSyncing,
}: ConnectionCardProps) {
  const config = platformConfig[platform]
  if (!config) return null

  const isHealthy = status === 'CONNECTED'
  const countLabel = config.countLabel || 'Fans'

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-body-sm font-medium text-white">{config.name}</span>
        <span className={`text-caption ${isHealthy ? 'text-gray-400' : 'text-gray-600'}`}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
      </div>

      <div className="space-y-1.5 mb-5">
        <div className="flex justify-between text-caption">
          <span className="text-gray-500">{countLabel}</span>
          <span className="text-gray-300 tabular-nums">{formatNumber(fanCount)}</span>
        </div>
        {lastSyncAt && (
          <div className="flex justify-between text-caption">
            <span className="text-gray-500">Synced</span>
            <span className="text-gray-400">{formatDate(lastSyncAt)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 text-caption text-gray-500 hover:text-white transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync
        </button>
        <button
          type="button"
          onClick={onDisconnect}
          className="text-caption text-gray-600 hover:text-gray-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
