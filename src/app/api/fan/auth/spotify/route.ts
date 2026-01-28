import { NextResponse } from 'next/server'
import { getFanUser, FAN_SPOTIFY_SCOPES } from '@/lib/fan-auth'
import { getSpotifyCredentials, isSpotifyConfigured } from '@/lib/spotify/config'
import { randomBytes } from 'crypto'

// Initiate Spotify OAuth for fan portal
export async function GET() {
  try {
    const user = await getFanUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isSpotifyConfigured()) {
      return NextResponse.json(
        { error: 'Spotify integration not configured' },
        { status: 503 }
      )
    }

    const { clientId } = getSpotifyCredentials()
    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUri = `${appUrl}/api/fan/auth/spotify/callback`

    // Generate state with fan user ID
    const state = Buffer.from(
      JSON.stringify({
        fanUserId: user.id,
        nonce: randomBytes(16).toString('hex'),
        timestamp: Date.now(),
      })
    ).toString('base64url')

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: FAN_SPOTIFY_SCOPES.join(' '),
      state,
      show_dialog: 'true',
    })

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Fan Spotify auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
