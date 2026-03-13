import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDiscordAuthUrl, isDiscordConfigured } from '@/lib/discord'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isDiscordConfigured()) {
      return NextResponse.json(
        { error: 'Discord integration not configured' },
        { status: 503 }
      )
    }

    const state = Buffer.from(
      JSON.stringify({
        userId: session.user.id,
        nonce: randomBytes(16).toString('hex'),
        timestamp: Date.now(),
      })
    ).toString('base64url')

    const authUrl = getDiscordAuthUrl(state, 'artist')

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Discord auth initiation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
