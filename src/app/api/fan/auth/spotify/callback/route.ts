import { NextRequest, NextResponse } from 'next/server'
import { updateFanUserSpotify } from '@/lib/fan-auth'
import { getSpotifyCredentials } from '@/lib/spotify/config'

// Handle Spotify OAuth callback for fan portal
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle user denied access
    if (error) {
      return NextResponse.redirect(
        new URL(`/fan/onboarding?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/fan/onboarding?error=missing_params', request.url)
      )
    }

    // Decode and verify state
    let stateData: { fanUserId: string; nonce: string; timestamp: number }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    } catch {
      return NextResponse.redirect(
        new URL('/fan/onboarding?error=invalid_state', request.url)
      )
    }

    // Check state is not too old (15 min max)
    const maxAge = 15 * 60 * 1000
    if (Date.now() - stateData.timestamp > maxAge) {
      return NextResponse.redirect(
        new URL('/fan/onboarding?error=state_expired', request.url)
      )
    }

    const fanUserId = stateData.fanUserId
    const { clientId, clientSecret } = getSpotifyCredentials()
    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUri = `${appUrl}/api/fan/auth/spotify/callback`

    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
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

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange error:', errorText)
      return NextResponse.redirect(
        new URL('/fan/onboarding?error=token_exchange_failed', request.url)
      )
    }

    const tokens = await tokenResponse.json()

    // Get Spotify user profile
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!profileResponse.ok) {
      return NextResponse.redirect(
        new URL('/fan/onboarding?error=profile_fetch_failed', request.url)
      )
    }

    const profile = await profileResponse.json()

    // Update fan user with Spotify data
    await updateFanUserSpotify(fanUserId, {
      spotifyUserId: profile.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    })

    // Redirect back to onboarding with success
    return NextResponse.redirect(
      new URL('/fan/onboarding?spotify=connected', request.url)
    )
  } catch (error) {
    console.error('Fan Spotify callback error:', error)
    return NextResponse.redirect(
      new URL('/fan/onboarding?error=callback_failed', request.url)
    )
  }
}
