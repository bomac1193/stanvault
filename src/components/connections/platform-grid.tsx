'use client'

import { Card } from '@/components/ui'
import { Music, Instagram, Youtube, Twitter, Mail, Plus } from 'lucide-react'

interface PlatformGridProps {
  connectedPlatforms: string[]
  onConnect: (platform: string) => void
  isConnecting: string | null
}

const platforms = [
  { id: 'SPOTIFY', name: 'Spotify', icon: Music, color: '#1DB954' },
  { id: 'INSTAGRAM', name: 'Instagram', icon: Instagram, color: '#E4405F' },
  { id: 'YOUTUBE', name: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'TIKTOK', name: 'TikTok', icon: Music, color: '#000000' },
  { id: 'TWITTER', name: 'Twitter', icon: Twitter, color: '#1DA1F2' },
  { id: 'EMAIL', name: 'Email List', icon: Mail, color: '#C9A227' },
]

export function PlatformGrid({ connectedPlatforms, onConnect, isConnecting }: PlatformGridProps) {
  const availablePlatforms = platforms.filter(
    (p) => !connectedPlatforms.includes(p.id)
  )

  if (availablePlatforms.length === 0) {
    return (
      <div className="text-center py-8 text-vault-muted">
        All platforms connected!
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {availablePlatforms.map((platform) => {
        const Icon = platform.icon
        const isLoading = isConnecting === platform.id

        return (
          <Card
            key={platform.id}
            variant="outlined"
            className="p-4 cursor-pointer transition-all duration-200 hover:border-gold hover:bg-gold/5"
            onClick={() => !isConnecting && onConnect(platform.id)}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center relative"
                style={{ backgroundColor: `${platform.color}20` }}
              >
                <Icon className="w-6 h-6" style={{ color: platform.color }} />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-vault-dark/80 rounded-full">
                    <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-warm-white">
                {platform.name}
              </span>
              <div className="flex items-center gap-1 text-xs text-gold">
                <Plus className="w-3 h-3" />
                Connect
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
