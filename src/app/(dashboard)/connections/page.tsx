'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/layout'
import { ConnectionCard, PlatformGrid } from '@/components/connections'
import { EmailImportDropzone } from '@/components/import'
import { Skeleton } from '@/components/ui'

interface PlatformConnection {
  id: string
  platform: string
  status: string
  fanCount: number
  lastSyncAt?: string
  syncError?: string
}

export default function ConnectionsPage() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'spotify_connected') {
      setNotification({ type: 'success', message: 'Spotify connected successfully!' })
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } else if (error) {
      setNotification({ type: 'error', message: `Connection failed: ${error}` })
    }

    // Clear notification after 5 seconds
    if (success || error) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, queryClient])

  const { data, isLoading } = useQuery({
    queryKey: ['platforms'],
    queryFn: async () => {
      const res = await fetch('/api/platforms')
      if (!res.ok) throw new Error('Failed to fetch platforms')
      return res.json()
    },
    staleTime: 10 * 60 * 1000,
  })

  const connectMutation = useMutation({
    mutationFn: async (platform: string) => {
      setConnectingPlatform(platform)

      // For Spotify, try real OAuth first
      if (platform === 'SPOTIFY') {
        try {
          const authRes = await fetch('/api/auth/spotify')
          const authData = await authRes.json()

          if (authData.authUrl) {
            // Redirect to Spotify OAuth
            window.location.href = authData.authUrl
            return { redirecting: true }
          }
        } catch {
          // Fall back to mock if Spotify not configured
        }
      }

      // Oryx: server-to-server pull (no OAuth redirect)
      if (platform === 'ORYX') {
        const res = await fetch('/api/platforms/oryx/connect', { method: 'POST' })
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Connection failed' }))
          throw new Error(data.error || 'Failed to connect Oryx')
        }
        return res.json()
      }

      // Default mock connection for other platforms
      const res = await fetch(`/api/platforms/${platform.toLowerCase()}/connect`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to connect platform')
      return res.json()
    },
    onSuccess: (data) => {
      if (!data?.redirecting) {
        queryClient.invalidateQueries({ queryKey: ['platforms'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        queryClient.invalidateQueries({ queryKey: ['fans'] })
      }
    },
    onSettled: (data) => {
      if (!data?.redirecting) {
        setConnectingPlatform(null)
      }
    },
  })

  const syncMutation = useMutation({
    mutationFn: async (platform: string) => {
      setSyncingPlatform(platform)
      // DASHAM (Oryx) has its own sync route
      const syncPath = platform === 'DASHAM'
        ? '/api/platforms/oryx/sync'
        : `/api/platforms/${platform.toLowerCase()}/sync`
      const res = await fetch(syncPath, { method: 'POST' })
      if (!res.ok) throw new Error('Sync failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['fans'] })
      setNotification({ type: 'success', message: 'Sync completed.' })
    },
    onError: (error) => {
      setNotification({ type: 'error', message: error instanceof Error ? error.message : 'Sync failed' })
    },
    onSettled: () => {
      setSyncingPlatform(null)
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: async (platform: string) => {
      const disconnectPath = platform === 'DASHAM'
        ? '/api/platforms/oryx/connect'
        : `/api/platforms/${platform.toLowerCase()}/connect`
      const res = await fetch(disconnectPath, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to disconnect platform')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['fans'] })
    },
  })

  const connections: PlatformConnection[] = data?.connections || []
  const connectedPlatforms = connections.map((c) => c.platform)

  const handleEmailImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['platforms'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['fans'] })
    setNotification({ type: 'success', message: 'Email subscribers imported.' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connections"
        description="Manage platform integrations."
      />

      {notification && (
        <div className={`p-3 text-caption ${
          notification.type === 'success'
            ? 'text-gray-300 border-l-2 border-l-gray-500 bg-[#0a0a0a]'
            : 'text-status-error border-l-2 border-l-status-error bg-[#0a0a0a]'
        }`}>
          {notification.message}
        </div>
      )}

      {(isLoading || connections.length > 0) && (
        <div>
          <p className="text-caption uppercase tracking-widest text-gray-500 mb-3">Connected</p>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-36" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  platform={connection.platform}
                  status={connection.status}
                  fanCount={connection.fanCount}
                  lastSyncAt={connection.lastSyncAt}
                  onSync={() => syncMutation.mutate(connection.platform)}
                  onDisconnect={() => disconnectMutation.mutate(connection.platform)}
                  isSyncing={syncingPlatform === connection.platform}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a]">
          <div className="px-5 py-4 border-b border-[#1a1a1a]">
            <h3 className="text-sm font-medium text-gray-400">Add Platform</h3>
          </div>
          <PlatformGrid
            connectedPlatforms={connectedPlatforms}
            onConnect={(platform) => connectMutation.mutate(platform)}
            isConnecting={connectingPlatform}
          />
        </div>

        <EmailImportDropzone onImportComplete={handleEmailImportComplete} />
      </div>
    </div>
  )
}
