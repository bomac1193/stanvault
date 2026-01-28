import { SPOTIFY_CONFIG, getSpotifyCredentials } from './config'
import { prisma } from '@/lib/prisma'
import { Platform } from '@prisma/client'

interface TokenResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in: number
  refresh_token?: string
}

interface SpotifyUser {
  id: string
  email: string
  display_name: string
  images?: { url: string }[]
  country?: string
  product?: string
}

/**
 * Generate the Spotify OAuth authorization URL
 */
export function getSpotifyAuthUrl(state: string): string {
  const { clientId, redirectUri } = getSpotifyCredentials()

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SPOTIFY_CONFIG.scopes.join(' '),
    state,
    show_dialog: 'true', // Always show dialog for re-auth
  })

  return `${SPOTIFY_CONFIG.authUrl}?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const { clientId, clientSecret, redirectUri } = getSpotifyCredentials()

  const response = await fetch(SPOTIFY_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code: ${error}`)
  }

  return response.json()
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = getSpotifyCredentials()

  const response = await fetch(SPOTIFY_CONFIG.tokenUrl, {
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

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh token: ${error}`)
  }

  return response.json()
}

/**
 * Get the current Spotify user profile
 */
export async function getSpotifyUserProfile(accessToken: string): Promise<SpotifyUser> {
  const response = await fetch(`${SPOTIFY_CONFIG.apiBaseUrl}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get user profile: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Store Spotify connection for a user
 */
export async function storeSpotifyConnection(
  userId: string,
  tokens: TokenResponse,
  spotifyUser: SpotifyUser
) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

  await prisma.platformConnection.upsert({
    where: {
      userId_platform: {
        userId,
        platform: Platform.SPOTIFY,
      },
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: expiresAt,
      platformUserId: spotifyUser.id,
      platformScope: tokens.scope,
      status: 'CONNECTED',
      syncError: null,
      updatedAt: new Date(),
    },
    create: {
      userId,
      platform: Platform.SPOTIFY,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: expiresAt,
      platformUserId: spotifyUser.id,
      platformScope: tokens.scope,
      status: 'CONNECTED',
    },
  })
}

/**
 * Get a valid access token, refreshing if needed
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const connection = await prisma.platformConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: Platform.SPOTIFY,
      },
    },
  })

  if (!connection?.accessToken) {
    return null
  }

  // Check if token is expired or will expire in the next 5 minutes
  const expiresAt = connection.tokenExpiresAt
  const bufferTime = 5 * 60 * 1000 // 5 minutes
  const isExpired = expiresAt && expiresAt.getTime() < Date.now() + bufferTime

  if (isExpired && connection.refreshToken) {
    try {
      const tokens = await refreshAccessToken(connection.refreshToken)

      // Update stored tokens
      await prisma.platformConnection.update({
        where: {
          userId_platform: {
            userId,
            platform: Platform.SPOTIFY,
          },
        },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || connection.refreshToken,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          status: 'CONNECTED',
          syncError: null,
        },
      })

      return tokens.access_token
    } catch (error) {
      // Mark connection as expired
      await prisma.platformConnection.update({
        where: {
          userId_platform: {
            userId,
            platform: Platform.SPOTIFY,
          },
        },
        data: {
          status: 'EXPIRED',
          syncError: error instanceof Error ? error.message : 'Token refresh failed',
        },
      })
      return null
    }
  }

  return connection.accessToken
}
