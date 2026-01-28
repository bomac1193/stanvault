'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Check, ExternalLink } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'

export default function FanOnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [spotifyConnected, setSpotifyConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const spotify = searchParams.get('spotify')
    const errorParam = searchParams.get('error')

    if (spotify === 'connected') {
      setSpotifyConnected(true)
      // Trigger sync to verify artist relationships
      fetch('/api/fan/sync', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          console.log('Synced relationships:', data.synced)
        })
        .catch((err) => {
          console.error('Sync failed:', err)
        })
    } else if (errorParam) {
      setError(`Connection failed: ${errorParam}`)
    }
  }, [searchParams])

  const handleConnectSpotify = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const res = await fetch('/api/fan/auth/spotify')
      const data = await res.json()

      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        throw new Error(data.error || 'Failed to get auth URL')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      setIsConnecting(false)
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)

    try {
      await fetch('/api/fan/onboarding/complete', { method: 'POST' })
      router.push('/fan/dashboard')
    } catch {
      setError('Failed to complete')
      setIsCompleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <LogoMark size="lg" />
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="text-caption text-gray-600 uppercase tracking-widest mb-2">Step 1 of 1</p>
          <h1 className="text-display-sm font-bold text-white">Connect Spotify</h1>
          <p className="text-body-sm text-gray-500 font-light mt-2">
            Verify your listening history. Prove your fandom.
          </p>
        </div>

        {/* Why */}
        <div className="mb-8 space-y-2">
          <div className="flex items-start gap-3 text-body-sm">
            <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            <span className="text-gray-300 font-light">Auto-verify streams, saves, playlist adds</span>
          </div>
          <div className="flex items-start gap-3 text-body-sm">
            <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            <span className="text-gray-300 font-light">Generate proof for presales & drops</span>
          </div>
          <div className="flex items-start gap-3 text-body-sm">
            <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            <span className="text-gray-300 font-light">We never post or modify your account</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 border-l-2 border-l-status-error bg-status-error/10 text-status-error text-caption">
            {error}
          </div>
        )}

        {/* Connection Status */}
        {spotifyConnected ? (
          <div className="mb-6 p-4 border-l-2 border-l-status-success bg-status-success/5">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-status-success" />
              <div>
                <p className="font-medium text-status-success">Connected</p>
                <p className="text-caption text-gray-500">Listening history verified</p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleConnectSpotify}
            disabled={isConnecting}
            className="w-full mb-6 py-4 bg-[#1DB954] text-white font-medium hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Connect Spotify
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>
        )}

        {/* Continue */}
        <button
          onClick={handleComplete}
          disabled={isCompleting}
          className={`w-full py-4 font-medium transition-all flex items-center justify-center gap-2 ${
            spotifyConnected
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-gray-900 text-gray-500 hover:bg-gray-800'
          }`}
        >
          {isCompleting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading
            </>
          ) : spotifyConnected ? (
            'Continue →'
          ) : (
            'Skip for now'
          )}
        </button>

        {!spotifyConnected && (
          <p className="text-center text-caption text-gray-600 mt-4">
            You can connect later from your dashboard
          </p>
        )}
      </div>
    </div>
  )
}
