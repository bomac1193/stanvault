import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { calculateSCR, getSCRHistory } from '@/lib/scoring/scr'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get current SCR
    const scrResult = await calculateSCR(userId)

    // Get 30-day history
    const history = await getSCRHistory(userId, 30)

    // Calculate trend (compare to 7 days ago)
    let trend: 'up' | 'down' | 'stable' = 'stable'
    let trendPercent = 0

    if (history.length >= 7) {
      const weekAgo = history[history.length - 7]?.scr
      const current = scrResult.scr

      if (weekAgo && current) {
        const diff = ((current - weekAgo) / weekAgo) * 100
        trendPercent = Math.round(diff)
        trend = diff > 2 ? 'up' : diff < -2 ? 'down' : 'stable'
      }
    }

    return NextResponse.json({
      scr: scrResult.scr,
      components: scrResult.components,
      interpretation: scrResult.interpretation,
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
