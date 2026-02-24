import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [ctaByKey, completionByStatus, latestCompletions] = await Promise.all([
      prisma.ctaActionCompletion.groupBy({
        by: ['ctaKey'],
        where: { userId: session.user.id },
        _count: { _all: true },
      }),
      prisma.ctaActionCompletion.groupBy({
        by: ['status'],
        where: { userId: session.user.id },
        _count: { _all: true },
      }),
      prisma.ctaActionCompletion.findMany({
        where: { userId: session.user.id },
        orderBy: { submittedAt: 'desc' },
        take: 10,
      }),
    ])

    return NextResponse.json({
      ctaByKey: ctaByKey.map((item) => ({ ctaKey: item.ctaKey, count: item._count._all })),
      completionByStatus: completionByStatus.map((item) => ({ status: item.status, count: item._count._all })),
      latestCompletions,
    })
  } catch (error) {
    console.error('Campaign analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
