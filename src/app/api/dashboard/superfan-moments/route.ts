import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get recent notable events
    const events = await prisma.fanEvent.findMany({
      where: {
        fan: { userId: session.user.id },
        eventType: {
          in: ['BECAME_SUPERFAN', 'TIER_UPGRADE', 'MILESTONE_STREAMS', 'MILESTONE_ENGAGEMENT'],
        },
      },
      include: {
        fan: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            tier: true,
            stanScore: true,
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
      take: 10,
    })

    const moments = events.map((event) => ({
      id: event.id,
      type: event.eventType,
      description: event.description,
      platform: event.platform,
      occurredAt: event.occurredAt,
      fan: {
        id: event.fan.id,
        name: event.fan.displayName,
        avatar: event.fan.avatarUrl,
        tier: event.fan.tier,
        score: event.fan.stanScore,
      },
    }))

    return NextResponse.json({ moments })
  } catch (error) {
    console.error('Superfan moments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
