'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { useOnboardingStore } from '@/stores/onboarding-store'
import { PartyPopper, Users, Star, TrendingUp } from 'lucide-react'

export function SuccessStep() {
  const router = useRouter()
  const { connectedPlatforms, profileData } = useOnboardingStore()
  const [isLoading, setIsLoading] = useState(false)

  const totalFans = connectedPlatforms.reduce((acc, p) => acc + p.fanCount, 0)

  const handleComplete = async () => {
    setIsLoading(true)

    try {
      const res = await fetch('/api/users/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complete: true }),
      })

      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const stats = [
    {
      icon: Users,
      value: totalFans.toLocaleString(),
      label: 'Fans Discovered',
    },
    {
      icon: Star,
      value: connectedPlatforms.length.toString(),
      label: 'Platforms Connected',
    },
    {
      icon: TrendingUp,
      value: 'Ready',
      label: 'To Explore',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gold/20 mb-6"
      >
        <PartyPopper className="w-12 h-12 text-gold" />
      </motion.div>

      <h1 className="text-3xl font-display font-bold text-warm-white mb-4">
        You&apos;re all set, {profileData.artistName || 'Artist'}!
      </h1>

      <p className="text-lg text-vault-muted mb-8 max-w-md mx-auto">
        Your Stanvault is ready. Let&apos;s discover who your biggest supporters are.
      </p>

      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="p-4 bg-vault-dark rounded-lg border border-vault-gray"
          >
            <stat.icon className="w-6 h-6 text-gold mx-auto mb-2" />
            <p className="text-2xl font-mono font-bold text-warm-white">
              {stat.value}
            </p>
            <p className="text-xs text-vault-muted">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <Button
        size="lg"
        onClick={handleComplete}
        isLoading={isLoading}
        className="animate-pulse-gold"
      >
        Enter Your Vault
      </Button>
    </motion.div>
  )
}
