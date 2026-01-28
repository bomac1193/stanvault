'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Check, ExternalLink, Sparkles } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'

export default function FanOnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [spotifyConnected, setSpotifyConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check for Spotify callback
  useEffect(() => {
    const spotify = searchParams.get('spotify')
    const errorParam = searchParams.get('error')

    if (spotify === 'connected') {
      setSpotifyConnected(true)
    } else if (errorParam) {
      setError(`Spotify connection failed: ${errorParam}`)
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
      // Complete onboarding
      await fetch('/api/fan/onboarding/complete', { method: 'POST' })
      router.push('/fan/dashboard')
    } catch {
      setError('Failed to complete onboarding')
      setIsCompleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-vault-black flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="md" />
          <p className="font-display font-bold text-lg text-warm-white mt-6">Connect Your Music</p>
          <p className="text-vault-muted mt-1">
            Link Spotify to verify your listening history
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-vault-dark border border-vault-gray/60 rounded-md p-6">
          {error && (
            <div className="mb-6 p-3 bg-status-error/10 border border-status-error rounded-md text-status-error text-sm">
              {error}
            </div>
          )}

          {/* Why Connect */}
          <div className="mb-6 p-4 bg-vault-darker rounded-md">
            <h3 className="text-sm font-display font-bold uppercase tracking-wide text-warm-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              Why connect Spotify?
            </h3>
            <ul className="space-y-2 text-sm text-vault-muted">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-gold mt-0.5" />
                <span>Automatically verify your listening history with artists</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-gold mt-0.5" />
                <span>Get credited for your streams, saves, and playlist adds</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-gold mt-0.5" />
                <span>Generate proof of fandom for presales and exclusive drops</span>
              </li>
            </ul>
          </div>

          {/* Spotify Connection */}
          {spotifyConnected ? (
            <div className="mb-6 p-4 bg-moss-light/10 border border-moss-light rounded-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-moss-light/20 rounded-full">
                  <Check className="w-5 h-5 text-moss-light" />
                </div>
                <div>
                  <p className="font-medium text-moss-light">Spotify Connected</p>
                  <p className="text-sm text-vault-muted">
                    Your listening history is now verifiable
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleConnectSpotify}
              disabled={isConnecting}
              className="w-full mb-6 py-4 bg-[#1DB954] text-white font-semibold tracking-wide rounded-md hover:bg-[#1ed760] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  Connect Spotify
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {/* Privacy Note */}
          <p className="text-xs text-vault-muted text-center mb-6">
            We only read your listening history to verify fandom.
            We never post anything or modify your account.
          </p>

          {/* Continue Button */}
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className={`w-full py-3 font-semibold tracking-wide rounded-md transition-colors flex items-center justify-center gap-2 ${
              spotifyConnected
                ? 'bg-gold text-vault-black hover:bg-gold-light'
                : 'bg-vault-gray text-vault-muted hover:bg-vault-muted/20'
            }`}
          >
            {isCompleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Setting up...
              </>
            ) : spotifyConnected ? (
              'Continue to Dashboard'
            ) : (
              'Skip for now'
            )}
          </button>
        </div>

        {/* Skip info */}
        {!spotifyConnected && (
          <p className="text-center text-vault-muted text-sm mt-4">
            You can always connect Spotify later from your dashboard
          </p>
        )}
      </div>
    </div>
  )
}
