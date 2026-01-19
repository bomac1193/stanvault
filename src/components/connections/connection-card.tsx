'use client'

import { Card, Button, Badge } from '@/components/ui'
import { formatDate, formatNumber } from '@/lib/utils'
import { Music, Instagram, Youtube, Twitter, Mail, RefreshCw, Trash2, Check, AlertCircle, XCircle } from 'lucide-react'

interface ConnectionCardProps {
  platform: string
  status: string
  fanCount: number
  lastSyncAt?: string
  onSync: () => void
  onDisconnect: () => void
  isSyncing?: boolean
}

const platformConfig: Record<string, { icon: typeof Music; color: string; name: string }> = {
  SPOTIFY: { icon: Music, color: '#1DB954', name: 'Spotify' },
  INSTAGRAM: { icon: Instagram, color: '#E4405F', name: 'Instagram' },
  YOUTUBE: { icon: Youtube, color: '#FF0000', name: 'YouTube' },
  TIKTOK: { icon: Music, color: '#000000', name: 'TikTok' },
  TWITTER: { icon: Twitter, color: '#1DA1F2', name: 'Twitter' },
  EMAIL: { icon: Mail, color: '#C9A227', name: 'Email List' },
}

const statusConfig: Record<string, { icon: typeof Check; variant: 'success' | 'warning' | 'error' }> = {
  CONNECTED: { icon: Check, variant: 'success' },
  EXPIRED: { icon: AlertCircle, variant: 'warning' },
  ERROR: { icon: XCircle, variant: 'error' },
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
  const statusInfo = statusConfig[status] || statusConfig.CONNECTED

  if (!config) return null

  const Icon = config.icon
  const StatusIcon = statusInfo.icon

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <Icon className="w-6 h-6" style={{ color: config.color }} />
          </div>
          <div>
            <h3 className="font-medium text-warm-white">{config.name}</h3>
            <Badge variant={statusInfo.variant} className="mt-1">
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-vault-muted">Fans synced</span>
          <span className="text-warm-white font-mono">{formatNumber(fanCount)}</span>
        </div>
        {lastSyncAt && (
          <div className="flex justify-between text-sm">
            <span className="text-vault-muted">Last synced</span>
            <span className="text-warm-white">{formatDate(lastSyncAt)}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={onSync}
          isLoading={isSyncing}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Sync
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDisconnect}
          className="text-status-error hover:text-status-error hover:bg-status-error/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}
