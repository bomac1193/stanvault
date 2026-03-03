'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Check, Link2, Users, Gift, Send, X } from 'lucide-react'

interface ChecklistState {
  platformConnected: boolean
  hasFans: boolean
  hasDrops: boolean
  hasCampaigns: boolean
}

const DISMISSED_KEY = 'imprint-getting-started-dismissed'

export function GettingStarted() {
  const [state, setState] = useState<ChecklistState | null>(null)
  const [dismissed, setDismissed] = useState(true) // default hidden until loaded

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true')
  }, [])

  useEffect(() => {
    if (dismissed) return
    fetch('/api/dashboard/checklist')
      .then((r) => r.json())
      .then(setState)
      .catch(() => {})
  }, [dismissed])

  if (dismissed || !state) return null

  const steps = [
    {
      key: 'platform',
      label: 'Connect a platform',
      description: 'Import fans from Spotify, email, or another source',
      done: state.platformConnected,
      href: '/connections',
      icon: Link2,
    },
    {
      key: 'fans',
      label: 'See your fans',
      description: 'View your fan table and Pulse scores',
      done: state.hasFans,
      href: '/fans',
      icon: Users,
    },
    {
      key: 'drop',
      label: 'Create a drop',
      description: 'Gate exclusive content by fan tier',
      done: state.hasDrops,
      href: '/drops',
      icon: Gift,
    },
    {
      key: 'campaign',
      label: 'Send a campaign',
      description: 'Reach your fans with targeted messaging',
      done: state.hasCampaigns,
      href: '/campaigns',
      icon: Send,
    },
  ]

  const completedCount = steps.filter((s) => s.done).length
  const allDone = completedCount === steps.length
  const progress = Math.round((completedCount / steps.length) * 100)

  if (allDone) return null

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
  }

  return (
    <Card className="mb-8 border-accent/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Getting Started</CardTitle>
            <span className="text-caption text-gray-500">
              {completedCount}/{steps.length}
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-600 hover:text-gray-400 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-[#1a1a1a] overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <Link
                key={step.key}
                href={step.href}
                className={`flex items-center gap-3 p-3 border transition-colors ${
                  step.done
                    ? 'border-[#1a1a1a] opacity-60'
                    : 'border-[#1a1a1a] hover:border-accent/40 hover:bg-accent/5'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    step.done
                      ? 'bg-status-success/20'
                      : 'bg-[#1a1a1a]'
                  }`}
                >
                  {step.done ? (
                    <Check className="w-4 h-4 text-status-success" />
                  ) : (
                    <Icon className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${step.done ? 'text-gray-500 line-through' : 'text-white'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{step.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
