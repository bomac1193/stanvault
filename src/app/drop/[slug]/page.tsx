'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Lock, Check, Download, ExternalLink, AlertCircle } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'

interface Drop {
  id: string
  slug: string
  title: string
  description: string | null
  contentType: string
  minTier: string | null
  minScore: number | null
  minMonths: number | null
  startsAt: string | null
  endsAt: string | null
  maxClaims: number | null
  claimCount: number
  isAvailable: boolean
  artist: {
    id: string
    artistName: string | null
    name: string | null
    image: string | null
    spotifyArtistId: string | null
  }
}

interface ClaimResponse {
  success?: boolean
  alreadyClaimed?: boolean
  content?: string
  contentType?: string
  message?: string
  error?: string
  requiresAuth?: boolean
  requiresVerification?: boolean
  artistId?: string
  artistName?: string
  spotifyArtistId?: string
  yourTier?: string
  requiredTier?: string
  yourScore?: number
  requiredScore?: number
  yourMonths?: number
  requiredMonths?: number
}

export default function DropPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [drop, setDrop] = useState<Drop | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimResult, setClaimResult] = useState<ClaimResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDrop() {
      try {
        const res = await fetch(`/api/drops/${slug}`)
        const data = await res.json()
        if (data.error) {
          setError(data.error)
        } else {
          setDrop(data.drop)
        }
      } catch {
        setError('Failed to load drop')
      } finally {
        setLoading(false)
      }
    }
    fetchDrop()
  }, [slug])

  const handleClaim = async () => {
    setClaiming(true)
    setClaimResult(null)

    try {
      const res = await fetch(`/api/drops/${slug}`, { method: 'POST' })
      const data: ClaimResponse = await res.json()

      if (data.requiresAuth) {
        router.push(`/fan/login?redirect=/drop/${slug}`)
        return
      }

      setClaimResult(data)
    } catch {
      setClaimResult({ error: 'Failed to claim drop' })
    } finally {
      setClaiming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (error || !drop) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <LogoMark size="lg" className="mb-8" />
          <h1 className="text-display-sm font-bold text-white mb-4">Drop Not Found</h1>
          <p className="text-gray-500">{error || 'This drop does not exist.'}</p>
        </div>
      </div>
    )
  }

  const artistName = drop.artist.artistName || drop.artist.name || 'Unknown Artist'

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <LogoMark size="sm" />
          <span className="text-caption text-gray-600 uppercase tracking-widest">Verified Drop</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-6 py-12">
        {/* Artist */}
        <div className="flex items-center gap-3 mb-8">
          {drop.artist.image ? (
            <img
              src={drop.artist.image}
              alt={artistName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {artistName[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-white font-medium">{artistName}</p>
            <p className="text-caption text-gray-500">Exclusive Drop</p>
          </div>
        </div>

        {/* Drop Title */}
        <h1 className="text-display-md font-bold text-white mb-4">{drop.title}</h1>

        {/* Description */}
        {drop.description && (
          <p className="text-body text-gray-400 font-light mb-8">{drop.description}</p>
        )}

        {/* Requirements */}
        <div className="mb-8 p-4 border border-gray-800 bg-gray-900/50">
          <p className="text-caption text-gray-500 uppercase tracking-widest mb-4">Requirements</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-body-sm">
              <Lock className="w-4 h-4 text-accent" />
              <span className="text-gray-300">
                {drop.minTier
                  ? `${drop.minTier} tier or higher`
                  : 'Verified fan of this artist'}
              </span>
            </div>
            {drop.minScore && (
              <div className="flex items-center gap-3 text-body-sm">
                <Lock className="w-4 h-4 text-accent" />
                <span className="text-gray-300">Stan score {drop.minScore}+</span>
              </div>
            )}
            {drop.minMonths && (
              <div className="flex items-center gap-3 text-body-sm">
                <Lock className="w-4 h-4 text-accent" />
                <span className="text-gray-300">{drop.minMonths}+ months as a fan</span>
              </div>
            )}
          </div>
        </div>

        {/* Inventory / Time */}
        {(drop.maxClaims || drop.endsAt) && (
          <div className="mb-8 flex gap-6">
            {drop.maxClaims && (
              <div>
                <p className="text-display-sm font-bold text-white">
                  {drop.maxClaims - drop.claimCount}
                </p>
                <p className="text-caption text-gray-500">remaining</p>
              </div>
            )}
            {drop.endsAt && (
              <div>
                <p className="text-display-sm font-bold text-white">
                  {new Date(drop.endsAt).toLocaleDateString()}
                </p>
                <p className="text-caption text-gray-500">ends</p>
              </div>
            )}
          </div>
        )}

        {/* Claim Result */}
        {claimResult && (
          <div className="mb-8">
            {claimResult.success ? (
              <div className="p-4 border-l-2 border-l-status-success bg-status-success/5">
                <div className="flex items-center gap-3 mb-4">
                  <Check className="w-5 h-5 text-status-success" />
                  <p className="font-medium text-status-success">
                    {claimResult.alreadyClaimed ? 'Already Claimed' : 'Claimed!'}
                  </p>
                </div>

                {/* Show content based on type */}
                {claimResult.contentType === 'DOWNLOAD' && claimResult.content && (
                  <a
                    href={claimResult.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                )}

                {claimResult.contentType === 'LINK' && claimResult.content && (
                  <a
                    href={claimResult.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Access Link
                  </a>
                )}

                {claimResult.contentType === 'MESSAGE' && claimResult.content && (
                  <div className="mt-4 p-4 bg-black border border-gray-700">
                    <p className="text-white font-light whitespace-pre-wrap">{claimResult.content}</p>
                  </div>
                )}

                {claimResult.contentType === 'PRESALE' && claimResult.content && (
                  <div className="mt-4">
                    <p className="text-caption text-gray-500 mb-2">Your presale code:</p>
                    <div className="p-4 bg-black border border-accent font-mono text-xl text-accent text-center">
                      {claimResult.content}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 border-l-2 border-l-status-error bg-status-error/5">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="w-5 h-5 text-status-error" />
                  <p className="font-medium text-status-error">Access Denied</p>
                </div>
                <p className="text-body-sm text-gray-400">{claimResult.error}</p>

                {claimResult.requiresVerification && (
                  <button
                    onClick={() => router.push('/fan/onboarding')}
                    className="mt-4 px-6 py-3 bg-accent text-black font-medium hover:brightness-110 transition-all"
                  >
                    Connect Spotify to Verify
                  </button>
                )}

                {claimResult.yourTier && claimResult.requiredTier && (
                  <p className="mt-2 text-caption text-gray-500">
                    Your tier: {claimResult.yourTier} | Required: {claimResult.requiredTier}
                  </p>
                )}

                {claimResult.yourScore !== undefined && claimResult.requiredScore && (
                  <p className="mt-2 text-caption text-gray-500">
                    Your score: {claimResult.yourScore} | Required: {claimResult.requiredScore}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Claim Button */}
        {!claimResult?.success && drop.isAvailable && (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full py-4 bg-accent text-black font-medium hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {claiming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Claim Drop'
            )}
          </button>
        )}

        {!drop.isAvailable && !claimResult?.success && (
          <div className="text-center p-6 border border-gray-800">
            <p className="text-gray-500">This drop is no longer available.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 p-6 mt-12">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-caption text-gray-600">
            Verified by <span className="text-accent">[</span>STANVAULT<span className="text-accent">]</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
