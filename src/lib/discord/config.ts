import { buildAppUrl } from '@/lib/app-url'

export const DISCORD_CONFIG = {
  authUrl: 'https://discord.com/oauth2/authorize',
  tokenUrl: 'https://discord.com/api/v10/oauth2/token',
  apiBaseUrl: 'https://discord.com/api/v10',
  scopes: ['identify', 'email', 'guilds'],
} as const

export type DiscordOAuthFlow = 'artist' | 'fan'

export function getDiscordRedirectUri(flow: DiscordOAuthFlow = 'artist'): string {
  if (flow === 'artist') {
    return process.env.DISCORD_ARTIST_REDIRECT_URI || buildAppUrl('/api/auth/discord/callback')
  }

  return process.env.DISCORD_FAN_REDIRECT_URI || buildAppUrl('/api/fan/auth/discord/callback')
}

export function getDiscordCredentials(flow: DiscordOAuthFlow = 'artist') {
  const clientId = process.env.DISCORD_CLIENT_ID
  const clientSecret = process.env.DISCORD_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing Discord credentials. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET.')
  }

  return {
    clientId,
    clientSecret,
    redirectUri: getDiscordRedirectUri(flow),
  }
}

export function isDiscordConfigured(): boolean {
  return Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET)
}
