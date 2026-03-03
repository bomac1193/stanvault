'use client'

import { Button } from '@/components/ui'
import { formatDate, formatNumber } from '@/lib/utils'
import { Music, Instagram, Youtube, Twitter, Mail, Heart, RefreshCw, Trash2, Headphones, Radio, MessageCircle } from 'lucide-react'

interface ConnectionCardProps {
  platform: string
  status: string
  fanCount: number
  lastSyncAt?: string
  onSync: () => void
  onDisconnect: () => void
  isSyncing?: boolean
}

const platformConfig: Record<string, { icon: typeof Music; name: string }> = {
  SPOTIFY: { icon: Music, name: 'Spotify' },
  INSTAGRAM: { icon: Instagram, name: 'Instagram' },
  YOUTUBE: { icon: Youtube, name: 'YouTube' },
  TIKTOK: { icon: Music, name: 'TikTok' },
  TWITTER: { icon: Twitter, name: 'Twitter' },
  EMAIL: { icon: Mail, name: 'Email List' },
  DASHAM: { icon: Heart, name: 'Oryx' },
  APPLE_MUSIC: { icon: Music, name: 'Apple Music' },
  AUDIOMACK: { icon: Headphones, name: 'Audiomack' },
  BOOMPLAY: { icon: Radio, name: 'Boomplay' },
  DISCORD: { icon: MessageCircle, name: 'Discord' },
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

  const Icon = config.icon
  const isHealthy = status === 'CONNECTED'

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="text-body-sm font-medium text-white">{config.name}</span>
        </div>
        <span className={`text-caption ${isHealthy ? 'text-gray-400' : 'text-gray-600'}`}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
      </div>

      <div className="space-y-1.5 mb-5">
        <div className="flex justify-between text-caption">
          <span className="text-gray-500">Fans</span>
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
