import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSpotifyAuthUrl, isSpotifyConfigured } from '@/lib/spotify'
import { randomBytes } from 'crypto'

// Initiate Spotify OAuth flow
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isSpotifyConfigured()) {
      return NextResponse.json(
        { error: 'Spotify integration not configured' },
        { status: 503 }
      )
    }

    // Generate state with user ID for verification
    const state = Buffer.from(
      JSON.stringify({
        userId: session.user.id,
        nonce: randomBytes(16).toString('hex'),
        timestamp: Date.now(),
      })
    ).toString('base64url')

    const authUrl = getSpotifyAuthUrl(state)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Spotify auth initiation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
