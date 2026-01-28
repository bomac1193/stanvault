'use client'

import { useState } from 'react'
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/brand/Logo'

interface VerificationResult {
  valid: boolean
  expired?: boolean
  revoked?: boolean
  error?: string
  artistId?: string
  artistName?: string
  tier?: string
  stanScore?: number
  relationshipMonths?: number
  issuedAt?: string
  expiresAt?: string
}

export default function VerifyPage() {
  const [token, setToken] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  const handleVerify = async () => {
    if (!token.trim()) return

    setIsVerifying(true)
    setResult(null)

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      })

      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ valid: false, error: 'Verification failed' })
    } finally {
      setIsVerifying(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getTierStyle = (tier: string) => {
    switch (tier) {
      case 'SUPERFAN':
        return 'bg-white text-black'
      case 'DEDICATED':
        return 'bg-gray-300 text-black'
      case 'ENGAGED':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-gray-700 text-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <LogoMark size="md" />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-caption text-gray-600 uppercase tracking-widest mb-2">Public Verification</p>
          <h1 className="text-display-md font-bold text-white">
            Verify <span className="text-accent">"Fan"</span> Status
          </h1>
          <p className="text-body text-gray-500 font-light mt-4">
            Paste a verification token to confirm a fan's relationship with an artist.
            Cryptographically signed. Tamper-proof.
          </p>
        </div>

        {/* Input */}
        <div className="mb-8">
          <label className="block text-caption uppercase tracking-widest text-gray-400 mb-2">
            Token
          </label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token here..."
            className="w-full h-32 bg-gray-900 border border-gray-800 p-4 text-white font-mono text-body-sm placeholder:text-gray-700 focus:outline-none focus:border-accent transition-colors resize-none"
          />
          <button
            onClick={handleVerify}
            disabled={isVerifying || !token.trim()}
            className="w-full mt-4 py-4 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Verify Token
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            className={cn(
              'border-l-2 p-6',
              result.valid
                ? 'border-l-status-success bg-status-success/5'
                : 'border-l-status-error bg-status-error/5'
            )}
          >
            <div className="flex items-start gap-4">
              {result.valid ? (
                <CheckCircle className="w-6 h-6 text-status-success flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-status-error flex-shrink-0" />
              )}

              <div className="flex-1">
                <h3
                  className={cn(
                    'text-body-lg font-medium mb-1',
                    result.valid ? 'text-status-success' : 'text-status-error'
                  )}
                >
                  {result.valid ? 'Verified' : 'Failed'}
                </h3>

                {result.valid ? (
                  <div className="space-y-4">
                    {/* Artist */}
                    <div>
                      <p className="text-caption text-gray-500 uppercase tracking-wider">Artist</p>
                      <p className="text-body-lg text-white">{result.artistName}</p>
                    </div>

                    {/* Tier */}
                    <div>
                      <p className="text-caption text-gray-500 uppercase tracking-wider mb-1">Tier</p>
                      <span className={`inline-block px-4 py-2 text-body-sm font-medium uppercase tracking-wide ${getTierStyle(result.tier || 'CASUAL')}`}>
                        {result.tier}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                      <div>
                        <p className="text-caption text-gray-500 uppercase tracking-wider">Score</p>
                        <p className="text-display-sm font-bold font-mono text-white">
                          {result.stanScore}<span className="text-gray-600">/100</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-caption text-gray-500 uppercase tracking-wider">Duration</p>
                        <p className="text-display-sm font-bold font-mono text-white">
                          {result.relationshipMonths}<span className="text-gray-600">mo</span>
                        </p>
                      </div>
                    </div>

                    {/* Validity */}
                    <div className="pt-4 border-t border-gray-800 text-caption text-gray-500">
                      <p>Issued: {formatDate(result.issuedAt || '')}</p>
                      <p>Expires: {formatDate(result.expiresAt || '')}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-body-sm text-gray-400">
                    {result.expired
                      ? 'Token expired'
                      : result.revoked
                        ? 'Token revoked'
                        : result.error || 'Invalid token'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <h3 className="text-body font-medium text-white mb-4">What is this?</h3>
          <p className="text-body-sm text-gray-500 font-light">
            Stanvault verification tokens are cryptographic proofs of fan relationships.
            Artists control who gets verified. Fans own their identity.
            Use tokens for presale access, exclusive content, or any service that needs to verify fandom.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-caption text-gray-700 uppercase tracking-widest">
            <span className="text-accent">[</span>SV<span className="text-accent">]</span> — The anti-algorithm platform
          </p>
        </div>
      </footer>
    </div>
  )
}
