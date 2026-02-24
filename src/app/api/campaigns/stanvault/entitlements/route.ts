import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { tierPolicies } from '@/lib/campaign-entitlements'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { pricingTier: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Artist account not found' }, { status: 404 })
    }

    const policy = tierPolicies[user.pricingTier]
    const monthStart = new Date()
    monthStart.setUTCDate(1)
    monthStart.setUTCHours(0, 0, 0, 0)

    const monthAggregate = await prisma.campaignRun.aggregate({
      where: {
        userId: session.user.id,
        dryRun: false,
        createdAt: { gte: monthStart },
      },
      _sum: { sentCount: true, voiceSentCount: true },
    })

    const monthSentSoFar = monthAggregate._sum.sentCount || 0
    const monthVoiceSentSoFar = monthAggregate._sum.voiceSentCount || 0
    const remaining =
      policy.monthlyLiveSendLimit === null
        ? null
        : Math.max(policy.monthlyLiveSendLimit - monthSentSoFar, 0)
    const voiceRemaining =
      policy.monthlyVoiceSendLimit === null
        ? null
        : Math.max(policy.monthlyVoiceSendLimit - monthVoiceSentSoFar, 0)

    return NextResponse.json({
      pricingTier: user.pricingTier,
      ...policy,
      monthSentSoFar,
      monthVoiceSentSoFar,
      remaining,
      voiceRemaining,
    })
  } catch (error) {
    console.error('Campaign entitlements error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
