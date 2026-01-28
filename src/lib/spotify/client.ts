import { SPOTIFY_CONFIG } from './config'
import { getValidAccessToken } from './auth'

// Types for Spotify API responses
export interface SpotifyTrack {
  id: string
  name: string
  duration_ms: number
  artists: { id: string; name: string }[]
  album: {
    id: string
    name: string
    images: { url: string }[]
  }
}

export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  images: { url: string }[]
  followers: { total: number }
  popularity: number
}

export interface RecentlyPlayedItem {
  track: SpotifyTrack
  played_at: string
  context?: {
    type: string
    uri: string
  }
}

export interface SavedTrack {
  added_at: string
  track: SpotifyTrack
}

export interface TopItem<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface PaginatedResponse<T> {
  items: T[]
  next: string | null
  cursors?: {
    after: string
    before: string
  }
  total?: number
  limit: number
}

/**
 * Spotify API Client
 */
export class SpotifyClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * Create a client for a user, handling token refresh
   */
  static async forUser(userId: string): Promise<SpotifyClient | null> {
    const token = await getValidAccessToken(userId)
    if (!token) return null
    return new SpotifyClient(token)
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${SPOTIFY_CONFIG.apiBaseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...options?.headers,
      },
    })

    if (response.status === 429) {
      // Rate limited - get retry-after header
      const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10)
      await this.delay(retryAfter * 1000)
      return this.request(endpoint, options)
    }

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Spotify API error (${response.status}): ${error}`)
    }

    return response.json()
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get current user's profile
   */
  async getMe() {
    return this.request<{
      id: string
      email: string
      display_name: string
      images: { url: string }[]
      country: string
      product: string
    }>('/me')
  }

  /**
   * Get user's recently played tracks
   */
  async getRecentlyPlayed(limit = 50, after?: string): Promise<PaginatedResponse<RecentlyPlayedItem>> {
    const params = new URLSearchParams({ limit: Math.min(limit, 50).toString() })
    if (after) params.set('after', after)

    return this.request(`/me/player/recently-played?${params}`)
  }

  /**
   * Get all recently played tracks (paginated)
   */
  async *getAllRecentlyPlayed(maxItems = 500): AsyncGenerator<RecentlyPlayedItem> {
    let after: string | undefined
    let count = 0

    while (count < maxItems) {
      const response = await this.getRecentlyPlayed(50, after)

      for (const item of response.items) {
        yield item
        count++
        if (count >= maxItems) return
      }

      if (!response.cursors?.after) break
      after = response.cursors.after

      await this.delay(SPOTIFY_CONFIG.rateLimitDelay)
    }
  }

  /**
   * Get user's saved tracks
   */
  async getSavedTracks(limit = 50, offset = 0): Promise<PaginatedResponse<SavedTrack>> {
    const params = new URLSearchParams({
      limit: Math.min(limit, 50).toString(),
      offset: offset.toString(),
    })

    return this.request(`/me/tracks?${params}`)
  }

  /**
   * Get all saved tracks (paginated)
   */
  async *getAllSavedTracks(maxItems = 1000): AsyncGenerator<SavedTrack> {
    let offset = 0
    let count = 0

    while (count < maxItems) {
      const response = await this.getSavedTracks(50, offset)

      for (const item of response.items) {
        yield item
        count++
        if (count >= maxItems) return
      }

      if (!response.next) break
      offset += 50

      await this.delay(SPOTIFY_CONFIG.rateLimitDelay)
    }
  }

  /**
   * Get user's top artists
   */
  async getTopArtists(
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit = 50
  ): Promise<TopItem<SpotifyArtist>> {
    const params = new URLSearchParams({
      time_range: timeRange,
      limit: Math.min(limit, 50).toString(),
    })

    return this.request(`/me/top/artists?${params}`)
  }

  /**
   * Get user's top tracks
   */
  async getTopTracks(
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit = 50
  ): Promise<TopItem<SpotifyTrack>> {
    const params = new URLSearchParams({
      time_range: timeRange,
      limit: Math.min(limit, 50).toString(),
    })

    return this.request(`/me/top/tracks?${params}`)
  }

  /**
   * Get user's followed artists
   */
  async getFollowedArtists(limit = 50, after?: string): Promise<{
    artists: PaginatedResponse<SpotifyArtist>
  }> {
    const params = new URLSearchParams({
      type: 'artist',
      limit: Math.min(limit, 50).toString(),
    })
    if (after) params.set('after', after)

    return this.request(`/me/following?${params}`)
  }

  /**
   * Check if user follows specific artists
   */
  async checkFollowingArtists(artistIds: string[]): Promise<boolean[]> {
    const params = new URLSearchParams({
      type: 'artist',
      ids: artistIds.join(','),
    })

    return this.request(`/me/following/contains?${params}`)
  }

  /**
   * Get an artist by ID
   */
  async getArtist(artistId: string): Promise<SpotifyArtist> {
    return this.request(`/artists/${artistId}`)
  }

  /**
   * Search for an artist
   */
  async searchArtists(query: string, limit = 10): Promise<{ artists: PaginatedResponse<SpotifyArtist> }> {
    const params = new URLSearchParams({
      q: query,
      type: 'artist',
      limit: limit.toString(),
    })

    return this.request(`/search?${params}`)
  }

  /**
   * Get user's playlists
   */
  async getPlaylists(limit = 50, offset = 0): Promise<PaginatedResponse<{
    id: string
    name: string
    tracks: { total: number }
    owner: { id: string }
  }>> {
    const params = new URLSearchParams({
      limit: Math.min(limit, 50).toString(),
      offset: offset.toString(),
    })

    return this.request(`/me/playlists?${params}`)
  }

  /**
   * Get tracks in a playlist
   */
  async getPlaylistTracks(playlistId: string, limit = 50, offset = 0): Promise<PaginatedResponse<{
    added_at: string
    track: SpotifyTrack
  }>> {
    const params = new URLSearchParams({
      limit: Math.min(limit, 50).toString(),
      offset: offset.toString(),
    })

    return this.request(`/playlists/${playlistId}/tracks?${params}`)
  }
}
