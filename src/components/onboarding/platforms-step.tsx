'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button, Card, Modal } from '@/components/ui'
import { useOnboardingStore } from '@/stores/onboarding-store'
import {
  Music,
  Instagram,
  Youtube,
  Twitter,
  Mail,
  Check,
  Loader2,
} from 'lucide-react'

interface PlatformsStepProps {
  onNext: () => void
  onBack: () => void
}

const platforms = [
  { id: 'SPOTIFY', name: 'Spotify', icon: Music, color: '#1DB954' },
  { id: 'INSTAGRAM', name: 'Instagram', icon: Instagram, color: '#E4405F' },
  { id: 'YOUTUBE', name: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'TIKTOK', name: 'TikTok', icon: Music, color: '#000000' },
  { id: 'TWITTER', name: 'Twitter', icon: Twitter, color: '#1DA1F2' },
  { id: 'EMAIL', name: 'Email List', icon: Mail, color: '#C9A227' },
]

export function PlatformsStep({ onNext, onBack }: PlatformsStepProps) {
  const { connectedPlatforms, addConnectedPlatform, isConnecting, setIsConnecting } =
    useOnboardingStore()
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const hasConnections = connectedPlatforms.length > 0

  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId)
    setShowModal(true)
    setIsConnecting(true)

    // Simulate OAuth flow delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    try {
      const res = await fetch(`/api/platforms/${platformId.toLowerCase()}/connect`, {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Connection failed')
      }

      const data = await res.json()
      addConnectedPlatform({ platform: platformId, fanCount: data.fanCount })
    } catch (error) {
      console.error('Failed to connect platform:', error)
    } finally {
      setIsConnecting(false)
      setShowModal(false)
      setConnectingPlatform(null)
    }
  }

  const isConnected = (platformId: string) =>
    connectedPlatforms.some((p) => p.platform === platformId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-display font-bold text-warm-white mb-2 text-center">
        Connect your platforms
      </h2>
      <p className="text-vault-muted mb-8 text-center">
        Connect at least one platform to start discovering your fans
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {platforms.map((platform) => {
          const connected = isConnected(platform.id)
          const Icon = platform.icon

          return (
            <Card
              key={platform.id}
              variant="outlined"
              className={`p-4 cursor-pointer transition-all duration-200 ${
                connected
                  ? 'border-status-success bg-status-success/10'
                  : 'hover:border-gold hover:bg-gold/5'
              }`}
              onClick={() => !connected && !isConnecting && handleConnect(platform.id)}
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
                {connected && (
                  <div className="flex items-center gap-1 text-status-success text-xs">
                    <Check className="w-3 h-3" />
                    Connected
                  </div>
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
            {connectedPlatforms.reduce((acc, p) => acc + p.fanCount, 0).toLocaleString()}{' '}
            fans discovered
          </p>
        </motion.div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={!hasConnections}
          onClick={onNext}
        >
          {hasConnections ? 'Continue' : 'Connect at least one platform'}
        </Button>
      </div>

      {/* Mock OAuth Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {}}
        size="sm"
      >
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-warm-white mb-2">
            Connecting to {connectingPlatform}...
          </h3>
          <p className="text-sm text-vault-muted">
            Syncing your fan data. This may take a moment.
          </p>
        </div>
      </Modal>
    </motion.div>
  )
}
