'use client'

import { useState } from 'react'
import type { CampaignAnalytics as CampaignAnalyticsType } from './campaign-constants'

interface CampaignAnalyticsProps {
  analytics: CampaignAnalyticsType | null
  onRefresh: () => void
  onLogCompletion: (proofUrl: string, proofNote: string) => Promise<string | null>
}

export function CampaignAnalytics({
  analytics,
  onRefresh,
  onLogCompletion,
}: CampaignAnalyticsProps) {
  const [proofUrl, setProofUrl] = useState('')
  const [proofNote, setProofNote] = useState('')
  const [logMessage, setLogMessage] = useState<string | null>(null)

  async function handleLog() {
    const msg = await onLogCompletion(proofUrl, proofNote)
    setLogMessage(msg)
    if (msg === 'CTA completion logged.') {
      setProofUrl('')
      setProofNote('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-caption text-gray-500">Action completion signals.</p>
        <button
          type="button"
          onClick={onRefresh}
          className="text-caption text-gray-600 hover:text-gray-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      {!analytics ? (
        <p className="text-caption text-gray-500">No data yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-caption text-gray-500">CTA Keys</p>
              {analytics.ctaByKey.length === 0 ? (
                <p className="text-caption text-gray-600">None logged.</p>
              ) : (
                analytics.ctaByKey.slice(0, 6).map((item) => (
                  <div
                    key={item.ctaKey}
                    className="flex items-center justify-between text-caption"
                  >
                    <span className="text-gray-300">{item.ctaKey}</span>
                    <span className="text-gray-500 tabular-nums">{item.count}</span>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-1">
              <p className="text-caption text-gray-500">Status</p>
              {analytics.completionByStatus.length === 0 ? (
                <p className="text-caption text-gray-600">None.</p>
              ) : (
                analytics.completionByStatus.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between text-caption"
                  >
                    <span className="text-gray-300">{item.status}</span>
                    <span className="text-gray-500 tabular-nums">{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-[#1a1a1a]">
            <input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="Proof URL"
              className="flex-1 bg-transparent border-b border-[#1a1a1a] text-caption text-white py-1.5 focus:outline-none focus:border-[#2a2a2a] placeholder:text-gray-700"
            />
            <input
              value={proofNote}
              onChange={(e) => setProofNote(e.target.value)}
              placeholder="Note"
              className="flex-1 bg-transparent border-b border-[#1a1a1a] text-caption text-white py-1.5 focus:outline-none focus:border-[#2a2a2a] placeholder:text-gray-700"
            />
            <button
              type="button"
              onClick={handleLog}
              className="text-caption text-gray-500 hover:text-white transition-colors whitespace-nowrap"
            >
              Log
            </button>
          </div>
          {logMessage && <p className="text-caption text-gray-500">{logMessage}</p>}
        </>
      )}
    </div>
  )
}
