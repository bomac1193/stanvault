'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { ShieldCheck, ShieldX, FileText, Clock, Check, X } from 'lucide-react'

interface FanProof {
  id: string
  proofType: string
  proofUrl: string | null
  description: string | null
  verifiedByCreator: boolean
  rejectedByCreator: boolean
  convictionPoints: number
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
}

const PROOF_TYPE_LABELS: Record<string, string> = {
  CONCERT_TICKET: 'Concert Ticket',
  MERCH_RECEIPT: 'Merch Receipt',
  ALBUM_PURCHASE: 'Album Purchase',
  SCREENSHOT: 'Screenshot',
  OTHER: 'Other',
}

export function FanProofs({ fanId }: { fanId: string }) {
  const queryClient = useQueryClient()
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [points, setPoints] = useState(5)

  const { data, isLoading } = useQuery({
    queryKey: ['fan', fanId, 'proofs'],
    queryFn: async () => {
      const res = await fetch(`/api/fans/${fanId}/proof`)
      if (!res.ok) throw new Error('Failed to fetch proofs')
      return res.json()
    },
  })

  const reviewMutation = useMutation({
    mutationFn: async ({ proofId, action, convictionPoints }: { proofId: string; action: string; convictionPoints?: number }) => {
      const res = await fetch(`/api/fans/${fanId}/proof/${proofId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, convictionPoints }),
      })
      if (!res.ok) throw new Error('Failed to review proof')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan', fanId] })
      setReviewingId(null)
    },
  })

  const proofs: FanProof[] = data?.proofs || []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fan Proofs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-[#1a1a1a]" />
            <div className="h-16 bg-[#1a1a1a]" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-accent" />
          <CardTitle>Fan Proofs</CardTitle>
          {proofs.length > 0 && (
            <Badge variant="default">{proofs.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {proofs.length === 0 ? (
          <p className="text-sm text-gray-500">No proofs submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {proofs.map((proof) => (
              <div
                key={proof.id}
                className="p-3 border border-[#1a1a1a]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">
                        {PROOF_TYPE_LABELS[proof.proofType] || proof.proofType}
                      </span>
                      {proof.verifiedByCreator && (
                        <Badge variant="success">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Verified (+{proof.convictionPoints}pts)
                        </Badge>
                      )}
                      {proof.rejectedByCreator && (
                        <Badge variant="error">
                          <ShieldX className="w-3 h-3 mr-1" />
                          Rejected
                        </Badge>
                      )}
                      {!proof.verifiedByCreator && !proof.rejectedByCreator && (
                        <Badge variant="warning">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    {proof.description && (
                      <p className="text-xs text-gray-500 mb-1">{proof.description}</p>
                    )}
                    {proof.proofUrl && (
                      <a
                        href={proof.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline"
                      >
                        View proof
                      </a>
                    )}
                  </div>

                  {/* Review actions for pending proofs */}
                  {!proof.verifiedByCreator && !proof.rejectedByCreator && (
                    <div className="shrink-0">
                      {reviewingId === proof.id ? (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500">
                            Points:
                            <input
                              type="number"
                              min={1}
                              max={15}
                              value={points}
                              onChange={(e) => setPoints(Number(e.target.value))}
                              className="w-12 ml-1 bg-[#1a1a1a] border border-[#333] px-1 py-0.5 text-xs text-white"
                            />
                          </label>
                          <button
                            onClick={() => reviewMutation.mutate({ proofId: proof.id, action: 'verify', convictionPoints: points })}
                            disabled={reviewMutation.isPending}
                            className="p-1.5 bg-status-success/20 text-status-success hover:bg-status-success/30"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => reviewMutation.mutate({ proofId: proof.id, action: 'reject' })}
                            disabled={reviewMutation.isPending}
                            className="p-1.5 bg-status-error/20 text-status-error hover:bg-status-error/30"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewingId(proof.id)}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
