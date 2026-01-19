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

    // Get counts by tier for funnel
    const [totalFans, engaged, dedicated, superfans] = await Promise.all([
      prisma.fan.count({ where: { userId } }),
      prisma.fan.count({
        where: { userId, tier: { in: ['ENGAGED', 'DEDICATED', 'SUPERFAN'] } },
      }),
      prisma.fan.count({
        where: { userId, tier: { in: ['DEDICATED', 'SUPERFAN'] } },
      }),
      prisma.fan.count({ where: { userId, tier: 'SUPERFAN' } }),
    ])

    const funnel = [
      { stage: 'All Fans', count: totalFans, percentage: 100 },
      {
        stage: 'Engaged+',
        count: engaged,
        percentage: totalFans > 0 ? Math.round((engaged / totalFans) * 100) : 0,
      },
      {
        stage: 'Dedicated+',
        count: dedicated,
        percentage: totalFans > 0 ? Math.round((dedicated / totalFans) * 100) : 0,
      },
      {
        stage: 'Superfans',
        count: superfans,
        percentage: totalFans > 0 ? Math.round((superfans / totalFans) * 100) : 0,
      },
    ]

    // Get conversion rates
    const conversions = {
      casualToEngaged:
        totalFans > 0 ? Math.round((engaged / totalFans) * 100) : 0,
      engagedToDedicated:
        engaged > 0 ? Math.round((dedicated / engaged) * 100) : 0,
      dedicatedToSuperfan:
        dedicated > 0 ? Math.round((superfans / dedicated) * 100) : 0,
    }

    return NextResponse.json({ funnel, conversions })
  } catch (error) {
    console.error('Conversion insights error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
