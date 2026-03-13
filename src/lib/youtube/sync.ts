import { prisma } from '@/lib/prisma'
import { calculateStanScore } from '@/lib/scoring/stan-score'
import { recordFanEvent } from '@/lib/events'
import { EventType, Platform } from '@prisma/client'
import { YOUTUBE_CONFIG } from './config'

interface YouTubeThumbnailMap {
  default?: { url?: string }
  medium?: { url?: string }
  high?: { url?: string }
}

interface YouTubeSubscriptionItem {
  id: string
  snippet?: {
    publishedAt?: string
  }
  subscriberSnippet?: {
    title?: string
    description?: string
    channelId?: string
    thumbnails?: YouTubeThumbnailMap
  }
}

interface YouTubeSubscribersResponse {
  nextPageToken?: string
  items?: YouTubeSubscriptionItem[]
}

interface ImportedSubscriberResult {
  importedCount: number
  updatedCount: number
  publicSubscriberCount: number
}

function getThumbnailUrl(thumbnails?: YouTubeThumbnailMap): string | null {
  return thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || null
}

function mapLinksForScoring(
  links: Array<{
    platform: Platform
    streams: number | null
    playlistAdds: number | null
    saves: number | null
    follows: boolean | null
    likes: number | null
    comments: number | null
    shares: number | null
    subscribed: boolean | null
    videoViews: number | null
    watchTime: number | null
    emailOpens: number | null
    emailClicks: number | null
    tipCount: number | null
    tipAmountUsd: number | null
    tipFrequency: number | null
    momentSaves: number | null
    cityAffiliation: string | null
    purchaseCount: number | null
    purchaseAmountUsd: number | null
    subscriptionMonths: number | null
  }>
) {
  return links.map((link) => ({
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
  }))
}

async function recalculateFanScore(fanId: string) {
  const fan = await prisma.fan.findUnique({
    where: { id: fanId },
    include: { platformLinks: true },
  })

  if (!fan) return

  const scoreResult = calculateStanScore({
    platformLinks: mapLinksForScoring(fan.platformLinks),
    firstSeenAt: fan.firstSeenAt,
    lastActiveAt: fan.lastActiveAt,
  })

  await prisma.fan.update({
    where: { id: fanId },
    data: {
      stanScore: scoreResult.totalScore,
      tier: scoreResult.tier,
      convictionScore: scoreResult.convictionScore,
      platformScore: scoreResult.platformScore,
      engagementScore: scoreResult.engagementScore,
      longevityScore: scoreResult.longevityScore,
      recencyScore: scoreResult.recencyScore,
    },
  })
}

export async function fetchYouTubeSubscribers(accessToken: string): Promise<YouTubeSubscriptionItem[]> {
  const subscribers: YouTubeSubscriptionItem[] = []
  let pageToken: string | undefined
  let pagesFetched = 0

  do {
    const params = new URLSearchParams({
      part: 'snippet,subscriberSnippet',
      mySubscribers: 'true',
      maxResults: '50',
    })

    if (pageToken) {
      params.set('pageToken', pageToken)
    }

    const response = await fetch(`${YOUTUBE_CONFIG.apiBaseUrl}/subscriptions?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to fetch YouTube subscribers: ${error}`)
    }

    const data = (await response.json()) as YouTubeSubscribersResponse
    subscribers.push(...(data.items || []))
    pageToken = data.nextPageToken
    pagesFetched += 1
  } while (pageToken && pagesFetched < 10)

  return subscribers
}

export async function syncYouTubeSubscribers(
  userId: string,
  accessToken: string
): Promise<ImportedSubscriberResult> {
  const subscribers = await fetchYouTubeSubscribers(accessToken)

  let importedCount = 0
  let updatedCount = 0

  for (const subscription of subscribers) {
    const subscriberChannelId = subscription.subscriberSnippet?.channelId
    const displayName = subscription.subscriberSnippet?.title?.trim()

    if (!subscriberChannelId || !displayName) {
      continue
    }

    const subscribedAt = subscription.snippet?.publishedAt
      ? new Date(subscription.snippet.publishedAt)
      : new Date()
    const avatarUrl = getThumbnailUrl(subscription.subscriberSnippet?.thumbnails)
    const now = new Date()

    const existingLink = await prisma.fanPlatformLink.findFirst({
      where: {
        platform: Platform.YOUTUBE,
        platformFanId: subscriberChannelId,
        fan: { userId },
      },
      include: { fan: true },
    })

    if (existingLink) {
      await prisma.fan.update({
        where: { id: existingLink.fan.id },
        data: {
          displayName,
          avatarUrl: avatarUrl || existingLink.fan.avatarUrl,
          lastActiveAt: now,
        },
      })

      await prisma.fanPlatformLink.update({
        where: { id: existingLink.id },
        data: {
          subscribed: true,
          lastActiveAt: now,
        },
      })

      await recalculateFanScore(existingLink.fan.id)
      updatedCount += 1
      continue
    }

    const scoreResult = calculateStanScore({
      platformLinks: [
        {
          platform: Platform.YOUTUBE,
          subscribed: true,
        },
      ],
      firstSeenAt: subscribedAt,
      lastActiveAt: now,
    })

    const fan = await prisma.fan.create({
      data: {
        userId,
        displayName,
        avatarUrl,
        notes: 'Imported from YouTube public subscribers',
        stanScore: scoreResult.totalScore,
        tier: scoreResult.tier,
        convictionScore: scoreResult.convictionScore,
        platformScore: scoreResult.platformScore,
        engagementScore: scoreResult.engagementScore,
        longevityScore: scoreResult.longevityScore,
        recencyScore: scoreResult.recencyScore,
        firstSeenAt: subscribedAt,
        lastActiveAt: now,
        platformLinks: {
          create: {
            platform: Platform.YOUTUBE,
            platformFanId: subscriberChannelId,
            subscribed: true,
            firstSeenAt: subscribedAt,
            lastActiveAt: now,
          },
        },
      },
    })

    await recordFanEvent({
      fanId: fan.id,
      eventType: EventType.FIRST_FOLLOW,
      platform: Platform.YOUTUBE,
      description: 'Imported from YouTube public subscribers',
      metadata: {
        youtubeChannelId: subscriberChannelId,
        source: 'youtube_public_subscribers',
      },
      occurredAt: subscribedAt,
    })

    importedCount += 1
  }

  return {
    importedCount,
    updatedCount,
    publicSubscriberCount: subscribers.length,
  }
}
