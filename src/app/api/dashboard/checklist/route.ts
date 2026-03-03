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

    const [platformCount, fanCount, dropCount, campaignCount] = await Promise.all([
      prisma.platformConnection.count({ where: { userId } }),
      prisma.fan.count({ where: { userId } }),
      prisma.drop.count({ where: { userId } }),
      prisma.campaignRun.count({ where: { userId } }),
    ])

    return NextResponse.json({
      platformConnected: platformCount > 0,
      hasFans: fanCount > 0,
      hasDrops: dropCount > 0,
      hasCampaigns: campaignCount > 0,
    })
  } catch (error) {
    console.error('Checklist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
