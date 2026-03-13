import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ConnectionStatus, Platform } from '@prisma/client'
import {
  getValidYouTubeAccessToken,
  getYouTubeChannelProfile,
  syncYouTubeSubscribers,
} from '@/lib/youtube'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = await getValidYouTubeAccessToken(session.user.id)
    if (!accessToken) {
      return NextResponse.json({ error: 'YouTube not connected' }, { status: 400 })
    }

    const channel = await getYouTubeChannelProfile(accessToken)
    const subscriberImport = await syncYouTubeSubscribers(session.user.id, accessToken)

    await prisma.platformConnection.update({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: Platform.YOUTUBE,
        },
      },
      data: {
        platformUserId: channel.id,
        fanCount: channel.subscriberCount,
        lastSyncAt: new Date(),
        status: ConnectionStatus.CONNECTED,
        syncError: null,
      },
    })

    return NextResponse.json({
      success: true,
      platform: Platform.YOUTUBE,
      fanCount: channel.subscriberCount,
      channelTitle: channel.title,
      importedFans: subscriberImport.importedCount,
      updatedFans: subscriberImport.updatedCount,
      publicSubscribersImported: subscriberImport.publicSubscriberCount,
      stats: {
        subscribers: channel.subscriberCount,
        views: channel.viewCount,
        videos: channel.videoCount,
      },
    })
  } catch (error) {
    console.error('YouTube sync error:', error)
    const errorMessage = error instanceof Error ? error.message : 'YouTube sync failed'

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
