'use client'

import { useState } from 'react'
import { Shield, CheckCircle, XCircle, Loader2, Music } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'SUPERFAN':
        return 'text-gold bg-gold/20 border-gold'
      case 'DEDICATED':
        return 'text-tier-dedicated bg-tier-dedicated/20 border-tier-dedicated'
      case 'ENGAGED':
        return 'text-tier-engaged bg-tier-engaged/20 border-tier-engaged'
      default:
        return 'text-tier-casual bg-tier-casual/20 border-tier-casual'
    }
  }

  return (
    <div className="min-h-screen bg-vault-black">
      {/* Header */}
      <header className="border-b border-vault-gray">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-gold/10 rounded-lg">
            <Music className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-warm-white">Stanvault</h1>
            <p className="text-sm text-vault-muted">Fan Verification</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-gold mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-warm-white mb-2">
            Verify Fan Status
          </h2>
          <p className="text-vault-muted">
            Enter a verification token to confirm a fan's relationship with an artist
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-vault-dark border border-vault-gray rounded-lg p-6 mb-8">
          <label className="block text-sm font-medium text-warm-white mb-2">
            Verification Token
          </label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste the verification token here..."
            className="w-full h-24 px-4 py-3 bg-vault-darker border border-vault-gray rounded-lg text-warm-white placeholder:text-vault-muted focus:outline-none focus:border-gold font-mono text-sm resize-none"
          />
          <button
            onClick={handleVerify}
            disabled={isVerifying || !token.trim()}
            className="w-full mt-4 px-6 py-3 bg-gold text-vault-black font-semibold rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Verify Token
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            className={cn(
              'border rounded-lg p-6',
              result.valid
                ? 'bg-status-success/10 border-status-success'
                : 'bg-status-error/10 border-status-error'
            )}
          >
            <div className="flex items-start gap-4">
              {result.valid ? (
                <CheckCircle className="w-8 h-8 text-status-success flex-shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-status-error flex-shrink-0" />
              )}

              <div className="flex-1">
                <h3
                  className={cn(
                    'text-xl font-bold mb-2',
                    result.valid ? 'text-status-success' : 'text-status-error'
                  )}
                >
                  {result.valid ? 'Verified Fan' : 'Verification Failed'}
                </h3>

                {result.valid ? (
                  <div className="space-y-4">
                    {/* Artist */}
                    <div>
                      <p className="text-sm text-vault-muted mb-1">Artist</p>
                      <p className="text-lg font-semibold text-warm-white">
                        {result.artistName}
                      </p>
                    </div>

                    {/* Tier Badge */}
                    <div>
                      <p className="text-sm text-vault-muted mb-1">Fan Tier</p>
                      <span
                        className={cn(
                          'inline-block px-4 py-2 rounded-lg border font-bold text-lg',
                          getTierColor(result.tier || 'CASUAL')
                        )}
                      >
                        {result.tier}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-vault-gray">
                      <div>
                        <p className="text-sm text-vault-muted">Stan Score</p>
                        <p className="text-2xl font-mono font-bold text-warm-white">
                          {result.stanScore}
                          <span className="text-sm text-vault-muted">/100</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-vault-muted">Fan For</p>
                        <p className="text-2xl font-mono font-bold text-warm-white">
                          {result.relationshipMonths}
                          <span className="text-sm text-vault-muted"> months</span>
                        </p>
                      </div>
                    </div>

                    {/* Validity Period */}
                    <div className="pt-4 border-t border-vault-gray text-sm text-vault-muted">
                      <p>
                        Token issued: {formatDate(result.issuedAt || '')}
                      </p>
                      <p>
                        Valid until: {formatDate(result.expiresAt || '')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-vault-muted">
                    {result.expired
                      ? 'This token has expired.'
                      : result.revoked
                        ? 'This token has been revoked.'
                        : result.error || 'Invalid or malformed token.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-warm-white mb-3">
            What is Fan Verification?
          </h3>
          <p className="text-vault-muted mb-6 max-w-lg mx-auto">
            Stanvault verification tokens allow fans to cryptographically prove
            their relationship with an artist. This can be used for presale
            access, exclusive content, loyalty rewards, and more.
          </p>
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6 text-gold" />
              </div>
              <p className="text-vault-muted">Tamper-proof</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-gold" />
              </div>
              <p className="text-vault-muted">Instant Verification</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Music className="w-6 h-6 text-gold" />
              </div>
              <p className="text-vault-muted">Artist Controlled</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-vault-gray mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-sm text-vault-muted">
          <p>Stanvault • Fan Intelligence Platform</p>
          <p className="mt-1">What Matters Stays</p>
        </div>
      </footer>
    </div>
  )
}
