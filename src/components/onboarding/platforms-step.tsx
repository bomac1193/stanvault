'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@/components/ui'
import { useOnboardingStore } from '@/stores/onboarding-store'
import {
  Music,
  Instagram,
  Youtube,
  Twitter,
  Mail,
  Check,
} from 'lucide-react'

interface PlatformsStepProps {
  onNext: () => void
  onBack: () => void
}

const platforms = [
  { id: 'SPOTIFY', name: 'Spotify', icon: Music, color: '#1DB954', status: 'available' as const },
  { id: 'INSTAGRAM', name: 'Instagram', icon: Instagram, color: '#E4405F', status: 'soon' as const },
  { id: 'YOUTUBE', name: 'YouTube', icon: Youtube, color: '#FF0000', status: 'available' as const },
  { id: 'TIKTOK', name: 'TikTok', icon: Music, color: '#000000', status: 'soon' as const },
  { id: 'TWITTER', name: 'Twitter', icon: Twitter, color: '#1DA1F2', status: 'soon' as const },
  { id: 'EMAIL', name: 'Email List', icon: Mail, color: '#C9A227', status: 'import' as const },
]

export function PlatformsStep({ onNext, onBack }: PlatformsStepProps) {
  const router = useRouter()
  const { connectedPlatforms } = useOnboardingStore()

  const hasConnections = connectedPlatforms.length > 0
  const totalAudience = connectedPlatforms.reduce((acc, platform) => acc + platform.fanCount, 0)

  const isConnected = (platformId: string) =>
    connectedPlatforms.some((platform) => platform.platform === platformId)

  const openConnections = () => {
    router.push('/connections')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-medium text-warm-white mb-2 text-center" style={{ fontFamily: 'Canela, serif' }}>
        Connect your platforms
      </h2>
      <p className="text-vault-muted mb-8 text-center">
        Real connections now happen in Connections. This step reads back whatever you have already linked.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {platforms.map((platform) => {
          const connected = isConnected(platform.id)
          const Icon = platform.icon
          const isOpenable = platform.status !== 'soon'

          return (
            <Card
              key={platform.id}
              variant="outlined"
              className={`p-4 transition-all duration-200 ${
                connected
                  ? 'border-status-success bg-status-success/10'
                  : isOpenable
                  ? 'cursor-pointer hover:border-gold hover:bg-gold/5'
                  : 'opacity-60'
              }`}
              onClick={() => !connected && isOpenable && openConnections()}
            >
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${platform.color}20` }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: platform.color }}
                  />
                </div>
                <span className="text-sm font-medium text-warm-white">
                  {platform.name}
                </span>
                {connected ? (
                  <div className="flex items-center gap-1 text-status-success text-xs">
                    <Check className="w-3 h-3" />
                    Connected
                  </div>
                ) : platform.status === 'available' ? (
                  <div className="text-xs text-gold">Open Connections</div>
                ) : platform.status === 'import' ? (
                  <div className="text-xs text-vault-muted">Import in Connections</div>
                ) : (
                  <div className="text-xs text-vault-muted">Coming soon</div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {hasConnections && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <p className="text-status-success">
            {connectedPlatforms.length} platform
            {connectedPlatforms.length > 1 ? 's' : ''} connected
          </p>
          <p className="text-sm text-vault-muted">
            {totalAudience.toLocaleString()} audience synced across connected platforms
          </p>
        </motion.div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" variant="outline" onClick={openConnections}>
          Open Connections
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={onNext}
        >
          {hasConnections ? 'Continue' : 'Skip for now'}
        </Button>
      </div>
    </motion.div>
  )
}
