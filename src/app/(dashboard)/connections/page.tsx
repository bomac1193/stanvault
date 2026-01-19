'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout'
import { ConnectionCard, PlatformGrid } from '@/components/connections'
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '@/components/ui'

interface PlatformConnection {
  id: string
  platform: string
  status: string
  fanCount: number
  lastSyncAt?: string
}

export default function ConnectionsPage() {
  const queryClient = useQueryClient()
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null)

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
      const res = await fetch(`/api/platforms/${platform.toLowerCase()}/connect`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to connect platform')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['fans'] })
    },
    onSettled: () => {
      setConnectingPlatform(null)
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

  return (
    <div>
      <PageHeader
        title="Connections"
        description="Manage your platform integrations"
      />

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
                onSync={() => {
                  // For MVP, sync just reconnects
                  setSyncingPlatform(connection.platform)
                  setTimeout(() => setSyncingPlatform(null), 2000)
                }}
                onDisconnect={() => disconnectMutation.mutate(connection.platform)}
                isSyncing={syncingPlatform === connection.platform}
              />
            ))}
          </div>
        )}
      </div>

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
    </div>
  )
}
