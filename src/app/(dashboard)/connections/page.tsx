'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/layout'
import { ConnectionCard, PlatformGrid } from '@/components/connections'
import { EmailImportDropzone } from '@/components/import'
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '@/components/ui'

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
      const res = await fetch(`/api/platforms/${platform.toLowerCase()}/sync`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Sync failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['fans'] })
      setNotification({ type: 'success', message: 'Sync completed!' })
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
      const res = await fetch(`/api/platforms/${platform.toLowerCase()}/connect`, {
        method: 'DELETE',
      })
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
    setNotification({ type: 'success', message: 'Email subscribers imported!' })
  }

  return (
    <div>
      <PageHeader
        title="Connections"
        description="Manage your platform integrations"
      />

      {/* Notification */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            notification.type === 'success'
              ? 'bg-status-success/10 border border-status-success text-status-success'
              : 'bg-status-error/10 border border-status-error text-status-error'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Connected Platforms */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-warm-white mb-4">
          Connected Platforms
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : connections.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-vault-muted">
              No platforms connected yet. Connect a platform below to start
              discovering your fans.
            </p>
          </Card>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Platforms */}
        <Card>
          <CardHeader>
            <CardTitle>Add Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <PlatformGrid
              connectedPlatforms={connectedPlatforms}
              onConnect={(platform) => connectMutation.mutate(platform)}
              isConnecting={connectingPlatform}
            />
          </CardContent>
        </Card>

        {/* Email Import */}
        <EmailImportDropzone onImportComplete={handleEmailImportComplete} />
      </div>
    </div>
  )
}
