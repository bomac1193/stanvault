'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

type PreviewMode = 'real' | 'demo'

export function AdminPreviewBar() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [mode, setMode] = useState<PreviewMode>('real')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/admin/preview-mode', { cache: 'no-store' })
        if (!response.ok) {
          return
        }

        const data = (await response.json()) as { isAdmin: boolean; mode: PreviewMode }
        setIsAdmin(data.isAdmin)
        setMode(data.mode)
      } catch (error) {
        console.error('Failed to load admin preview mode:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  const updateMode = async (nextMode: PreviewMode) => {
    if (nextMode === mode || isSaving) {
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/preview-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: nextMode }),
      })

      if (!response.ok) {
        throw new Error('Failed to update preview mode')
      }

      setMode(nextMode)
      await queryClient.invalidateQueries()
      router.refresh()
    } catch (error) {
      console.error('Failed to update preview mode:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !isAdmin) {
    return null
  }

  return (
    <div className="mb-6 border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Admin Preview</p>
        <p className="text-sm text-gray-300">
          Switch between your real audience data and an in-memory beta stress test. In simulation mode, tier bands represent market-fit strength and never write to the database.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => updateMode('real')}
          disabled={isSaving}
          className={`px-3 py-2 text-sm border transition-colors ${
            mode === 'real'
              ? 'border-white text-white bg-white/5'
              : 'border-[#1a1a1a] text-gray-400 hover:text-white hover:border-[#333]'
          }`}
        >
          Real Data
        </button>
        <button
          type="button"
          onClick={() => updateMode('demo')}
          disabled={isSaving}
          className={`px-3 py-2 text-sm border transition-colors ${
            mode === 'demo'
              ? 'border-accent text-accent bg-accent/10'
              : 'border-[#1a1a1a] text-gray-400 hover:text-white hover:border-[#333]'
          }`}
        >
          Beta Simulation
        </button>
      </div>
    </div>
  )
}
