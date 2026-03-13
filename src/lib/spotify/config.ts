import { buildAppUrl } from '@/lib/app-url'

// Spotify API Configuration

export const SPOTIFY_CONFIG = {
  // OAuth endpoints
  authUrl: 'https://accounts.spotify.com/authorize',
  tokenUrl: 'https://accounts.spotify.com/api/token',

  // API base URL
  apiBaseUrl: 'https://api.spotify.com/v1',

  // Required scopes for fan data
  scopes: [
    'user-read-recently-played',  // Recent listening history
    'user-library-read',          // Saved tracks/albums
    'user-follow-read',           // Who they follow
    'user-top-read',              // Top artists/tracks
    'user-read-email',            // Email for fan matching
    'user-read-private',          // Country, subscription info
  ],

  // Rate limiting
  rateLimitDelay: 100, // ms between requests
  maxRetries: 3,

  // Pagination
  defaultLimit: 50,
  maxLimit: 50,
} as const

export type SpotifyOAuthFlow = 'artist' | 'fan'

export function getSpotifyRedirectUri(flow: SpotifyOAuthFlow = 'artist'): string {
  if (flow === 'artist') {
    return (
      process.env.SPOTIFY_ARTIST_REDIRECT_URI ||
      process.env.SPOTIFY_REDIRECT_URI ||
      buildAppUrl('/api/auth/spotify/callback')
    )
  }

  return process.env.SPOTIFY_FAN_REDIRECT_URI || buildAppUrl('/api/fan/auth/spotify/callback')
}

export function getSpotifyCredentials(flow: SpotifyOAuthFlow = 'artist') {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.')
  }

  return {
    clientId,
    clientSecret,
    redirectUri: getSpotifyRedirectUri(flow),
  }
}

export function isSpotifyConfigured(): boolean {
  return !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET)
}
