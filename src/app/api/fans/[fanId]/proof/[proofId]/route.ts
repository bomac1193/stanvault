import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateStanScore, getTierFromScore } from '@/lib/scoring/stan-score'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { fanId: string; proofId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the fan belongs to this creator
    const fan = await prisma.fan.findFirst({
      where: { id: params.fanId, userId: session.user.id },
      include: { platformLinks: true, proofs: true },
    })

    if (!fan) {
      return NextResponse.json({ error: 'Fan not found' }, { status: 404 })
    }

    const body = await req.json()
    const { action, convictionPoints, reviewNote } = body

    if (!action || !['verify', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "verify" or "reject"' }, { status: 400 })
    }

    const isVerify = action === 'verify'
    const points = isVerify ? Math.min(Math.max(convictionPoints || 5, 0), 15) : 0

    const proof = await prisma.fanProof.update({
      where: { id: params.proofId },
      data: {
        verifiedByCreator: isVerify,
        rejectedByCreator: !isVerify,
        convictionPoints: points,
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
      },
    })

    // Recalculate score if verified
    if (isVerify) {
      const allProofs = await prisma.fanProof.findMany({
        where: { fanId: params.fanId, verifiedByCreator: true },
      })
      const totalProofPoints = Math.min(
        allProofs.reduce((sum, p) => sum + p.convictionPoints, 0),
        15
      )

      const baseScore = calculateStanScore({
        platformLinks: fan.platformLinks.map((l) => ({
          platform: l.platform,
          streams: l.streams,
          playlistAdds: l.playlistAdds,
          saves: l.saves,
          follows: l.follows,
          likes: l.likes,
          comments: l.comments,
          shares: l.shares,
          subscribed: l.subscribed,
          videoViews: l.videoViews,
          watchTime: l.watchTime,
          emailOpens: l.emailOpens,
          emailClicks: l.emailClicks,
          tipCount: l.tipCount,
          tipAmountUsd: l.tipAmountUsd,
          tipFrequency: l.tipFrequency,
          momentSaves: l.momentSaves,
          cityAffiliation: l.cityAffiliation,
          purchaseCount: l.purchaseCount,
          purchaseAmountUsd: l.purchaseAmountUsd,
          subscriptionMonths: l.subscriptionMonths,
        })),
        firstSeenAt: fan.firstSeenAt,
        lastActiveAt: fan.lastActiveAt,
      })

      const newTotal = Math.min(baseScore.totalScore + totalProofPoints, 100)
      const newTier = getTierFromScore(newTotal)

      await prisma.fan.update({
        where: { id: params.fanId },
        data: { stanScore: newTotal, tier: newTier },
      })
    }

    return NextResponse.json({ proof })
  } catch (error) {
    console.error('Update proof error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
