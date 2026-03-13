import { prisma } from '@/lib/prisma'
import { ConnectionStatus, Platform } from '@prisma/client'
import { YOUTUBE_CONFIG, getYouTubeCredentials } from './config'
import type { YouTubeOAuthFlow } from './config'

interface YouTubeTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope?: string
  token_type: string
}

interface YouTubeChannelResponse {
  items?: Array<{
    id: string
    snippet?: {
      title?: string
    }
    statistics?: {
      subscriberCount?: string
      viewCount?: string
      videoCount?: string
    }
  }>
}

export interface YouTubeChannelProfile {
  id: string
  title: string | null
  subscriberCount: number
  viewCount: number
  videoCount: number
}

function parseCount(value?: string): number {
  const parsed = Number.parseInt(value || '0', 10)
  return Number.isFinite(parsed) ? parsed : 0
}

export function getYouTubeAuthUrl(state: string, flow: YouTubeOAuthFlow = 'artist'): string {
  const { clientId, redirectUri } = getYouTubeCredentials(flow)

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    scope: YOUTUBE_CONFIG.scopes.join(' '),
    state,
  })

  return `${YOUTUBE_CONFIG.authUrl}?${params.toString()}`
}

export async function exchangeYouTubeCodeForTokens(
  code: string,
  flow: YouTubeOAuthFlow = 'artist'
): Promise<YouTubeTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getYouTubeCredentials(flow)

  const response = await fetch(YOUTUBE_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange YouTube code: ${error}`)
  }

  return response.json()
}

export async function refreshYouTubeAccessToken(refreshToken: string): Promise<YouTubeTokenResponse> {
  const { clientId, clientSecret } = getYouTubeCredentials('artist')

  const response = await fetch(YOUTUBE_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh YouTube token: ${error}`)
  }

  return response.json()
}

export async function getYouTubeChannelProfile(accessToken: string): Promise<YouTubeChannelProfile> {
  const response = await fetch(
    `${YOUTUBE_CONFIG.apiBaseUrl}/channels?part=id,snippet,statistics&mine=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch YouTube channel: ${error}`)
  }

  const data = (await response.json()) as YouTubeChannelResponse
  const channel = data.items?.[0]

  if (!channel) {
    throw new Error('No YouTube channel found for this Google account')
  }

  return {
    id: channel.id,
    title: channel.snippet?.title || null,
    subscriberCount: parseCount(channel.statistics?.subscriberCount),
    viewCount: parseCount(channel.statistics?.viewCount),
    videoCount: parseCount(channel.statistics?.videoCount),
  }
}

export async function storeYouTubeConnection(
  userId: string,
  tokens: YouTubeTokenResponse,
  channel: YouTubeChannelProfile
) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

  await prisma.platformConnection.upsert({
    where: {
      userId_platform: {
        userId,
        platform: Platform.YOUTUBE,
      },
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: expiresAt,
      platformUserId: channel.id,
      platformScope: tokens.scope || null,
      fanCount: channel.subscriberCount,
      lastSyncAt: new Date(),
      status: ConnectionStatus.CONNECTED,
      syncError: null,
    },
    create: {
      userId,
      platform: Platform.YOUTUBE,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: expiresAt,
      platformUserId: channel.id,
      platformScope: tokens.scope || null,
      fanCount: channel.subscriberCount,
      lastSyncAt: new Date(),
      status: ConnectionStatus.CONNECTED,
    },
  })
}

export async function getValidYouTubeAccessToken(userId: string): Promise<string | null> {
  const connection = await prisma.platformConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: Platform.YOUTUBE,
      },
    },
  })

  if (!connection?.accessToken) {
    return null
  }

  const expiresAt = connection.tokenExpiresAt
  const bufferTime = 5 * 60 * 1000
  const isExpired = expiresAt && expiresAt.getTime() < Date.now() + bufferTime

  if (isExpired && connection.refreshToken) {
    try {
      const tokens = await refreshYouTubeAccessToken(connection.refreshToken)

      await prisma.platformConnection.update({
        where: {
          userId_platform: {
            userId,
            platform: Platform.YOUTUBE,
          },
        },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || connection.refreshToken,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          platformScope: tokens.scope || connection.platformScope,
          status: ConnectionStatus.CONNECTED,
          syncError: null,
        },
      })

      return tokens.access_token
    } catch (error) {
      await prisma.platformConnection.update({
        where: {
          userId_platform: {
            userId,
            platform: Platform.YOUTUBE,
          },
        },
        data: {
          status: ConnectionStatus.EXPIRED,
          syncError: error instanceof Error ? error.message : 'YouTube token refresh failed',
        },
      })
      return null
    }
  }

  return connection.accessToken
}
