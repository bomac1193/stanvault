'use client'

import { AnimatePresence } from 'framer-motion'
import { useOnboardingStore } from '@/stores/onboarding-store'
import {
  WelcomeStep,
  ProfileStep,
  PlatformsStep,
  SuccessStep,
} from '@/components/onboarding'

export default function OnboardingPage() {
  const { step, nextStep, prevStep } = useOnboardingStore()

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
