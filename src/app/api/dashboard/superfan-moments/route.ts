import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ADMIN_PREVIEW_COOKIE, isAdminEmail, resolveAdminPreviewMode } from '@/lib/admin'
import { buildDemoMoments } from '@/lib/admin-preview/demo-data'

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
        moments: buildDemoMoments(),
      })
    }

    // Single query: Core fans + fans becoming Core + Strong fans approaching Core
    const events = await prisma.fanEvent.findMany({
      where: {
        fan: { userId: session.user.id },
        OR: [
          { eventType: 'BECAME_SUPERFAN' },
          {
            fan: { tier: { in: ['SUPERFAN', 'DEDICATED'] } },
            eventType: {
              in: ['TIER_UPGRADE', 'MILESTONE_STREAMS', 'MILESTONE_ENGAGEMENT'],
            },
          },
        ],
      },
      include: {
        fan: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            tier: true,
            stanScore: true,
            platformLinks: {
              select: {
                platform: true,
                streams: true,
                saves: true,
                shares: true,
                likes: true,
                comments: true,
                follows: true,
                emailOpens: true,
                tipCount: true,
                tipAmountUsd: true,
              },
            },
          },
        },
        acknowledgment: {
          select: {
            status: true,
            sentAt: true,
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
      take: 10,
    })

    const moments = events.map((event) => {
      const links = event.fan.platformLinks
      const reason = buildReason(event.description, event.eventType, event.platform, links)

      return {
        id: event.id,
        type: event.eventType,
        description: event.description,
        reason,
        platform: event.platform,
        occurredAt: event.occurredAt,
        fan: {
          id: event.fan.id,
          name: event.fan.displayName,
          avatar: event.fan.avatarUrl,
          tier: event.fan.tier,
          score: event.fan.stanScore,
        },
        ackStatus: event.acknowledgment?.status || null,
        ackSentAt: event.acknowledgment?.sentAt || null,
      }
    })

    return NextResponse.json({ previewMode, moments })
  } catch (error) {
    console.error('Superfan moments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Build a human-readable reason from platform stats when the stored description is generic. */
function buildReason(
  description: string | null,
  eventType: string,
  platform: string | null,
  links: Array<{
    platform: string
    streams: number | null
    saves: number | null
    shares: number | null
    likes: number | null
    comments: number | null
    follows: boolean | null
    emailOpens: number | null
    tipCount: number | null
    tipAmountUsd: number | null
  }>
): string {
  // If the stored description already has specifics (not just "Upgraded to X tier"), use it
  const generic = /^(upgraded|achieved|became|downgraded)/i
  if (description && !generic.test(description.trim())) {
    return description
  }

  // Collect stats with a weight so we surface the most impressive ones first
  const stats: Array<{ label: string; weight: number }> = []

  for (const link of links) {
    const p = link.platform.toLowerCase()
    if (link.tipCount && link.tipCount > 0)
      stats.push({ label: `${link.tipCount} tip${link.tipCount > 1 ? 's' : ''}${link.tipAmountUsd ? ` ($${link.tipAmountUsd.toFixed(0)})` : ''}`, weight: 100 })
    if (link.streams && link.streams > 0)
      stats.push({ label: `${link.streams.toLocaleString()} ${p} streams`, weight: link.streams })
    if (link.saves && link.saves > 0)
      stats.push({ label: `${link.saves} saves`, weight: link.saves * 3 })
    if (link.shares && link.shares > 0)
      stats.push({ label: `${link.shares} shares`, weight: link.shares * 5 })
    if (link.likes && link.likes > 0)
      stats.push({ label: `${link.likes} ${p} likes`, weight: link.likes })
    if (link.comments && link.comments > 0)
      stats.push({ label: `${link.comments} comments`, weight: link.comments * 4 })
    if (link.emailOpens && link.emailOpens > 0)
      stats.push({ label: `${link.emailOpens} emails opened`, weight: link.emailOpens * 2 })
  }

  // Sort by weight descending, take top 2
  stats.sort((a, b) => b.weight - a.weight)

  if (stats.length > 0) {
    const top = stats.slice(0, 2).map((s) => s.label).join(', ')
    if (links.length > 1) return `${top} across ${links.length} platforms`
    return top
  }

  // Followers-only fan
  const followCount = links.filter((l) => l.follows).length
  if (followCount > 0) {
    return `Following on ${followCount} platform${followCount > 1 ? 's' : ''}`
  }

  if (platform) {
    return `Activity on ${platform.toLowerCase()}`
  }

  return eventType === 'BECAME_SUPERFAN' ? 'Reached Core' : 'Tier change'
}
