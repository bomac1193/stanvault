import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export interface ReferralLink {
  code: string
  fanUserId: string
  artistId: string
  url: string
  clicks: number
  conversions: number
  createdAt: Date
}

export interface ReferralStats {
  totalReferrals: number
  totalConversions: number
  conversionRate: number
  topReferrers: {
    fanId: string
    displayName: string
    referrals: number
    conversions: number
  }[]
  referralChain: {
    depth: number // How many "generations" of referrals
    totalReach: number // Total fans brought in through referrals
  }
}

// Generate a unique referral code for a fan
export async function createReferralLink(
  fanUserId: string,
  artistId: string
): Promise<string> {
  const code = randomBytes(6).toString('base64url')

  // We store referral links in a lightweight way using FanEvent metadata
  // Check if fan already has a referral code for this artist
  const existing = await prisma.fanEvent.findFirst({
    where: {
      fan: {
        fanUserLink: {
          fanUserId,
          artistId,
        },
      },
      eventType: 'MILESTONE_ENGAGEMENT',
      description: 'referral_link_created',
    },
  })

  if (existing?.metadata) {
    const meta = existing.metadata as { code?: string }
    if (meta.code) return meta.code
  }

  // Find the fan record linked to this fan user
  const link = await prisma.fanUserArtistLink.findUnique({
    where: {
      fanUserId_artistId: {
        fanUserId,
        artistId,
      },
    },
  })

  if (!link?.fanRecordId) {
    // Create the referral code even without a fan record link
    return code
  }

  // Store the referral code as a fan event
  await prisma.fanEvent.create({
    data: {
      fanId: link.fanRecordId,
      eventType: 'MILESTONE_ENGAGEMENT',
      description: 'referral_link_created',
      metadata: {
        code,
        artistId,
        fanUserId,
        clicks: 0,
        conversions: 0,
      },
    },
  })

  return code
}

// Track a referral click
export async function trackReferralClick(code: string): Promise<{
  valid: boolean
  artistId?: string
}> {
  const event = await prisma.fanEvent.findFirst({
    where: {
      eventType: 'MILESTONE_ENGAGEMENT',
      description: 'referral_link_created',
    },
  })

  if (!event?.metadata) {
    return { valid: false }
  }

  const meta = event.metadata as { code: string; artistId: string; clicks: number }
  if (meta.code !== code) {
    return { valid: false }
  }

  // Increment click count
  await prisma.fanEvent.update({
    where: { id: event.id },
    data: {
      metadata: {
        ...meta,
        clicks: (meta.clicks || 0) + 1,
      },
    },
  })

  return { valid: true, artistId: meta.artistId }
}

// Track a successful referral conversion
export async function trackReferralConversion(
  code: string,
  newFanUserId: string
): Promise<boolean> {
  const event = await prisma.fanEvent.findFirst({
    where: {
      eventType: 'MILESTONE_ENGAGEMENT',
      description: 'referral_link_created',
    },
  })

  if (!event?.metadata) return false

  const meta = event.metadata as {
    code: string
    artistId: string
    conversions: number
    convertedFans?: string[]
  }

  if (meta.code !== code) return false

  // Prevent duplicate conversions
  if (meta.convertedFans?.includes(newFanUserId)) return false

  // Record conversion
  await prisma.fanEvent.update({
    where: { id: event.id },
    data: {
      metadata: {
        ...meta,
        conversions: (meta.conversions || 0) + 1,
        convertedFans: [...(meta.convertedFans || []), newFanUserId],
      },
    },
  })

  return true
}

// Get referral stats for an artist
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const referralEvents = await prisma.fanEvent.findMany({
    where: {
      fan: {
        userId,
      },
      eventType: 'MILESTONE_ENGAGEMENT',
      description: 'referral_link_created',
    },
    include: {
      fan: {
        select: { id: true, displayName: true },
      },
    },
  })

  let totalReferrals = 0
  let totalConversions = 0
  const referrerMap = new Map<string, { displayName: string; referrals: number; conversions: number }>()

  for (const event of referralEvents) {
    const meta = event.metadata as { clicks?: number; conversions?: number } | null
    const clicks = meta?.clicks || 0
    const conversions = meta?.conversions || 0

    totalReferrals += clicks
    totalConversions += conversions

    const fanId = event.fan.id
    const existing = referrerMap.get(fanId) || {
      displayName: event.fan.displayName,
      referrals: 0,
      conversions: 0,
    }

    existing.referrals += clicks
    existing.conversions += conversions
    referrerMap.set(fanId, existing)
  }

  const topReferrers = Array.from(referrerMap.entries())
    .map(([fanId, data]) => ({ fanId, ...data }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 10)

  return {
    totalReferrals,
    totalConversions,
    conversionRate: totalReferrals > 0 ? totalConversions / totalReferrals : 0,
    topReferrers,
    referralChain: {
      depth: 1, // For MVP, single-depth referrals
      totalReach: totalConversions,
    },
  }
}
