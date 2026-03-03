import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const days = Number(request.nextUrl.searchParams.get('days') || '30')
    const since = startOfDay(subDays(new Date(), days))

    const history = await prisma.artistMetricsHistory.findMany({
      where: {
        userId: session.user.id,
        date: { gte: since },
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        totalFans: true,
        casualCount: true,
        engagedCount: true,
        dedicatedCount: true,
        superfanCount: true,
        holdRate90Day: true,
        holdRate30Day: true,
        depthVelocity: true,
        platformIndependence: true,
        churnRate: true,
        scr: true,
        newFansCount: true,
        churnedFansCount: true,
        upgradedFansCount: true,
      },
    })

    return NextResponse.json({
      days,
      history: history.map((h) => ({
        ...h,
        date: h.date.toISOString().split('T')[0],
      })),
    })
  } catch (error) {
    console.error('Trends fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
