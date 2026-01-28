'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Shield,
  Copy,
  Check,
  Trash2,
  Plus,
  Loader2,
  ArrowLeft,
  Clock,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'

interface Token {
  id: string
  artistId: string
  tier: string
  stanScore: number
  relationshipMonths: number
  issuedAt: string
  expiresAt: string
  usageCount: number
  lastUsedAt?: string
  purpose?: string
}

interface ArtistRelationship {
  artistId: string
  artistName: string
  tier: string
  stanScore: number
}

export default function FanTokensPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedArtist = searchParams.get('artist')

  const [tokens, setTokens] = useState<Token[]>([])
  const [relationships, setRelationships] = useState<ArtistRelationship[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedArtistId, setSelectedArtistId] = useState<string>(preselectedArtist || '')
  const [purpose, setPurpose] = useState('')
  const [expiryDays, setExpiryDays] = useState(30)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (preselectedArtist) {
      setSelectedArtistId(preselectedArtist)
      setShowGenerateModal(true)
    }
  }, [preselectedArtist])

  async function fetchData() {
    try {
      const [tokensRes, dashboardRes] = await Promise.all([
        fetch('/api/fan/tokens'),
        fetch('/api/fan/dashboard'),
      ])

      if (!tokensRes.ok || !dashboardRes.ok) {
        if (tokensRes.status === 401 || dashboardRes.status === 401) {
          router.push('/fan/login')
          return
        }
        throw new Error('Failed to load data')
      }

      const tokensData = await tokensRes.json()
      const dashboardData = await dashboardRes.json()

      setTokens(tokensData.tokens || [])
      setRelationships(
        dashboardData.relationships?.map((r: { artist: { id: string; name: string }; tier: string; stanScore: number }) => ({
          artistId: r.artist.id,
          artistName: r.artist.name,
          tier: r.tier,
          stanScore: r.stanScore,
        })) || []
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateToken = async () => {
    if (!selectedArtistId) return

    setIsGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/fan/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId: selectedArtistId,
          purpose: purpose || undefined,
          expiryDays,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate token')
      }

      const data = await res.json()
      setGeneratedToken(data.token)
      fetchData() // Refresh token list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate token')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyToken = async (token: string, id: string) => {
    try {
      await navigator.clipboard.writeText(token)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  const handleRevokeToken = async (tokenId: string) => {
    setRevokingId(tokenId)
    try {
      const res = await fetch(`/api/fan/tokens?tokenId=${tokenId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to revoke token')
      }

      setTokens(tokens.filter((t) => t.id !== tokenId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke token')
    } finally {
      setRevokingId(null)
    }
  }

  const closeModal = () => {
    setShowGenerateModal(false)
    setGeneratedToken(null)
    setSelectedArtistId('')
    setPurpose('')
    setExpiryDays(30)
  }

  const getArtistName = (artistId: string) => {
    const rel = relationships.find((r) => r.artistId === artistId)
    return rel?.artistName || 'Unknown Artist'
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'SUPERFAN':
        return 'text-gold'
      case 'DEDICATED':
        return 'text-purple-400'
      case 'ENGAGED':
        return 'text-blue-400'
      default:
        return 'text-vault-muted'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isExpiringSoon = (expiresAt: string) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiry <= 7
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-vault-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-vault-black">
      {/* Header */}
      <header className="border-b border-vault-gray/60/60">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/fan/dashboard"
            className="inline-flex items-center gap-2 text-vault-muted hover:text-warm-white transition-colors mb-4 nav-item"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-warm-white">Verification Tokens</h1>
              <p className="text-vault-muted">
                Prove your fan status to third parties
              </p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-vault-black font-medium tracking-wide rounded-md hover:bg-gold-light transition-colors"
            >
              <Plus className="w-4 h-4" />
              Generate Token
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-status-error/10 border border-status-error rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0" />
            <p className="text-status-error">{error}</p>
          </div>
        )}

        {/* Info Card */}
        <div className="mb-8 p-4 bg-vault-dark border border-vault-gray/60 rounded-md">
          <h3 className="font-display font-bold text-warm-white mb-2">What are verification tokens?</h3>
          <p className="text-sm text-vault-muted">
            Verification tokens are cryptographic proofs of your fan relationship with an artist.
            Share them with ticket vendors, merch sites, or Discord bots to prove your superfan
            status and unlock exclusive access. Each token is signed and verifiable without
            exposing your personal data.
          </p>
        </div>

        {/* Tokens List */}
        {tokens.length === 0 ? (
          <div className="bg-vault-dark border border-vault-gray/60 rounded-md p-12 text-center">
            <Shield className="w-12 h-12 text-vault-muted mx-auto mb-4" />
            <p className="text-warm-white mb-2">No active tokens</p>
            <p className="text-sm text-vault-muted mb-4">
              Generate a token to prove your fan status
            </p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-vault-black font-medium rounded-md hover:bg-gold-light"
            >
              <Plus className="w-4 h-4" />
              Generate Your First Token
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="bg-vault-dark border border-vault-gray/60 rounded-md p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-warm-white">
                      {getArtistName(token.artistId)}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className={getTierColor(token.tier)}>{token.tier}</span>
                      <span className="text-vault-muted">Score: {token.stanScore}</span>
                      <span className="text-vault-muted">
                        {token.relationshipMonths} months
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyToken(token.id, token.id)}
                      className="p-2 text-vault-muted hover:text-warm-white transition-colors"
                      title="Copy token ID"
                    >
                      {copiedId === token.id ? (
                        <Check className="w-4 h-4 text-status-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRevokeToken(token.id)}
                      disabled={revokingId === token.id}
                      className="p-2 text-vault-muted hover:text-status-error transition-colors disabled:opacity-50"
                      title="Revoke token"
                    >
                      {revokingId === token.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {token.purpose && (
                  <p className="text-sm text-vault-muted mb-3">Purpose: {token.purpose}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-vault-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Issued {formatDate(token.issuedAt)}
                  </span>
                  <span
                    className={
                      isExpiringSoon(token.expiresAt)
                        ? 'text-status-warning'
                        : ''
                    }
                  >
                    Expires {formatDate(token.expiresAt)}
                    {isExpiringSoon(token.expiresAt) && ' (soon)'}
                  </span>
                  {token.usageCount > 0 && (
                    <span>Used {token.usageCount} times</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-vault-dark border border-vault-gray/60 rounded-md w-full max-w-md">
            <div className="px-6 py-4 border-b border-vault-gray/60">
              <h3 className="text-lg font-semibold text-warm-white">
                {generatedToken ? 'Token Generated' : 'Generate Verification Token'}
              </h3>
            </div>

            <div className="p-6">
              {generatedToken ? (
                <div>
                  <div className="mb-4 p-4 bg-status-success/10 border border-status-success rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-5 h-5 text-status-success" />
                      <span className="font-medium text-status-success">
                        Token created successfully
                      </span>
                    </div>
                    <p className="text-sm text-vault-muted">
                      Copy this token and share it where needed
                    </p>
                  </div>

                  <div className="relative">
                    <textarea
                      readOnly
                      value={generatedToken}
                      className="w-full h-32 p-3 bg-vault-darker border border-vault-gray/60 rounded-md text-warm-white text-xs font-mono resize-none"
                    />
                    <button
                      onClick={() => handleCopyToken(generatedToken, 'generated')}
                      className="absolute top-2 right-2 p-2 bg-vault-gray rounded hover:bg-vault-muted/20 transition-colors"
                    >
                      {copiedId === 'generated' ? (
                        <Check className="w-4 h-4 text-status-success" />
                      ) : (
                        <Copy className="w-4 h-4 text-vault-muted" />
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-vault-muted">
                    This token can be verified at any Stanvault-integrated service
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-warm-white mb-2">
                      Select Artist
                    </label>
                    <select
                      value={selectedArtistId}
                      onChange={(e) => setSelectedArtistId(e.target.value)}
                      className="w-full px-3 py-2 bg-vault-darker border border-vault-gray/60 rounded-md text-warm-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                    >
                      <option value="">Choose an artist...</option>
                      {relationships.map((rel) => (
                        <option key={rel.artistId} value={rel.artistId}>
                          {rel.artistName} ({rel.tier} - {rel.stanScore} pts)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-warm-white mb-2">
                      Purpose (optional)
                    </label>
                    <input
                      type="text"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="e.g., Concert presale, Discord verification"
                      className="w-full px-3 py-2 bg-vault-darker border border-vault-gray/60 rounded-md text-warm-white placeholder:text-vault-muted focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-warm-white mb-2">
                      Token Validity
                    </label>
                    <select
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-vault-darker border border-vault-gray/60 rounded-md text-warm-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                    >
                      <option value={7}>7 days</option>
                      <option value={30}>30 days</option>
                      <option value={60}>60 days</option>
                      <option value={90}>90 days (max)</option>
                    </select>
                  </div>

                  {relationships.length === 0 && (
                    <div className="p-3 bg-status-warning/10 border border-status-warning rounded-lg">
                      <p className="text-sm text-status-warning">
                        No artist relationships found. Connect Spotify to verify your listening
                        history first.
                      </p>
                      <Link
                        href="/fan/onboarding"
                        className="inline-flex items-center gap-1 text-sm text-gold hover:underline mt-2"
                      >
                        Connect Spotify <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-vault-gray/60 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-vault-muted hover:text-warm-white transition-colors"
              >
                {generatedToken ? 'Done' : 'Cancel'}
              </button>
              {!generatedToken && (
                <button
                  onClick={handleGenerateToken}
                  disabled={!selectedArtistId || isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-gold text-vault-black font-medium rounded-md hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Generate Token
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
