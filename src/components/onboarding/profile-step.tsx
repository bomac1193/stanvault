'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button, Input, Select } from '@/components/ui'
import { useOnboardingStore } from '@/stores/onboarding-store'

interface ProfileStepProps {
  onNext: () => void
  onBack: () => void
}

const genreOptions = [
  { value: 'pop', label: 'Pop' },
  { value: 'hip-hop', label: 'Hip-Hop / Rap' },
  { value: 'rock', label: 'Rock' },
  { value: 'r&b', label: 'R&B / Soul' },
  { value: 'electronic', label: 'Electronic / Dance' },
  { value: 'country', label: 'Country' },
  { value: 'indie', label: 'Indie' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'classical', label: 'Classical' },
  { value: 'metal', label: 'Metal' },
  { value: 'other', label: 'Other' },
]

const careerStageOptions = [
  { value: 'EMERGING', label: 'Emerging - Just getting started' },
  { value: 'GROWING', label: 'Growing - Building momentum' },
  { value: 'ESTABLISHED', label: 'Established - Consistent fanbase' },
  { value: 'VETERAN', label: 'Veteran - Industry presence' },
]

export function ProfileStep({ onNext, onBack }: ProfileStepProps) {
  const { profileData, setProfileData } = useOnboardingStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const isValid =
    profileData.artistName && profileData.genre && profileData.careerStage

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/users/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })

      if (!res.ok) {
        throw new Error('Failed to save profile')
      }

      onNext()
    } catch {
      setError('Failed to save profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <h2 className="text-2xl font-display font-bold text-warm-white mb-2 text-center">
        Tell us about yourself
      </h2>
      <p className="text-vault-muted mb-8 text-center">
        This helps us personalize your experience
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Artist / Band Name"
          value={profileData.artistName}
          onChange={(e) => setProfileData({ artistName: e.target.value })}
          placeholder="Your artist name"
          required
        />

        <Select
          label="Primary Genre"
          value={profileData.genre}
          onChange={(e) => setProfileData({ genre: e.target.value })}
          options={genreOptions}
          placeholder="Select your genre"
          required
        />

        <Select
          label="Career Stage"
          value={profileData.careerStage}
          onChange={(e) => setProfileData({ careerStage: e.target.value })}
          options={careerStageOptions}
          placeholder="Select your career stage"
          required
        />

        <Input
          label="Location (Optional)"
          value={profileData.location}
          onChange={(e) => setProfileData({ location: e.target.value })}
          placeholder="City, Country"
        />

        {error && <p className="text-sm text-status-error">{error}</p>}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={!isValid}
            isLoading={isLoading}
          >
            Continue
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
