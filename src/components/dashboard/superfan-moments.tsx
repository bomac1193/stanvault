'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, Avatar, TierBadge } from '@/components/ui'
import { formatRelativeTime } from '@/lib/utils'
import { Check, AlertCircle } from 'lucide-react'

interface Moment {
  id: string
  type: string
  description: string
  reason?: string
  platform?: string
  occurredAt: string
  ackStatus?: 'SENT' | 'PENDING' | 'FAILED' | 'SKIPPED' | null
  ackSentAt?: string | null
  fan: {
    id: string
    name: string
    avatar?: string
    tier: string
    score: number
  }
}

interface SuperfanMomentsProps {
  moments: Moment[]
}

const eventDotColor: Record<string, string> = {
  BECAME_SUPERFAN: '#FFFFFF',
  TIER_UPGRADE: '#A3A3A3',
  MILESTONE_STREAMS: '#737373',
  MILESTONE_ENGAGEMENT: '#737373',
}

const SAMPLE_MOMENTS: Moment[] = [
  {
    id: 'sample-1',
    type: 'BECAME_SUPERFAN',
    description: '',
    reason: '3,400 spotify streams, 89 saves',
    occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    fan: { id: 'sample', name: 'Amara Osei', tier: 'SUPERFAN', score: 94 },
  },
  {
    id: 'sample-2',
    type: 'TIER_UPGRADE',
    description: '',
    reason: 'Shared 3 drops, tipped twice ($18)',
    occurredAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    fan: { id: 'sample', name: 'Kofi Mensah', tier: 'DEDICATED', score: 71 },
  },
  {
    id: 'sample-3',
    type: 'TIER_UPGRADE',
    description: '',
    reason: '12 shares, active across 3 platforms',
    occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    fan: { id: 'sample', name: 'Priya Sharma', tier: 'DEDICATED', score: 66 },
  },
  {
    id: 'sample-4',
    type: 'MILESTONE_STREAMS',
    description: '',
    reason: '1,200 spotify streams this month',
    occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    fan: { id: 'sample', name: 'Ezra Williams', tier: 'ENGAGED', score: 52 },
  },
  {
    id: 'sample-5',
    type: 'TIER_UPGRADE',
    description: '',
    reason: 'Opened every campaign email, 340 streams',
    occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    fan: { id: 'sample', name: 'Lena Dubois', tier: 'ENGAGED', score: 48 },
  },
]

export function SuperfanMoments({ moments }: SuperfanMomentsProps) {
  // Show sample data when no real moments exist so the layout is always visible
  const useSample = moments.length < 3
  const displayMoments = useSample ? SAMPLE_MOMENTS : moments

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Moments</CardTitle>
          {useSample && (
            <span className="text-[11px] text-gray-600 uppercase tracking-wider">Sample data</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full">
          <tbody className="divide-y divide-[#1a1a1a]">
            {displayMoments.map((moment) => {
              const dotColor = eventDotColor[moment.type] || '#525252'

              return (
                <tr key={moment.id} className="group">
                  <td className="w-[52px] py-3 pl-6 pr-2">
                    <Link href={`/fans/${moment.fan.id}`} className="block relative">
                      <Avatar
                        src={moment.fan.avatar}
                        name={moment.fan.name}
                        size="md"
                      />
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0a]"
                        style={{ backgroundColor: dotColor }}
                      />
                    </Link>
                  </td>
                  <td className="py-3 pr-3 max-w-[140px]">
                    <Link href={`/fans/${moment.fan.id}`} className="block">
                      <span className="font-medium text-white truncate block group-hover:text-gray-300 transition-colors">
                        {moment.fan.name}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 px-3 w-[80px]">
                    <TierBadge tier={moment.fan.tier} />
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-sm text-gray-400 truncate max-w-[280px]">
                      {moment.reason || moment.description}
                    </p>
                  </td>
                  <td className="py-3 pr-6 pl-3 text-right whitespace-nowrap">
                    <span className="text-xs text-gray-500 tabular-nums">
                      {formatRelativeTime(moment.occurredAt)}
                    </span>
                    {moment.ackStatus === 'SENT' && (
                      <Check className="inline-block w-3 h-3 ml-1.5 text-green-500" title="Acknowledged" />
                    )}
                    {moment.ackStatus === 'FAILED' && (
                      <AlertCircle className="inline-block w-3 h-3 ml-1.5 text-red-500" title="Acknowledgment failed" />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
