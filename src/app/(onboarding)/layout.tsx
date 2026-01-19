'use client'

import { SessionProvider } from 'next-auth/react'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-vault-black">
        {children}
      </div>
    </SessionProvider>
  )
}
