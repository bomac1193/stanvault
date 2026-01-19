import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Platform } from '@prisma/client'
import { generateFans } from '@/mocks/generators/fan-generator'

const VALID_PLATFORMS: Platform[] = ['SPOTIFY', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER', 'EMAIL']

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = await params
    const platformUpper = platform.toUpperCase() as Platform

    if (!VALID_PLATFORMS.includes(platformUpper)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    // Check if already connected
    const existingConnection = await prisma.platformConnection.findUnique({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: platformUpper,
        },
      },
    })

    if (existingConnection) {
      return NextResponse.json(
        { error: 'Platform already connected' },
        { status: 400 }
      )
    }

    // Get all connected platforms including this new one
    const existingConnections = await prisma.platformConnection.findMany({
      where: { userId: session.user.id },
      select: { platform: true },
    })
    const connectedPlatforms = [...existingConnections.map((c) => c.platform), platformUpper]

    // Generate mock fans (200-500 for MVP)
    const fanCount = Math.floor(Math.random() * 300) + 200
    const generatedFans = generateFans(fanCount, connectedPlatforms)

    // Create platform connection and fans in a transaction
    await prisma.$transaction(async (tx) => {
      // Create platform connection
      await tx.platformConnection.create({
        data: {
          userId: session.user.id,
          platform: platformUpper,
          accessToken: 'mock_access_token_' + Date.now(),
          refreshToken: 'mock_refresh_token_' + Date.now(),
          status: 'CONNECTED',
          lastSyncAt: new Date(),
          fanCount,
        },
      })

      // Create fans with their platform links and events
      for (const fan of generatedFans) {
        const createdFan = await tx.fan.create({
          data: {
            userId: session.user.id,
            displayName: fan.displayName,
            email: fan.email,
            avatarUrl: fan.avatarUrl,
            location: fan.location,
            city: fan.city,
            country: fan.country,
            stanScore: fan.stanScore,
            tier: fan.tier,
            platformScore: fan.platformScore,
            engagementScore: fan.engagementScore,
            longevityScore: fan.longevityScore,
            recencyScore: fan.recencyScore,
            firstSeenAt: fan.firstSeenAt,
            lastActiveAt: fan.lastActiveAt,
          },
        })

        // Create platform links
        for (const link of fan.platformLinks) {
          await tx.fanPlatformLink.create({
            data: {
              fanId: createdFan.id,
              platform: link.platform,
              platformFanId: link.platformFanId,
              streams: link.streams,
              playlistAdds: link.playlistAdds,
              saves: link.saves,
              follows: link.follows,
              likes: link.likes,
              comments: link.comments,
              shares: link.shares,
              subscribed: link.subscribed,
              videoViews: link.videoViews,
              watchTime: link.watchTime,
              emailOpens: link.emailOpens,
              emailClicks: link.emailClicks,
              firstSeenAt: link.firstSeenAt,
              lastActiveAt: link.lastActiveAt,
            },
          })
        }

        // Create events
        for (const event of fan.events) {
          await tx.fanEvent.create({
            data: {
              fanId: createdFan.id,
              eventType: event.eventType,
              platform: event.platform,
              description: event.description,
              occurredAt: event.occurredAt,
            },
          })
        }
      }

      // Update total fan count on platform connection
      const totalFans = await tx.fan.count({
        where: { userId: session.user.id },
      })

      await tx.platformConnection.update({
        where: {
          userId_platform: {
            userId: session.user.id,
            platform: platformUpper,
          },
        },
        data: { fanCount: totalFans },
      })
    })

    // Get final fan count
    const totalFanCount = await prisma.fan.count({
      where: { userId: session.user.id },
    })

    return NextResponse.json({
      success: true,
      platform: platformUpper,
      fanCount: totalFanCount,
    })
  } catch (error) {
    console.error('Platform connection error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = await params
    const platformUpper = platform.toUpperCase() as Platform

    await prisma.platformConnection.delete({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: platformUpper,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Platform disconnect error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
