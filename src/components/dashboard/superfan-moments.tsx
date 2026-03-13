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
  disableLinks?: boolean
}

const eventDotColor: Record<string, string> = {
  BECAME_SUPERFAN: '#FFFFFF',
  TIER_UPGRADE: '#A3A3A3',
  MILESTONE_STREAMS: '#737373',
  MILESTONE_ENGAGEMENT: '#737373',
}

export function SuperfanMoments({ moments, disableLinks = false }: SuperfanMomentsProps) {
  if (moments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Moments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No recent fan moments yet. Connect a platform or import fans to populate this feed.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Moments</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full">
          <tbody className="divide-y divide-[#1a1a1a]">
            {moments.map((moment) => {
              const dotColor = eventDotColor[moment.type] || '#525252'

              return (
                <tr key={moment.id} className="group">
                  <td className="w-[52px] py-3 pl-6 pr-2">
                    {disableLinks ? (
                      <div className="block relative">
                        <Avatar
                          src={moment.fan.avatar}
                          name={moment.fan.name}
                          size="md"
                        />
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0a]"
                          style={{ backgroundColor: dotColor }}
                        />
                      </div>
                    ) : (
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
                    )}
                  </td>
                  <td className="py-3 pr-3 max-w-[140px]">
                    {disableLinks ? (
                      <span className="font-medium text-white truncate block">
                        {moment.fan.name}
                      </span>
                    ) : (
                      <Link href={`/fans/${moment.fan.id}`} className="block">
                        <span className="font-medium text-white truncate block group-hover:text-gray-300 transition-colors">
                          {moment.fan.name}
                        </span>
                      </Link>
                    )}
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
