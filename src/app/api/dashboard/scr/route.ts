import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateSCR, getSCRHistory } from '@/lib/scoring/scr'
import { startOfDay, subDays } from 'date-fns'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const today = startOfDay(new Date())

    // Try cached SCR from today's snapshot first (1 query instead of 20+)
    const [cached, history] = await Promise.all([
      prisma.artistMetricsHistory.findUnique({
        where: { userId_date: { userId, date: today } },
      }),
      getSCRHistory(userId, 30),
    ])

    let scr: number
    let components: {
      holdRate: number
      holdRate30Day: number
      depthVelocity: number
      platformIndependence: number
      churnRate: number
    }
    let interpretation: string

    if (cached?.scr !== null && cached?.scr !== undefined) {
      // Serve cached — no recalculation
      scr = cached.scr
      components = {
        holdRate: cached.holdRate90Day ?? 0.7,
        holdRate30Day: cached.holdRate30Day ?? 0.7,
        depthVelocity: cached.depthVelocity ?? 0.3,
        platformIndependence: cached.platformIndependence ?? 0.5,
        churnRate: cached.churnRate ?? 0.1,
      }
      if (scr >= 3) interpretation = 'Exceptional conversion. Your audience builds lasting connections.'
      else if (scr >= 1.5) interpretation = 'Strong conversion. Most listeners become genuine fans.'
      else if (scr >= 0.5) interpretation = 'Moderate conversion. Room for deeper engagement.'
      else if (scr >= 0.2) interpretation = 'Below average conversion. Focus on retention and depth.'
      else interpretation = 'Low conversion. High fade rate or shallow depth.'
    } else {
      // No cache for today — calculate once and store
      const scrResult = await calculateSCR(userId)
      scr = scrResult.scr
      components = scrResult.components
      interpretation = scrResult.interpretation
    }

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable'
    let trendPercent = 0

    if (history.length >= 7) {
      const weekAgo = history[history.length - 7]?.scr
      if (weekAgo && scr) {
        const diff = ((scr - weekAgo) / weekAgo) * 100
        trendPercent = Math.round(diff)
        trend = diff > 2 ? 'up' : diff < -2 ? 'down' : 'stable'
      }
    }

    return NextResponse.json({
      scr,
      components,
      interpretation,
      trend,
      trendPercent,
      history: history.map(h => ({
        date: h.date.toISOString().split('T')[0],
        scr: h.scr,
        holdRate: h.holdRate,
        churnRate: h.churnRate,
      })),
    })
  } catch (error) {
    console.error('SCR calculation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
