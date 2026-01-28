'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Shield,
  Download,
  LogOut,
  Loader2,
  ExternalLink,
  CheckCircle,
  Music,
} from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'

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

  const getTierStyle = (tier: string) => {
    switch (tier) {
      case 'SUPERFAN':
        return 'bg-white text-black'
      case 'DEDICATED':
        return 'bg-gray-300 text-black'
      case 'ENGAGED':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-gray-700 text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-status-error text-body-sm mb-4">{error || 'Failed to load'}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-white hover:text-accent transition-colors text-body-sm"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LogoMark size="md" />
            <div>
              <p className="text-caption text-gray-600 uppercase tracking-widest">Fan Portal</p>
            </div>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              href="/fan/export"
              className="text-caption uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-2"
            >
              <Download className="w-3 h-3" />
              Export
            </Link>
            <button
              onClick={handleLogout}
              className="text-caption uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-2"
            >
              <LogOut className="w-3 h-3" />
              Exit
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-12">
          <p className="text-caption text-gray-600 uppercase tracking-widest mb-2">Welcome back</p>
          <h1 className="text-display-md font-bold text-white">{data.user.displayName}</h1>
          {!data.user.spotifyConnected && (
            <Link href="/fan/onboarding" className="text-accent hover:underline text-body-sm mt-2 inline-block">
              Connect Spotify to verify fandom →
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-px bg-gray-800 mb-12">
          <div className="bg-black p-6">
            <p className="text-display-sm font-bold text-white">{data.stats.totalArtists}</p>
            <p className="text-caption text-gray-500 uppercase tracking-widest mt-1">Artists</p>
          </div>
          <div className="bg-black p-6">
            <p className="text-display-sm font-bold text-accent">{data.stats.superfanCount}</p>
            <p className="text-caption text-gray-500 uppercase tracking-widest mt-1">Superfan</p>
          </div>
          <div className="bg-black p-6">
            <p className="text-display-sm font-bold text-white">{data.stats.avgScore}</p>
            <p className="text-caption text-gray-500 uppercase tracking-widest mt-1">Avg Score</p>
          </div>
          <div className="bg-black p-6">
            <p className="text-display-sm font-bold text-white">{data.stats.verifiedCount}</p>
            <p className="text-caption text-gray-500 uppercase tracking-widest mt-1">Verified</p>
          </div>
        </div>

        {/* Artist Relationships */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-body-lg font-medium text-white">Your <span className="text-accent">"Artists"</span></h2>
              <p className="text-body-sm text-gray-500 font-light">Artists on Stanvault that you support</p>
            </div>
          </div>

          {data.relationships.length === 0 ? (
            <div className="border border-gray-800 p-12 text-center">
              <Music className="w-8 h-8 text-gray-700 mx-auto mb-4" />
              <p className="text-white mb-2">No artist relationships yet</p>
              <p className="text-body-sm text-gray-500 font-light mb-4">
                {data.user.spotifyConnected
                  ? "Artists you listen to will appear when they join"
                  : "Connect Spotify to discover your artists"}
              </p>
              {!data.user.spotifyConnected && (
                <Link
                  href="/fan/onboarding"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-body-sm hover:bg-gray-200 transition-colors"
                >
                  Connect Spotify
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          ) : (
            <div className="border border-gray-800 divide-y divide-gray-800">
              {data.relationships.map((rel) => (
                <div key={rel.id} className="p-4 hover:bg-gray-900/50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gray-900 flex items-center justify-center overflow-hidden">
                      {rel.artist.image ? (
                        <img
                          src={rel.artist.image}
                          alt={rel.artist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-5 h-5 text-gray-700" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white truncate">{rel.artist.name}</h4>
                        {rel.verified && (
                          <CheckCircle className="w-3 h-3 text-status-success flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-caption text-gray-500">{rel.artist.genre || 'Artist'}</p>
                    </div>

                    {/* Score */}
                    <div className="text-right px-4">
                      <p className="text-body-lg font-bold font-mono text-white">{rel.stanScore}</p>
                      <p className="text-caption text-gray-600 uppercase tracking-wider">Score</p>
                    </div>

                    {/* Tier */}
                    <span className={`px-3 py-1 text-caption font-medium uppercase tracking-wider ${getTierStyle(rel.tier)}`}>
                      {rel.tier}
                    </span>

                    {/* Token */}
                    <Link
                      href={`/fan/tokens?artist=${rel.artist.id}`}
                      className="p-2 text-gray-600 hover:text-accent transition-colors"
                      title="Generate token"
                    >
                      <Shield className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Stats */}
                  <div className="mt-3 flex items-center gap-6 text-caption text-gray-600">
                    <span>{rel.totalStreams.toLocaleString()} streams</span>
                    <span>{rel.savedTracks} saved</span>
                    {rel.isFollowing && <span>Following</span>}
                    <span>Since {new Date(rel.firstSeenAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <p className="text-caption text-gray-700 uppercase tracking-widest">
            <span className="text-accent">[</span>SV<span className="text-accent">]</span> — Own your "fans"
          </p>
        </div>
      </footer>
    </div>
  )
}
