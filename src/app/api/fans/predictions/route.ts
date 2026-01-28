import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getTopPredictions } from '@/lib/scoring/predictive'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')
    const predictions = await getTopPredictions(session.user.email, limit)

    return NextResponse.json({
      predictions,
      meta: {
        total: predictions.length,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Predictions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
