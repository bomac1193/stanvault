import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get fan counts by tier
    const [totalFans, superfans, dedicated, engaged, casual] = await Promise.all([
      prisma.fan.count({ where: { userId } }),
      prisma.fan.count({ where: { userId, tier: 'SUPERFAN' } }),
      prisma.fan.count({ where: { userId, tier: 'DEDICATED' } }),
      prisma.fan.count({ where: { userId, tier: 'ENGAGED' } }),
      prisma.fan.count({ where: { userId, tier: 'CASUAL' } }),
    ])

    // Get average stan score
    const avgScoreResult = await prisma.fan.aggregate({
      where: { userId },
      _avg: { stanScore: true },
    })

    // Get rising fans (recently active with high engagement)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const risingFans = await prisma.fan.count({
      where: {
        userId,
        lastActiveAt: { gte: thirtyDaysAgo },
        stanScore: { gte: 50 },
      },
    })

    // Get new fans this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const newFansThisMonth = await prisma.fan.count({
      where: {
        userId,
        firstSeenAt: { gte: startOfMonth },
      },
    })

    // Get tier distribution for chart
    const tierDistribution = [
      { tier: 'Superfan', count: superfans, color: '#C9A227' },
      { tier: 'Dedicated', count: dedicated, color: '#8B5CF6' },
      { tier: 'Engaged', count: engaged, color: '#3B82F6' },
      { tier: 'Casual', count: casual, color: '#6B7280' },
    ]

    return NextResponse.json({
      totalFans,
      superfans,
      risingFans,
      avgStanScore: Math.round(avgScoreResult._avg.stanScore || 0),
      newFansThisMonth,
      tierDistribution,
      metrics: {
        totalFans: {
          value: totalFans,
          change: newFansThisMonth,
          changeType: 'increase' as const,
        },
        superfans: {
          value: superfans,
          percentage: totalFans > 0 ? Math.round((superfans / totalFans) * 100) : 0,
        },
        risingFans: {
          value: risingFans,
          label: 'High engagement recently',
        },
        avgStanScore: {
          value: Math.round(avgScoreResult._avg.stanScore || 0),
          max: 100,
        },
      },
    })
  } catch (error) {
    console.error('Dashboard metrics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
