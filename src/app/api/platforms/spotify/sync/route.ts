import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { syncAllFans } from '@/lib/spotify/sync'
import { prisma } from '@/lib/prisma'
import { Platform } from '@prisma/client'

// Trigger a manual sync of Spotify data
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Spotify is connected
    const connection = await prisma.platformConnection.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: Platform.SPOTIFY,
        },
      },
    })

    if (!connection || connection.status !== 'CONNECTED') {
      return NextResponse.json(
        { error: 'Spotify not connected' },
        { status: 400 }
      )
    }

    // Perform sync
    const result = await syncAllFans(session.user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Sync failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      fansUpdated: result.fansUpdated,
      fansCreated: result.fansCreated,
    })
  } catch (error) {
    console.error('Spotify sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
