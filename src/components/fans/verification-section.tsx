'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import {
  Shield,
  Copy,
  Check,
  Trash2,
  Plus,
  ExternalLink,
  Clock,
  Eye,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface VerificationToken {
  id: string
  tier: string
  stanScore: number
  relationshipMonths: number
  issuedAt: string
  expiresAt: string
  usageCount: number
  lastUsedAt?: string
  issuedFor?: string
}

interface VerificationSectionProps {
  fanId: string
  fanName: string
  tier: string
  className?: string
}

export function VerificationSection({
  fanId,
  fanName,
  tier,
  className,
}: VerificationSectionProps) {
  const queryClient = useQueryClient()
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [newToken, setNewToken] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['fan', fanId, 'tokens'],
    queryFn: async () => {
      const res = await fetch(`/api/fans/${fanId}/verify`)
      if (!res.ok) throw new Error('Failed to fetch tokens')
      return res.json()
    },
  })

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/fans/${fanId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiryDays: 30 }),
      })
      if (!res.ok) throw new Error('Failed to generate token')
      return res.json()
    },
    onSuccess: (data) => {
      setNewToken(data.token)
      queryClient.invalidateQueries({ queryKey: ['fan', fanId, 'tokens'] })
    },
  })

  const revokeMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await fetch(`/api/fans/${fanId}/verify?token=${encodeURIComponent(token)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to revoke token')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan', fanId, 'tokens'] })
    },
  })

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const tokens: VerificationToken[] = data?.tokens || []

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

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-gold" />
          <CardTitle>Fan Verification</CardTitle>
        </div>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          size="sm"
        >
          {generateMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Generate Token
        </Button>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-vault-muted mb-4">
          Verification tokens allow {fanName} to prove their fan status to third parties
          (ticketing, merch, exclusive content).
        </p>

        {/* New Token Display */}
        {newToken && (
          <div className="mb-6 p-4 bg-status-success/10 border border-status-success rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-status-success">
                New Token Generated
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewToken(null)}
                className="text-vault-muted hover:text-warm-white"
              >
                Dismiss
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-vault-darker rounded text-xs text-warm-white font-mono break-all">
                {newToken}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(newToken)}
              >
                {copiedToken === newToken ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-vault-muted mt-2">
              Copy this token now. It won't be shown again in full.
            </p>
          </div>
        )}

        {/* Token List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-vault-darker rounded-lg animate-pulse" />
            ))}
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8 text-vault-muted">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active verification tokens</p>
            <p className="text-sm mt-1">
              Generate a token to let this fan prove their status
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="bg-vault-darker rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          token.tier === 'SUPERFAN' && 'bg-gold/20 text-gold',
                          token.tier === 'DEDICATED' && 'bg-tier-dedicated/20 text-tier-dedicated',
                          token.tier === 'ENGAGED' && 'bg-tier-engaged/20 text-tier-engaged',
                          token.tier === 'CASUAL' && 'bg-tier-casual/20 text-tier-casual'
                        )}
                      >
                        {token.tier}
                      </span>
                      <span className="text-sm text-vault-muted">
                        Score: {token.stanScore}
                      </span>
                      <span className="text-sm text-vault-muted">
                        • {token.relationshipMonths} months
                      </span>
                    </div>
                    {token.issuedFor && (
                      <p className="text-xs text-vault-muted mt-1">
                        Issued for: {token.issuedFor}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeMutation.mutate(token.id)}
                    disabled={revokeMutation.isPending}
                    className="text-status-error hover:text-status-error hover:bg-status-error/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-xs text-vault-muted">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      Expires: {formatDate(token.expiresAt)}
                      {isExpiringSoon(token.expiresAt) && (
                        <span className="text-status-error ml-1">(soon)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>Used {token.usageCount} times</span>
                  </div>
                  {token.lastUsedAt && (
                    <span>Last: {formatDate(token.lastUsedAt)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verification Info */}
        <div className="mt-6 pt-4 border-t border-vault-gray">
          <h4 className="text-sm font-medium text-warm-white mb-2">
            How Verification Works
          </h4>
          <div className="text-xs text-vault-muted space-y-1">
            <p>1. Generate a token for this fan</p>
            <p>2. Share the token with the fan or third party</p>
            <p>3. Third parties verify at: <code className="text-gold">/api/verify</code></p>
            <p>4. Token confirms tier, score, and relationship duration</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
