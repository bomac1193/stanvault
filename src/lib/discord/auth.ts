import { ConnectionStatus, Platform } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { DISCORD_CONFIG, getDiscordCredentials } from './config'
import type { DiscordOAuthFlow } from './config'

interface DiscordTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
  token_type: string
}

interface DiscordUserResponse {
  id: string
  username: string
  global_name?: string | null
  avatar?: string | null
  email?: string | null
}

interface DiscordGuildResponse {
  id: string
  name: string
  owner?: boolean
  permissions?: string
  approximate_member_count?: number
  approximate_presence_count?: number
}

export interface DiscordAccountProfile {
  id: string
  username: string
  displayName: string
  email: string | null
  avatarUrl: string | null
}

export interface DiscordGuildSummary {
  totalServers: number
  managedServers: number
  totalMembers: number
  managedMembers: number
}

const ADMINISTRATOR_PERMISSION = 0x8n
const MANAGE_GUILD_PERMISSION = 0x20n

export function getDiscordAuthUrl(state: string, flow: DiscordOAuthFlow = 'artist'): string {
  const { clientId, redirectUri } = getDiscordCredentials(flow)

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: DISCORD_CONFIG.scopes.join(' '),
    prompt: 'consent',
    state,
  })

  return `${DISCORD_CONFIG.authUrl}?${params.toString()}`
}

export async function exchangeDiscordCodeForTokens(
  code: string,
  flow: DiscordOAuthFlow = 'artist'
): Promise<DiscordTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getDiscordCredentials(flow)

  const response = await fetch(DISCORD_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange Discord code: ${error}`)
  }

  return response.json()
}

export async function refreshDiscordAccessToken(refreshToken: string): Promise<DiscordTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getDiscordCredentials('artist')

  const response = await fetch(DISCORD_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh Discord token: ${error}`)
  }

  return response.json()
}

export async function getDiscordAccountProfile(accessToken: string): Promise<DiscordAccountProfile> {
  const response = await fetch(`${DISCORD_CONFIG.apiBaseUrl}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch Discord user: ${error}`)
  }

  const user = (await response.json()) as DiscordUserResponse

  return {
    id: user.id,
    username: user.username,
    displayName: user.global_name || user.username,
    email: user.email || null,
    avatarUrl: user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
      : null,
  }
}

export async function getDiscordGuilds(accessToken: string): Promise<DiscordGuildResponse[]> {
  const response = await fetch(`${DISCORD_CONFIG.apiBaseUrl}/users/@me/guilds?with_counts=true`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch Discord guilds: ${error}`)
  }

  return response.json()
}

export function summarizeDiscordGuilds(guilds: DiscordGuildResponse[]): DiscordGuildSummary {
  const managedGuilds = guilds.filter(hasGuildManagementAccess)

  return {
    totalServers: guilds.length,
    managedServers: managedGuilds.length,
    totalMembers: guilds.reduce((sum, guild) => sum + (guild.approximate_member_count || 0), 0),
    managedMembers: managedGuilds.reduce(
      (sum, guild) => sum + (guild.approximate_member_count || 0),
      0
    ),
  }
}

export async function storeDiscordConnection(
  userId: string,
  tokens: DiscordTokenResponse,
  profile: DiscordAccountProfile,
  guildSummary: DiscordGuildSummary
) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

  await prisma.platformConnection.upsert({
    where: {
      userId_platform: {
        userId,
        platform: Platform.DISCORD,
      },
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: expiresAt,
      platformUserId: profile.id,
      platformScope: tokens.scope || null,
      fanCount: guildSummary.managedMembers,
      lastSyncAt: new Date(),
      status: ConnectionStatus.CONNECTED,
      syncError: null,
    },
    create: {
      userId,
      platform: Platform.DISCORD,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: expiresAt,
      platformUserId: profile.id,
      platformScope: tokens.scope || null,
      fanCount: guildSummary.managedMembers,
      lastSyncAt: new Date(),
      status: ConnectionStatus.CONNECTED,
    },
  })
}

export async function getValidDiscordAccessToken(userId: string): Promise<string | null> {
  const connection = await prisma.platformConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: Platform.DISCORD,
      },
    },
  })

  if (!connection?.accessToken) return null

  const expiresAt = connection.tokenExpiresAt
  const bufferTime = 5 * 60 * 1000
  const isExpired = expiresAt && expiresAt.getTime() < Date.now() + bufferTime

  if (isExpired && connection.refreshToken) {
    try {
      const tokens = await refreshDiscordAccessToken(connection.refreshToken)

      await prisma.platformConnection.update({
        where: {
          userId_platform: {
            userId,
            platform: Platform.DISCORD,
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
            platform: Platform.DISCORD,
          },
        },
        data: {
          status: ConnectionStatus.EXPIRED,
          syncError: error instanceof Error ? error.message : 'Discord token refresh failed',
        },
      })

      return null
    }
  }

  return connection.accessToken
}

function hasGuildManagementAccess(guild: DiscordGuildResponse): boolean {
  if (guild.owner) return true
  if (!guild.permissions) return false

  try {
    const permissions = BigInt(guild.permissions)
    return (
      (permissions & ADMINISTRATOR_PERMISSION) === ADMINISTRATOR_PERMISSION ||
      (permissions & MANAGE_GUILD_PERMISSION) === MANAGE_GUILD_PERMISSION
    )
  } catch {
    return false
  }
}
