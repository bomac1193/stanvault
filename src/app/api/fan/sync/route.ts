import { NextResponse } from 'next/server'
import { getFanUser } from '@/lib/fan-auth/service'
import { prisma } from '@/lib/prisma'
import { FanTier } from '@prisma/client'

// Tier thresholds
const TIER_THRESHOLDS = {
  SUPERFAN: { streams: 100, saves: 10 },
  DEDICATED: { streams: 50, saves: 5 },
  ENGAGED: { streams: 20, saves: 2 },
  CASUAL: { streams: 1, saves: 0 },
}

function calculateTier(streams: number, saves: number): FanTier {
  if (streams >= TIER_THRESHOLDS.SUPERFAN.streams || saves >= TIER_THRESHOLDS.SUPERFAN.saves) {
    return 'SUPERFAN'
  }
  if (streams >= TIER_THRESHOLDS.DEDICATED.streams || saves >= TIER_THRESHOLDS.DEDICATED.saves) {
    return 'DEDICATED'
  }
  if (streams >= TIER_THRESHOLDS.ENGAGED.streams || saves >= TIER_THRESHOLDS.ENGAGED.saves) {
    return 'ENGAGED'
  }
  return 'CASUAL'
}

function calculateStanScore(streams: number, saves: number, following: boolean): number {
  // Base score from streams (max 50 points)
  const streamScore = Math.min(streams * 0.5, 50)
  // Saves worth more (max 30 points)
  const saveScore = Math.min(saves * 3, 30)
  // Following bonus (20 points)
  const followScore = following ? 20 : 0

  return Math.round(streamScore + saveScore + followScore)
}

// POST /api/fan/sync - Sync fan's Spotify data and create artist relationships
export async function POST() {
  const fanUser = await getFanUser()
  if (!fanUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get full fan user with Spotify tokens
  const fullUser = await prisma.fanUser.findUnique({
    where: { id: fanUser.id },
  })

  if (!fullUser?.spotifyAccessToken) {
    return NextResponse.json({ error: 'Spotify not connected' }, { status: 400 })
  }

  // Check if token needs refresh
  let accessToken = fullUser.spotifyAccessToken
  if (fullUser.spotifyTokenExpiresAt && fullUser.spotifyTokenExpiresAt < new Date()) {
    // Refresh token
    const refreshed = await refreshSpotifyToken(fullUser.spotifyRefreshToken!)
    if (refreshed) {
      accessToken = refreshed.accessToken
      await prisma.fanUser.update({
        where: { id: fanUser.id },
        data: {
          spotifyAccessToken: refreshed.accessToken,
          spotifyTokenExpiresAt: refreshed.expiresAt,
        },
      })
    } else {
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
    }
  }

  // Get all artists registered on Stanvault (with Spotify IDs)
  const artists = await prisma.user.findMany({
    where: { spotifyArtistId: { not: null } },
    select: { id: true, spotifyArtistId: true, artistName: true, name: true },
  })

  const artistSpotifyIds = artists.filter((a) => a.spotifyArtistId).map((a) => a.spotifyArtistId!)

  if (artistSpotifyIds.length === 0) {
    return NextResponse.json({ synced: 0, relationships: [] })
  }

  // Fetch fan's recently played tracks
  const recentTracks = await fetchRecentlyPlayed(accessToken)

  // Fetch fan's saved tracks
  const savedTracks = await fetchSavedTracks(accessToken)

  // Fetch fan's followed artists
  const followedArtists = await fetchFollowedArtists(accessToken)

  // Aggregate by artist
  const artistStats: Record<
    string,
    { streams: number; saves: number; following: boolean; playlistAdds: number }
  > = {}

  // Count streams from recently played
  for (const track of recentTracks) {
    for (const artist of track.artists) {
      if (artistSpotifyIds.includes(artist.id)) {
        if (!artistStats[artist.id]) {
          artistStats[artist.id] = { streams: 0, saves: 0, following: false, playlistAdds: 0 }
        }
        artistStats[artist.id].streams++
      }
    }
  }

  // Count saves
  for (const track of savedTracks) {
    for (const artist of track.artists) {
      if (artistSpotifyIds.includes(artist.id)) {
        if (!artistStats[artist.id]) {
          artistStats[artist.id] = { streams: 0, saves: 0, following: false, playlistAdds: 0 }
        }
        artistStats[artist.id].saves++
      }
    }
  }

  // Mark followed artists
  for (const artistId of followedArtists) {
    if (artistSpotifyIds.includes(artistId)) {
      if (!artistStats[artistId]) {
        artistStats[artistId] = { streams: 0, saves: 0, following: true, playlistAdds: 0 }
      } else {
        artistStats[artistId].following = true
      }
    }
  }

  // Create/update relationships
  const relationships = []

  for (const [spotifyArtistId, stats] of Object.entries(artistStats)) {
    const artist = artists.find((a) => a.spotifyArtistId === spotifyArtistId)
    if (!artist) continue

    const tier = calculateTier(stats.streams, stats.saves)
    const stanScore = calculateStanScore(stats.streams, stats.saves, stats.following)

    const relationship = await prisma.fanUserArtistLink.upsert({
      where: {
        fanUserId_artistId: {
          fanUserId: fanUser.id,
          artistId: artist.id,
        },
      },
      create: {
        fanUserId: fanUser.id,
        artistId: artist.id,
        tier,
        stanScore,
        totalStreams: stats.streams,
        savedTracks: stats.saves,
        playlistAdds: stats.playlistAdds,
        isFollowing: stats.following,
        verified: true,
        verifiedAt: new Date(),
        verifiedVia: 'spotify',
      },
      update: {
        tier,
        stanScore,
        totalStreams: stats.streams,
        savedTracks: stats.saves,
        playlistAdds: stats.playlistAdds,
        isFollowing: stats.following,
        verified: true,
        verifiedAt: new Date(),
        verifiedVia: 'spotify',
        lastActiveAt: new Date(),
      },
    })

    relationships.push({
      artistId: artist.id,
      artistName: artist.artistName || artist.name,
      tier,
      stanScore,
      streams: stats.streams,
      saves: stats.saves,
      following: stats.following,
    })
  }

  return NextResponse.json({
    synced: relationships.length,
    relationships,
  })
}

// Helper: Refresh Spotify token
async function refreshSpotifyToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date } | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) return null

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    }
  } catch {
    return null
  }
}

// Helper: Fetch recently played tracks
async function fetchRecentlyPlayed(
  accessToken: string
): Promise<{ artists: { id: string }[] }[]> {
  try {
    const response = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=50',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!response.ok) return []

    const data = await response.json()
    return data.items?.map((item: { track: { artists: { id: string }[] } }) => ({
      artists: item.track.artists,
    })) || []
  } catch {
    return []
  }
}

// Helper: Fetch saved tracks
async function fetchSavedTracks(accessToken: string): Promise<{ artists: { id: string }[] }[]> {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) return []

    const data = await response.json()
    return data.items?.map((item: { track: { artists: { id: string }[] } }) => ({
      artists: item.track.artists,
    })) || []
  } catch {
    return []
  }
}

// Helper: Fetch followed artists
async function fetchFollowedArtists(accessToken: string): Promise<string[]> {
  try {
    const response = await fetch(
      'https://api.spotify.com/v1/me/following?type=artist&limit=50',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!response.ok) return []

    const data = await response.json()
    return data.artists?.items?.map((artist: { id: string }) => artist.id) || []
  } catch {
    return []
  }
}
