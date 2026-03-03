// Sync Oryx — incremental pull of new backers/updates since last sync
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Platform, EventType } from '@prisma/client'
import { calculateStanScore } from '@/lib/scoring/stan-score'

const ORYX_API_URL = process.env.ORYX_API_URL || 'http://localhost:4000'
const ECOSYSTEM_API_SECRET = process.env.ECOSYSTEM_API_SECRET || ''

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Must be connected first
    const connection = await prisma.platformConnection.findUnique({
      where: { userId_platform: { userId, platform: Platform.DASHAM } },
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'Oryx not connected. Connect it first.' },
        { status: 400 }
      )
    }

    const oryxArtistId = connection.platformUserId
    if (!oryxArtistId) {
      return NextResponse.json(
        { error: 'Missing Oryx artist ID on connection. Disconnect and reconnect.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { location: true },
    })

    // Pull backers since last sync
    const sinceParam = connection.lastSyncAt
      ? `?since=${connection.lastSyncAt.toISOString()}`
      : ''

    const backersRes = await fetch(
      `${ORYX_API_URL}/api/ecosystem/artist/${oryxArtistId}/backers${sinceParam}`,
      {
        headers: {
          'X-Ecosystem-Secret': ECOSYSTEM_API_SECRET,
        },
      }
    )

    if (!backersRes.ok) {
      const errText = await backersRes.text().catch(() => 'Unknown error')
      await prisma.platformConnection.update({
        where: { id: connection.id },
        data: { syncError: `Oryx API returned ${backersRes.status}: ${errText}` },
      })
      return NextResponse.json(
        { error: 'Oryx sync failed', details: errText },
        { status: 502 }
      )
    }

    const data = await backersRes.json()

    const now = new Date()
    let importedCount = 0
    let updatedCount = 0

    for (const backer of data.backers) {
      const firstTip = new Date(backer.firstTipAt)
      const lastTip = new Date(backer.lastTipAt)
      const monthSpan = Math.max(1,
        (lastTip.getFullYear() - firstTip.getFullYear()) * 12 +
        (lastTip.getMonth() - firstTip.getMonth()) + 1
      )
      const tipFrequency = Math.min(monthSpan, backer.tipCount)

      const existingFan = await prisma.fan.findFirst({
        where: {
          userId,
          OR: [
            ...(backer.email ? [{ email: backer.email }] : []),
            { displayName: backer.displayName },
          ],
        },
        include: { platformLinks: true },
      })

      if (existingFan) {
        const dashamLink = existingFan.platformLinks.find(
          (l) => l.platform === Platform.DASHAM
        )

        if (dashamLink) {
          if (backer.tipCount > (dashamLink.tipCount || 0)) {
            await prisma.fanPlatformLink.update({
              where: { id: dashamLink.id },
              data: {
                tipCount: backer.tipCount,
                tipAmountUsd: backer.tipAmountUsd,
                tipFrequency,
                cityAffiliation: backer.city,
                lastActiveAt: lastTip,
              },
            })
          }
        } else {
          await prisma.fanPlatformLink.create({
            data: {
              fanId: existingFan.id,
              platform: Platform.DASHAM,
              tipCount: backer.tipCount,
              tipAmountUsd: backer.tipAmountUsd,
              tipFrequency,
              cityAffiliation: backer.city,
              firstSeenAt: firstTip,
              lastActiveAt: lastTip,
            },
          })
        }

        // Recalculate score
        const updatedFan = await prisma.fan.findUnique({
          where: { id: existingFan.id },
          include: { platformLinks: true },
        })

        if (updatedFan) {
          const scoreResult = calculateStanScore({
            platformLinks: updatedFan.platformLinks.map((link) => ({
              platform: link.platform,
              streams: link.streams,
              playlistAdds: link.playlistAdds,
              saves: link.saves,
              follows: link.follows,
              likes: link.likes,
              comments: link.comments,
              shares: link.shares,
              subscribed: link.subscribed,
              videoViews: link.videoViews,
              watchTime: link.watchTime,
              emailOpens: link.emailOpens,
              emailClicks: link.emailClicks,
              tipCount: link.tipCount,
              tipAmountUsd: link.tipAmountUsd,
              tipFrequency: link.tipFrequency,
              momentSaves: link.momentSaves,
              cityAffiliation: link.cityAffiliation,
              purchaseCount: link.purchaseCount,
              purchaseAmountUsd: link.purchaseAmountUsd,
              subscriptionMonths: link.subscriptionMonths,
            })),
            firstSeenAt: updatedFan.firstSeenAt,
            lastActiveAt: lastTip > updatedFan.lastActiveAt ? lastTip : updatedFan.lastActiveAt,
            artistCity: user?.location,
          })

          await prisma.fan.update({
            where: { id: updatedFan.id },
            data: {
              stanScore: scoreResult.totalScore,
              tier: scoreResult.tier,
              convictionScore: scoreResult.convictionScore,
              platformScore: scoreResult.platformScore,
              engagementScore: scoreResult.engagementScore,
              longevityScore: scoreResult.longevityScore,
              recencyScore: scoreResult.recencyScore,
              lastActiveAt: lastTip > updatedFan.lastActiveAt ? lastTip : updatedFan.lastActiveAt,
              city: backer.city || updatedFan.city,
            },
          })
        }

        updatedCount++
      } else {
        // Create new fan
        const scoreResult = calculateStanScore({
          platformLinks: [{
            platform: Platform.DASHAM,
            tipCount: backer.tipCount,
            tipAmountUsd: backer.tipAmountUsd,
            tipFrequency,
            cityAffiliation: backer.city,
          }],
          firstSeenAt: firstTip,
          lastActiveAt: lastTip,
          artistCity: user?.location,
        })

        await prisma.fan.create({
          data: {
            userId,
            displayName: backer.displayName,
            email: backer.email,
            city: backer.city,
            stanScore: scoreResult.totalScore,
            tier: scoreResult.tier,
            convictionScore: scoreResult.convictionScore,
            platformScore: scoreResult.platformScore,
            engagementScore: scoreResult.engagementScore,
            longevityScore: scoreResult.longevityScore,
            recencyScore: scoreResult.recencyScore,
            firstSeenAt: firstTip,
            lastActiveAt: lastTip,
            platformLinks: {
              create: {
                platform: Platform.DASHAM,
                tipCount: backer.tipCount,
                tipAmountUsd: backer.tipAmountUsd,
                tipFrequency,
                cityAffiliation: backer.city,
                firstSeenAt: firstTip,
                lastActiveAt: lastTip,
              },
            },
          },
        })

        importedCount++
      }
    }

    // Update connection metadata
    const totalFanCount = await prisma.fan.count({
      where: {
        userId,
        platformLinks: { some: { platform: Platform.DASHAM } },
      },
    })

    await prisma.platformConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncAt: now,
        fanCount: totalFanCount,
        syncError: null,
      },
    })

    return NextResponse.json({
      success: true,
      imported: importedCount,
      updated: updatedCount,
      totalFans: totalFanCount,
      syncedAt: now.toISOString(),
    })
  } catch (error: any) {
    console.error('[Oryx Sync] Error:', error)
    return NextResponse.json(
      { error: 'Sync failed', message: error.message },
      { status: 500 }
    )
  }
}
