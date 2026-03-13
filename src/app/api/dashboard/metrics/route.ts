import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ADMIN_PREVIEW_COOKIE, isAdminEmail, resolveAdminPreviewMode } from '@/lib/admin'
import { buildDemoDashboardMetrics } from '@/lib/admin-preview/demo-data'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const previewMode = resolveAdminPreviewMode(
      req.cookies.get(ADMIN_PREVIEW_COOKIE)?.value,
      isAdminEmail(session.user.email)
    )

    if (previewMode === 'demo') {
      return NextResponse.json({
        previewMode,
        ...buildDemoDashboardMetrics(),
      })
    }

    const userId = session.user.id

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // 3 queries instead of 13
    const [tierStats, risingFans, newThisMonthByTier] = await Promise.all([
      // 1. Single groupBy: tier counts + avg scores
      prisma.fan.groupBy({
        by: ['tier'],
        where: { userId },
        _count: { tier: true },
        _avg: { stanScore: true },
      }),
      // 2. Rising fans
      prisma.fan.count({
        where: { userId, lastActiveAt: { gte: thirtyDaysAgo }, stanScore: { gte: 50 } },
      }),
      // 3. New this month by tier
      prisma.fan.groupBy({
        by: ['tier'],
        where: { userId, firstSeenAt: { gte: startOfMonth } },
        _count: { tier: true },
      }),
    ])

    // Build lookup maps from the two groupBy results
    const countMap: Record<string, number> = {}
    const avgMap: Record<string, number> = {}
    let totalFans = 0
    let totalScoreSum = 0
    let totalScoreCount = 0

    for (const row of tierStats) {
      countMap[row.tier] = row._count.tier
      avgMap[row.tier] = Math.round(row._avg.stanScore || 0)
      totalFans += row._count.tier
      if (row._avg.stanScore) {
        totalScoreSum += (row._avg.stanScore * row._count.tier)
        totalScoreCount += row._count.tier
      }
    }

    const newMap: Record<string, number> = {}
    let newFansThisMonth = 0
    for (const row of newThisMonthByTier) {
      newMap[row.tier] = row._count.tier
      newFansThisMonth += row._count.tier
    }

    const superfans = countMap['SUPERFAN'] || 0
    const avgStanScore = totalScoreCount > 0 ? Math.round(totalScoreSum / totalScoreCount) : 0

    const tierDistribution = [
      { tier: 'Core', dbTier: 'SUPERFAN', count: superfans, color: '#FFFFFF', avgScore: avgMap['SUPERFAN'] || 0, newThisMonth: newMap['SUPERFAN'] || 0 },
      { tier: 'Strong', dbTier: 'DEDICATED', count: countMap['DEDICATED'] || 0, color: '#A3A3A3', avgScore: avgMap['DEDICATED'] || 0, newThisMonth: newMap['DEDICATED'] || 0 },
      { tier: 'Steady', dbTier: 'ENGAGED', count: countMap['ENGAGED'] || 0, color: '#525252', avgScore: avgMap['ENGAGED'] || 0, newThisMonth: newMap['ENGAGED'] || 0 },
      { tier: 'Faint', dbTier: 'CASUAL', count: countMap['CASUAL'] || 0, color: '#333333', avgScore: avgMap['CASUAL'] || 0, newThisMonth: newMap['CASUAL'] || 0 },
    ]

    return NextResponse.json({
      previewMode,
      totalFans,
      superfans,
      risingFans,
      avgStanScore,
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
          value: avgStanScore,
          max: 100,
        },
      },
    })
  } catch (error) {
    console.error('Dashboard metrics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
