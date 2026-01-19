'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { Sparkles, Users, TrendingUp, Target } from 'lucide-react'

interface WelcomeStepProps {
  onNext: () => void
}

const features = [
  { icon: Users, text: 'See all your fans as unified people' },
  { icon: TrendingUp, text: 'Track engagement across platforms' },
  { icon: Target, text: 'Identify your most dedicated supporters' },
  { icon: Sparkles, text: 'Unlock insights to grow your fanbase' },
]

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/20 mb-6">
        <Sparkles className="w-10 h-10 text-gold" />
      </div>

      <h1 className="text-4xl font-display font-bold text-warm-white mb-4">
        Welcome to <span className="text-gold">Stanvault</span>
      </h1>

      <p className="text-lg text-vault-muted mb-8 max-w-md mx-auto">
        Your fan intelligence platform. Connect your platforms and discover who
        your real stans are.
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="flex items-center gap-3 p-4 bg-vault-dark rounded-lg border border-vault-gray text-left"
          >
            <feature.icon className="w-5 h-5 text-gold flex-shrink-0" />
            <span className="text-sm text-warm-white">{feature.text}</span>
          </motion.div>
        ))}
      </div>

      <Button size="lg" onClick={onNext}>
        Get Started
      </Button>
    </motion.div>
  )
}
