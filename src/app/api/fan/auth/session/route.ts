import { NextResponse } from 'next/server'
import { getFanUser } from '@/lib/fan-auth'

export async function GET() {
  try {
    const user = await getFanUser()

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        spotifyConnected: !!user.spotifyUserId,
        onboardingCompleted: user.onboardingCompleted,
      },
    })
  } catch (error) {
    console.error('Fan session error:', error)
    return NextResponse.json({ user: null })
  }
}
