'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Music,
  Star,
  Shield,
  Download,
  LogOut,
  Loader2,
  ExternalLink,
  CheckCircle,
  Users,
  TrendingUp,
} from 'lucide-react'

interface ArtistRelationship {
  id: string
  artist: {
    id: string
    name: string
    image?: string
    genre?: string
  }
  tier: string
  stanScore: number
  totalStreams: number
  savedTracks: number
  isFollowing: boolean
  verified: boolean
  verifiedAt?: string
  firstSeenAt: string
  lastActiveAt: string
}

interface DashboardData {
  user: {
    id: string
    displayName: string
    avatarUrl?: string
    spotifyConnected: boolean
    memberSince: string
  }
  stats: {
    totalArtists: number
    totalScore: number
    superfanCount: number
    verifiedCount: number
    avgScore: number
  }
  relationships: ArtistRelationship[]
}

export default function FanDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/fan/dashboard')
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/fan/login')
            return
          }
          throw new Error('Failed to load dashboard')
        }
        const dashboardData = await res.json()
        setData(dashboardData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboard()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/fan/auth/logout', { method: 'POST' })
    router.push('/fan/login')
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'SUPERFAN':
        return 'text-gold bg-gold/20 border-gold'
      case 'DEDICATED':
        return 'text-purple-400 bg-purple-400/20 border-purple-400'
      case 'ENGAGED':
        return 'text-blue-400 bg-blue-400/20 border-blue-400'
      default:
        return 'text-vault-muted bg-vault-muted/20 border-vault-muted'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-vault-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-vault-black flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-status-error mb-4">{error || 'Failed to load'}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-gold hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-vault-black">
      {/* Header */}
      <header className="border-b border-vault-gray">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold/10 rounded-lg">
              <Music className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-warm-white">Fan Portal</h1>
              <p className="text-sm text-vault-muted">Your fan identity</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/fan/export"
              className="flex items-center gap-2 text-sm text-vault-muted hover:text-warm-white transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-vault-muted hover:text-warm-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* User Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-warm-white mb-1">
            Welcome, {data.user.displayName}
          </h2>
          <p className="text-vault-muted">
            {data.user.spotifyConnected ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-status-success" />
                Spotify connected
              </span>
            ) : (
              <Link href="/fan/onboarding" className="text-gold hover:underline">
                Connect Spotify to verify your fandom
              </Link>
            )}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-vault-dark border border-vault-gray rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-vault-muted" />
              <span className="text-sm text-vault-muted">Artists</span>
            </div>
            <p className="text-2xl font-mono font-bold text-warm-white">
              {data.stats.totalArtists}
            </p>
          </div>

          <div className="bg-vault-dark border border-vault-gray rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-gold" />
              <span className="text-sm text-vault-muted">Superfan Status</span>
            </div>
            <p className="text-2xl font-mono font-bold text-gold">
              {data.stats.superfanCount}
            </p>
          </div>

          <div className="bg-vault-dark border border-vault-gray rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-vault-muted" />
              <span className="text-sm text-vault-muted">Avg Score</span>
            </div>
            <p className="text-2xl font-mono font-bold text-warm-white">
              {data.stats.avgScore}
            </p>
          </div>

          <div className="bg-vault-dark border border-vault-gray rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-vault-muted" />
              <span className="text-sm text-vault-muted">Verified</span>
            </div>
            <p className="text-2xl font-mono font-bold text-warm-white">
              {data.stats.verifiedCount}
            </p>
          </div>
        </div>

        {/* Artist Relationships */}
        <div className="bg-vault-dark border border-vault-gray rounded-lg">
          <div className="px-6 py-4 border-b border-vault-gray">
            <h3 className="text-lg font-semibold text-warm-white">
              Your Artist Relationships
            </h3>
            <p className="text-sm text-vault-muted">
              Artists on Stanvault that you're a fan of
            </p>
          </div>

          {data.relationships.length === 0 ? (
            <div className="p-12 text-center">
              <Music className="w-12 h-12 text-vault-muted mx-auto mb-4" />
              <p className="text-warm-white mb-2">No artist relationships yet</p>
              <p className="text-sm text-vault-muted mb-4">
                {data.user.spotifyConnected
                  ? "Artists you listen to will appear here when they join Stanvault"
                  : "Connect Spotify to automatically discover your artists"}
              </p>
              {!data.user.spotifyConnected && (
                <Link
                  href="/fan/onboarding"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-vault-black font-medium rounded-lg hover:bg-gold/90"
                >
                  Connect Spotify
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-vault-gray">
              {data.relationships.map((rel) => (
                <div key={rel.id} className="p-4 hover:bg-vault-darker/50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Artist Avatar */}
                    <div className="w-12 h-12 bg-vault-darker rounded-lg flex items-center justify-center overflow-hidden">
                      {rel.artist.image ? (
                        <img
                          src={rel.artist.image}
                          alt={rel.artist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-6 h-6 text-vault-muted" />
                      )}
                    </div>

                    {/* Artist Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-warm-white truncate">
                          {rel.artist.name}
                        </h4>
                        {rel.verified && (
                          <CheckCircle className="w-4 h-4 text-status-success flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-vault-muted">{rel.artist.genre || 'Artist'}</p>
                    </div>

                    {/* Score */}
                    <div className="text-right mr-4">
                      <p className="text-lg font-mono font-bold text-warm-white">
                        {rel.stanScore}
                      </p>
                      <p className="text-xs text-vault-muted">score</p>
                    </div>

                    {/* Tier Badge */}
                    <span
                      className={`px-3 py-1 rounded-full border text-sm font-medium ${getTierColor(
                        rel.tier
                      )}`}
                    >
                      {rel.tier}
                    </span>

                    {/* Generate Token Link */}
                    <Link
                      href={`/fan/tokens?artist=${rel.artist.id}`}
                      className="p-2 text-vault-muted hover:text-gold transition-colors"
                      title="Generate verification token"
                    >
                      <Shield className="w-5 h-5" />
                    </Link>
                  </div>

                  {/* Stats Row */}
                  <div className="mt-3 flex items-center gap-6 text-xs text-vault-muted">
                    <span>{rel.totalStreams.toLocaleString()} streams</span>
                    <span>{rel.savedTracks} saved</span>
                    {rel.isFollowing && <span>Following</span>}
                    <span>
                      Fan since{' '}
                      {new Date(rel.firstSeenAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-vault-gray mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-vault-muted">
          <p>Stanvault Fan Portal • Own Your Fan Identity</p>
        </div>
      </footer>
    </div>
  )
}
