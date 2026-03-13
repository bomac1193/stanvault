import { buildAppUrl } from '@/lib/app-url'

export const YOUTUBE_CONFIG = {
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  apiBaseUrl: 'https://www.googleapis.com/youtube/v3',
  scopes: [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
} as const

export type YouTubeOAuthFlow = 'artist' | 'fan'

export function getYouTubeRedirectUri(flow: YouTubeOAuthFlow = 'artist'): string {
  if (flow === 'artist') {
    return process.env.YOUTUBE_ARTIST_REDIRECT_URI || buildAppUrl('/api/auth/youtube/callback')
  }

  return process.env.YOUTUBE_FAN_REDIRECT_URI || buildAppUrl('/api/fan/auth/youtube/callback')
}

export function getYouTubeCredentials(flow: YouTubeOAuthFlow = 'artist') {
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing YouTube credentials. Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET.')
  }

  return {
    clientId,
    clientSecret,
    redirectUri: getYouTubeRedirectUri(flow),
  }
}

export function isYouTubeConfigured(): boolean {
  return !!(
    process.env.YOUTUBE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID
  ) && !!(
    process.env.YOUTUBE_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET
  )
}
