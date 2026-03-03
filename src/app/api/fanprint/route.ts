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

    // ── A) City Revenue Intelligence ──────────────────────────────
    const cityGroups = await prisma.fan.groupBy({
      by: ['city', 'country'],
      where: {
        userId,
        city: { not: null },
      },
      _count: { id: true },
      _avg: { stanScore: true, convictionScore: true },
      orderBy: { _avg: { convictionScore: 'desc' } },
      take: 15,
    })

    // Get tier counts per city
    const cityTierCounts = await prisma.fan.groupBy({
      by: ['city', 'tier'],
      where: {
        userId,
        city: { not: null, in: cityGroups.map((c) => c.city!).filter(Boolean) },
      },
      _count: { id: true },
    })

    // Get revenue per city by joining through fans → platformLinks
    const fansInCities = await prisma.fan.findMany({
      where: {
        userId,
        city: { not: null, in: cityGroups.map((c) => c.city!).filter(Boolean) },
      },
      select: {
        city: true,
        platformLinks: {
          select: {
            purchaseAmountUsd: true,
            tipAmountUsd: true,
          },
        },
      },
    })

    const cityRevenueMap: Record<string, number> = {}
    for (const fan of fansInCities) {
      const city = fan.city!
      const revenue = fan.platformLinks.reduce(
        (sum, pl) => sum + (pl.purchaseAmountUsd || 0) + (pl.tipAmountUsd || 0),
        0
      )
      cityRevenueMap[city] = (cityRevenueMap[city] || 0) + revenue
    }

    // Build tier map per city
    const cityTierMap: Record<string, { superfan: number; dedicated: number; engaged: number; casual: number }> = {}
    for (const row of cityTierCounts) {
      const city = row.city!
      if (!cityTierMap[city]) {
        cityTierMap[city] = { superfan: 0, dedicated: 0, engaged: 0, casual: 0 }
      }
      const tierKey = row.tier.toLowerCase() as keyof typeof cityTierMap[string]
      cityTierMap[city][tierKey] = row._count.id
    }

    const cityIntelligence = cityGroups.map((cg) => ({
      city: cg.city || 'Unknown',
      country: cg.country || '',
      fanCount: cg._count.id,
      avgStanScore: Math.round(cg._avg.stanScore || 0),
      avgConviction: Math.round((cg._avg.convictionScore || 0) * 10) / 10,
      totalRevenue: Math.round((cityRevenueMap[cg.city!] || 0) * 100) / 100,
      tiers: cityTierMap[cg.city!] || { superfan: 0, dedicated: 0, engaged: 0, casual: 0 },
    }))

    // ── B) Drop Performance by Tier ──────────────────────────────
    const drops = await prisma.drop.findMany({
      where: { userId },
      include: {
        claims: {
          select: {
            tier: true,
            stanScore: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const dropPerformance = drops.map((drop) => {
      const claimsByTier = { superfan: 0, dedicated: 0, engaged: 0, casual: 0 }
      let totalScore = 0
      for (const claim of drop.claims) {
        const tierKey = claim.tier.toLowerCase() as keyof typeof claimsByTier
        claimsByTier[tierKey]++
        totalScore += claim.stanScore
      }
      return {
        dropId: drop.id,
        title: drop.title,
        totalClaims: drop.claims.length,
        claimsByTier,
        avgClaimScore: drop.claims.length > 0 ? Math.round(totalScore / drop.claims.length) : 0,
      }
    })

    // ── C) Platform Revenue Gaps ─────────────────────────────────
    const dedicatedPlusFans = await prisma.fan.findMany({
      where: {
        userId,
        tier: { in: ['DEDICATED', 'SUPERFAN'] },
      },
      include: {
        platformLinks: {
          select: {
            platform: true,
            purchaseAmountUsd: true,
            tipAmountUsd: true,
          },
        },
      },
    })

    const dedicatedPlusTotal = dedicatedPlusFans.length
    const platformCountMap: Record<string, { count: number; totalRevenue: number }> = {}

    for (const fan of dedicatedPlusFans) {
      for (const link of fan.platformLinks) {
        if (!platformCountMap[link.platform]) {
          platformCountMap[link.platform] = { count: 0, totalRevenue: 0 }
        }
        platformCountMap[link.platform].count++
        platformCountMap[link.platform].totalRevenue +=
          (link.purchaseAmountUsd || 0) + (link.tipAmountUsd || 0)
      }
    }

    const platformGaps = Object.entries(platformCountMap)
      .map(([platform, data]) => ({
        platform,
        dedicatedPlusFans: data.count,
        dedicatedPlusTotal,
        percentage: dedicatedPlusTotal > 0 ? Math.round((data.count / dedicatedPlusTotal) * 100) : 0,
        avgRevenue:
          data.count > 0 ? Math.round((data.totalRevenue / data.count) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)

    // ── D) Revenue Visibility Score ──────────────────────────────
    const allFanLinks = await prisma.fanPlatformLink.findMany({
      where: {
        fan: { userId },
      },
      select: {
        fanId: true,
        platform: true,
        purchaseAmountUsd: true,
        tipAmountUsd: true,
      },
    })

    let totalVisibleRevenue = 0
    const fansWithFinancialSet = new Set<string>()
    const revenueByPlatform: Record<string, number> = {}

    for (const link of allFanLinks) {
      const revenue = (link.purchaseAmountUsd || 0) + (link.tipAmountUsd || 0)
      if (revenue > 0) {
        totalVisibleRevenue += revenue
        fansWithFinancialSet.add(link.fanId)
        revenueByPlatform[link.platform] = (revenueByPlatform[link.platform] || 0) + revenue
      }
    }

    const totalFans = await prisma.fan.count({ where: { userId } })
    const fansWithFinancial = fansWithFinancialSet.size

    // Find top revenue source
    let topRevenueSource = 'None'
    let topRevenueAmount = 0
    for (const [platform, amount] of Object.entries(revenueByPlatform)) {
      if (amount > topRevenueAmount) {
        topRevenueAmount = amount
        topRevenueSource = platform
      }
    }

    const revenueVisibility = {
      totalVisibleRevenue: Math.round(totalVisibleRevenue * 100) / 100,
      fansWithFinancial,
      totalFans,
      visibilityRate: totalFans > 0 ? Math.round((fansWithFinancial / totalFans) * 1000) / 1000 : 0,
      topRevenueSource,
    }

    return NextResponse.json({
      cityIntelligence,
      dropPerformance,
      platformGaps,
      revenueVisibility,
    })
  } catch (error) {
    console.error('FanPrint API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
