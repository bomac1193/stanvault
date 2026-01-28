import { prisma } from '@/lib/prisma'
import { SpotifyClient, RecentlyPlayedItem, SpotifyArtist } from './client'
import { calculateStanScore } from '@/lib/scoring/stan-score'
import { Platform, FanTier, EventType } from '@prisma/client'

interface SyncResult {
  success: boolean
  fansCreated: number
  fansUpdated: number
  eventsCreated: number
  error?: string
}

interface FanData {
  spotifyUserId: string
  email?: string
  displayName: string
  avatarUrl?: string
  country?: string
  streams: number
  savedTracks: number
  playlistAdds: number
  follows: boolean
  firstPlayedAt: Date
  lastPlayedAt: Date
  topArtistRank?: number // If artist is in user's top artists
}

/**
 * Sync Spotify data for an artist
 * This syncs the artist's OWN Spotify to identify their artist ID
 */
export async function syncArtistSpotifyProfile(userId: string): Promise<{
  success: boolean
  artistId?: string
  artistName?: string
  error?: string
}> {
  try {
    const client = await SpotifyClient.forUser(userId)
    if (!client) {
      return { success: false, error: 'No valid Spotify connection' }
    }

    // Get the artist's profile
    const profile = await client.getMe()

    // Search for artist by their name to get artist ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { artistName: true },
    })

    if (user?.artistName) {
      const searchResult = await client.searchArtists(user.artistName, 5)
      const matchingArtist = searchResult.artists.items.find(
        a => a.name.toLowerCase() === user.artistName?.toLowerCase()
      )

      if (matchingArtist) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            spotifyArtistId: matchingArtist.id,
            spotifyArtistUri: `spotify:artist:${matchingArtist.id}`,
          },
        })

        return {
          success: true,
          artistId: matchingArtist.id,
          artistName: matchingArtist.name,
        }
      }
    }

    return {
      success: true,
      artistId: undefined,
      artistName: profile.display_name,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Process a fan's Spotify data and create/update their record
 * This is called when a FAN connects their Spotify to verify their fandom
 */
export async function processFanSpotifyData(
  artistUserId: string,
  fanSpotifyData: FanData
): Promise<{ fanId: string; isNew: boolean; tierChanged: boolean }> {
  // Look for existing fan by Spotify ID
  const existingLink = await prisma.fanPlatformLink.findFirst({
    where: {
      platformFanId: fanSpotifyData.spotifyUserId,
      fan: { userId: artistUserId },
    },
    include: { fan: true },
  })

  const oldTier = existingLink?.fan?.tier

  if (existingLink) {
    // Update existing fan
    const updatedFan = await updateExistingFan(existingLink.fan.id, fanSpotifyData)
    return {
      fanId: updatedFan.id,
      isNew: false,
      tierChanged: oldTier !== updatedFan.tier,
    }
  }

  // Check for existing fan by email
  if (fanSpotifyData.email) {
    const existingFanByEmail = await prisma.fan.findFirst({
      where: {
        userId: artistUserId,
        email: fanSpotifyData.email,
      },
    })

    if (existingFanByEmail) {
      // Add Spotify link to existing fan
      await addSpotifyLinkToFan(existingFanByEmail.id, fanSpotifyData)
      const updatedFan = await recalculateFanScore(existingFanByEmail.id)
      return {
        fanId: updatedFan.id,
        isNew: false,
        tierChanged: existingFanByEmail.tier !== updatedFan.tier,
      }
    }
  }

  // Create new fan
  const newFan = await createNewFan(artistUserId, fanSpotifyData)
  return {
    fanId: newFan.id,
    isNew: true,
    tierChanged: false,
  }
}

async function createNewFan(artistUserId: string, data: FanData) {
  // Calculate initial score
  const platformLinks = [
    {
      platform: Platform.SPOTIFY,
      streams: data.streams,
      playlistAdds: data.playlistAdds,
      saves: data.savedTracks,
      follows: data.follows,
    },
  ]

  const scoreResult = calculateStanScore({
    platformLinks,
    firstSeenAt: data.firstPlayedAt,
    lastActiveAt: data.lastPlayedAt,
  })

  const fan = await prisma.fan.create({
    data: {
      userId: artistUserId,
      displayName: data.displayName,
      email: data.email,
      avatarUrl: data.avatarUrl,
      country: data.country,
      stanScore: scoreResult.totalScore,
      tier: scoreResult.tier,
      platformScore: scoreResult.platformScore,
      engagementScore: scoreResult.engagementScore,
      longevityScore: scoreResult.longevityScore,
      recencyScore: scoreResult.recencyScore,
      firstSeenAt: data.firstPlayedAt,
      lastActiveAt: data.lastPlayedAt,
      platformLinks: {
        create: {
          platform: Platform.SPOTIFY,
          platformFanId: data.spotifyUserId,
          streams: data.streams,
          playlistAdds: data.playlistAdds,
          saves: data.savedTracks,
          follows: data.follows,
          firstSeenAt: data.firstPlayedAt,
          lastActiveAt: data.lastPlayedAt,
        },
      },
      events: {
        create: {
          eventType: EventType.FIRST_STREAM,
          platform: Platform.SPOTIFY,
          description: 'First discovered via Spotify',
          occurredAt: data.firstPlayedAt,
        },
      },
    },
  })

  // Add tier upgrade events if applicable
  if (scoreResult.tier === 'SUPERFAN') {
    await prisma.fanEvent.create({
      data: {
        fanId: fan.id,
        eventType: EventType.BECAME_SUPERFAN,
        platform: Platform.SPOTIFY,
        description: 'Became a superfan',
        occurredAt: new Date(),
      },
    })
  }

  return fan
}

async function updateExistingFan(fanId: string, data: FanData) {
  // Update the Spotify link
  await prisma.fanPlatformLink.update({
    where: {
      fanId_platform: {
        fanId,
        platform: Platform.SPOTIFY,
      },
    },
    data: {
      streams: data.streams,
      playlistAdds: data.playlistAdds,
      saves: data.savedTracks,
      follows: data.follows,
      lastActiveAt: data.lastPlayedAt,
    },
  })

  return recalculateFanScore(fanId)
}

async function addSpotifyLinkToFan(fanId: string, data: FanData) {
  await prisma.fanPlatformLink.create({
    data: {
      fanId,
      platform: Platform.SPOTIFY,
      platformFanId: data.spotifyUserId,
      streams: data.streams,
      playlistAdds: data.playlistAdds,
      saves: data.savedTracks,
      follows: data.follows,
      firstSeenAt: data.firstPlayedAt,
      lastActiveAt: data.lastPlayedAt,
    },
  })

  await prisma.fanEvent.create({
    data: {
      fanId,
      eventType: EventType.FIRST_STREAM,
      platform: Platform.SPOTIFY,
      description: 'Connected Spotify account',
      occurredAt: new Date(),
    },
  })
}

async function recalculateFanScore(fanId: string) {
  const fan = await prisma.fan.findUnique({
    where: { id: fanId },
    include: { platformLinks: true },
  })

  if (!fan) throw new Error('Fan not found')

  const oldTier = fan.tier

  const scoreResult = calculateStanScore({
    platformLinks: fan.platformLinks.map(link => ({
      platform: link.platform,
      streams: link.streams,
      playlistAdds: link.playlistAdds,
      saves: link.saves,
      follows: link.follows,
      likes: link.likes,
      comments: link.comments,
      shares: link.shares,
      subscribed: link.subscribed,
      videoViews: link.videoViews,
      watchTime: link.watchTime,
      emailOpens: link.emailOpens,
      emailClicks: link.emailClicks,
    })),
    firstSeenAt: fan.firstSeenAt,
    lastActiveAt: fan.lastActiveAt,
  })

  const updatedFan = await prisma.fan.update({
    where: { id: fanId },
    data: {
      stanScore: scoreResult.totalScore,
      tier: scoreResult.tier,
      platformScore: scoreResult.platformScore,
      engagementScore: scoreResult.engagementScore,
      longevityScore: scoreResult.longevityScore,
      recencyScore: scoreResult.recencyScore,
      lastActiveAt: new Date(),
    },
  })

  // Track tier changes
  if (oldTier !== scoreResult.tier) {
    const tierOrder: FanTier[] = ['CASUAL', 'ENGAGED', 'DEDICATED', 'SUPERFAN']
    const oldIndex = tierOrder.indexOf(oldTier)
    const newIndex = tierOrder.indexOf(scoreResult.tier)

    if (newIndex > oldIndex) {
      await prisma.fanEvent.create({
        data: {
          fanId,
          eventType: scoreResult.tier === 'SUPERFAN' ? EventType.BECAME_SUPERFAN : EventType.TIER_UPGRADE,
          description: `Upgraded from ${oldTier} to ${scoreResult.tier}`,
          occurredAt: new Date(),
        },
      })
    } else {
      await prisma.fanEvent.create({
        data: {
          fanId,
          eventType: EventType.TIER_DOWNGRADE,
          description: `Downgraded from ${oldTier} to ${scoreResult.tier}`,
          occurredAt: new Date(),
        },
      })
    }
  }

  return updatedFan
}

/**
 * Aggregate listening data for a fan based on an artist's tracks
 */
export async function aggregateFanListeningData(
  client: SpotifyClient,
  artistId: string
): Promise<{
  streams: number
  savedTracks: number
  playlistAdds: number
  follows: boolean
  firstPlayedAt: Date | null
  lastPlayedAt: Date | null
  tracks: Map<string, number> // trackId -> play count
}> {
  const result = {
    streams: 0,
    savedTracks: 0,
    playlistAdds: 0,
    follows: false,
    firstPlayedAt: null as Date | null,
    lastPlayedAt: null as Date | null,
    tracks: new Map<string, number>(),
  }

  // Check if following the artist
  try {
    const followStatus = await client.checkFollowingArtists([artistId])
    result.follows = followStatus[0] || false
  } catch {
    // Ignore errors checking follow status
  }

  // Get recently played and filter by artist
  try {
    for await (const item of client.getAllRecentlyPlayed(500)) {
      const isArtistTrack = item.track.artists.some(a => a.id === artistId)
      if (isArtistTrack) {
        result.streams++
        const playedAt = new Date(item.played_at)

        if (!result.firstPlayedAt || playedAt < result.firstPlayedAt) {
          result.firstPlayedAt = playedAt
        }
        if (!result.lastPlayedAt || playedAt > result.lastPlayedAt) {
          result.lastPlayedAt = playedAt
        }

        const count = result.tracks.get(item.track.id) || 0
        result.tracks.set(item.track.id, count + 1)
      }
    }
  } catch {
    // Ignore errors fetching recently played
  }

  // Get saved tracks by this artist
  try {
    for await (const item of client.getAllSavedTracks(500)) {
      const isArtistTrack = item.track.artists.some(a => a.id === artistId)
      if (isArtistTrack) {
        result.savedTracks++
        const addedAt = new Date(item.added_at)

        if (!result.firstPlayedAt || addedAt < result.firstPlayedAt) {
          result.firstPlayedAt = addedAt
        }
      }
    }
  } catch {
    // Ignore errors fetching saved tracks
  }

  // Check playlists for artist tracks
  try {
    const playlists = await client.getPlaylists(50)
    for (const playlist of playlists.items) {
      // Only check user's own playlists
      const me = await client.getMe()
      if (playlist.owner.id !== me.id) continue

      const tracks = await client.getPlaylistTracks(playlist.id, 100)
      for (const item of tracks.items) {
        if (item.track?.artists?.some(a => a.id === artistId)) {
          result.playlistAdds++
        }
      }
    }
  } catch {
    // Ignore errors checking playlists
  }

  return result
}

/**
 * Store listening events for analytics
 */
export async function storeListeningEvents(
  fanId: string,
  artistId: string,
  items: RecentlyPlayedItem[]
) {
  const events = items
    .filter(item => item.track.artists.some(a => a.id === artistId))
    .map(item => ({
      fanId,
      trackId: item.track.id,
      trackName: item.track.name,
      artistId: item.track.artists[0].id,
      artistName: item.track.artists[0].name,
      albumId: item.track.album.id,
      albumName: item.track.album.name,
      playedAt: new Date(item.played_at),
      durationMs: item.track.duration_ms,
      contextType: item.context?.type,
      contextUri: item.context?.uri,
    }))

  if (events.length > 0) {
    await prisma.listeningEvent.createMany({
      data: events,
      skipDuplicates: true,
    })
  }
}

/**
 * Full sync for an artist - updates all connected fans
 */
export async function syncAllFans(artistUserId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    fansCreated: 0,
    fansUpdated: 0,
    eventsCreated: 0,
  }

  try {
    // Get all fans with Spotify connections
    const fans = await prisma.fan.findMany({
      where: { userId: artistUserId },
      include: {
        platformLinks: {
          where: { platform: Platform.SPOTIFY },
        },
      },
    })

    // Recalculate scores for all fans
    for (const fan of fans) {
      await recalculateFanScore(fan.id)
      result.fansUpdated++
    }

    // Update last sync time
    await prisma.platformConnection.update({
      where: {
        userId_platform: {
          userId: artistUserId,
          platform: Platform.SPOTIFY,
        },
      },
      data: {
        lastSyncAt: new Date(),
        fanCount: fans.length,
      },
    })

    result.success = true
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error'

    // Record sync error
    await prisma.platformConnection.update({
      where: {
        userId_platform: {
          userId: artistUserId,
          platform: Platform.SPOTIFY,
        },
      },
      data: {
        syncError: result.error,
      },
    })
  }

  return result
}
