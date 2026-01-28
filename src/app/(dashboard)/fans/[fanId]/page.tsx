'use client'

import { use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Button, Skeleton } from '@/components/ui'
import {
  FanProfileHeader,
  StanScoreBreakdown,
  PlatformLinksList,
  JourneyTimeline,
  FanNotes,
  VerificationSection,
} from '@/components/fans'
import { ArrowLeft } from 'lucide-react'

interface FanPageProps {
  params: Promise<{ fanId: string }>
}

export default function FanProfilePage({ params }: FanPageProps) {
  const { fanId } = use(params)
  const queryClient = useQueryClient()

  const { data: fan, isLoading: fanLoading } = useQuery({
    queryKey: ['fan', fanId],
    queryFn: async () => {
      const res = await fetch(`/api/fans/${fanId}`)
      if (!res.ok) throw new Error('Failed to fetch fan')
      return res.json()
    },
  })

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['fan', fanId, 'events'],
    queryFn: async () => {
      const res = await fetch(`/api/fans/${fanId}/events`)
      if (!res.ok) throw new Error('Failed to fetch events')
      return res.json()
    },
  })

  const saveNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const res = await fetch(`/api/fans/${fanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) throw new Error('Failed to save notes')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan', fanId] })
    },
  })

  if (fanLoading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-40 w-full mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (!fan) {
    return (
      <div className="text-center py-12">
        <p className="text-warm-white mb-4">Fan not found</p>
        <Link href="/fans">
          <Button variant="secondary">Back to Fans</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/fans"
        className="inline-flex items-center gap-2 text-vault-muted hover:text-warm-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Fans
      </Link>

      {/* Header */}
      <div className="mb-6">
        <FanProfileHeader fan={fan} />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Score breakdown */}
        <div>
          <StanScoreBreakdown
            platformScore={fan.platformScore}
            engagementScore={fan.engagementScore}
            longevityScore={fan.longevityScore}
            recencyScore={fan.recencyScore}
            totalScore={fan.stanScore}
          />
        </div>

        {/* Middle column - Platform links */}
        <div>
          <PlatformLinksList platformLinks={fan.platformLinks || []} />
        </div>

        {/* Right column - Journey and Notes */}
        <div className="space-y-6">
          {eventsLoading ? (
            <Skeleton className="h-60" />
          ) : (
            <JourneyTimeline events={eventsData?.events || []} />
          )}
          <FanNotes
            initialNotes={fan.notes}
            onSave={saveNotesMutation.mutateAsync}
          />
        </div>
      </div>

      {/* Verification Section - Full Width */}
      <div className="mt-6">
        <VerificationSection
          fanId={fanId}
          fanName={fan.displayName}
          tier={fan.tier}
        />
      </div>
    </div>
  )
}
