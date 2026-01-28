import { NextRequest, NextResponse } from 'next/server'
import {
  exchangeCodeForTokens,
  getSpotifyUserProfile,
  storeSpotifyConnection,
} from '@/lib/spotify'
import { syncArtistSpotifyProfile } from '@/lib/spotify/sync'

// Handle Spotify OAuth callback
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle user denied access
    if (error) {
      return NextResponse.redirect(
        new URL(`/connections?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/connections?error=missing_params', request.url)
      )
    }

    // Decode and verify state
    let stateData: { userId: string; nonce: string; timestamp: number }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    } catch {
      return NextResponse.redirect(
        new URL('/connections?error=invalid_state', request.url)
      )
    }

    // Check state is not too old (15 min max)
    const maxAge = 15 * 60 * 1000
    if (Date.now() - stateData.timestamp > maxAge) {
      return NextResponse.redirect(
        new URL('/connections?error=state_expired', request.url)
      )
    }

    const userId = stateData.userId

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Get Spotify user profile
    const spotifyUser = await getSpotifyUserProfile(tokens.access_token)

    // Store the connection
    await storeSpotifyConnection(userId, tokens, spotifyUser)

    // Try to sync artist profile to get their Spotify artist ID
    await syncArtistSpotifyProfile(userId)

    // Redirect back to connections page with success
    return NextResponse.redirect(
      new URL('/connections?success=spotify_connected', request.url)
    )
  } catch (error) {
    console.error('Spotify callback error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.redirect(
      new URL(`/connections?error=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}
