import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getYouTubeAuthUrl, isYouTubeConfigured } from '@/lib/youtube'
import { randomBytes } from 'crypto'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isYouTubeConfigured()) {
      return NextResponse.json(
        { error: 'YouTube integration not configured' },
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

    const authUrl = getYouTubeAuthUrl(state, 'artist')

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('YouTube auth initiation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
