'use client'

import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { useOnboardingStore } from '@/stores/onboarding-store'
import {
  WelcomeStep,
  ProfileStep,
  PlatformsStep,
  SuccessStep,
} from '@/components/onboarding'

interface OnboardingResponse {
  artistName: string | null
  genre: string | null
  careerStage: string | null
  location: string | null
  onboardingStep: number
  onboardingCompleted: boolean
  platformConnections: Array<{
    platform: string
    fanCount: number
    status: string
  }>
}

export default function OnboardingPage() {
  const {
    step,
    nextStep,
    prevStep,
    setStep,
    setProfileData,
    setConnectedPlatforms,
  } = useOnboardingStore()

  useEffect(() => {
    let isCancelled = false

    const syncOnboardingState = async (options?: { hydrateProfile?: boolean }) => {
      try {
        const response = await fetch('/api/users/onboarding', { cache: 'no-store' })
        if (!response.ok) {
          return
        }

        const data = (await response.json()) as OnboardingResponse
        if (isCancelled) {
          return
        }

        if (options?.hydrateProfile) {
          setProfileData({
            artistName: data.artistName ?? '',
            genre: data.genre ?? '',
            careerStage: data.careerStage ?? '',
            location: data.location ?? '',
          })
        }

        setConnectedPlatforms(
          data.platformConnections
            .filter((connection) => connection.status === 'CONNECTED')
            .map((connection) => ({
              platform: connection.platform,
              fanCount: connection.fanCount,
            }))
        )

        if (data.onboardingCompleted) {
          setStep(4)
          return
        }

        if (data.onboardingStep >= 1 && data.onboardingStep <= 4) {
          setStep(data.onboardingStep)
        }
      } catch (error) {
        console.error('Failed to sync onboarding state:', error)
      }
    }

    const handleFocus = () => {
      void syncOnboardingState()
    }

    void syncOnboardingState({ hydrateProfile: true })
    window.addEventListener('focus', handleFocus)

    return () => {
      isCancelled = true
      window.removeEventListener('focus', handleFocus)
    }
  }, [setConnectedPlatforms, setProfileData, setStep])

  return (
    <div className="min-h-screen bg-vault-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-gold'
                    : s < step
                    ? 'bg-gold/50'
                    : 'bg-vault-gray'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && <WelcomeStep key="welcome" onNext={nextStep} />}
          {step === 2 && (
            <ProfileStep key="profile" onNext={nextStep} onBack={prevStep} />
          )}
          {step === 3 && (
            <PlatformsStep key="platforms" onNext={nextStep} onBack={prevStep} />
          )}
          {step === 4 && <SuccessStep key="success" />}
        </AnimatePresence>
      </div>
    </div>
  )
}
