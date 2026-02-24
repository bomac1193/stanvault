import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FanTier, Prisma } from '@prisma/client'
import { tierPolicies } from '@/lib/campaign-entitlements'

const requestSchema = z.object({
  artistName: z.string().optional(),
  artistId: z.string().optional(),
  subject: z.string().min(1).max(200).optional(),
  fromEmail: z.string().min(3).max(320).optional(),
  replyTo: z.string().email().optional(),
  fanClubName: z.string().min(1).max(120).optional(),
  customVariables: z.record(z.union([z.string(), z.number()])).optional(),
  messageTemplate: z.string().min(1).max(5000),
  minStanScore: z.number().int().min(0).max(100).optional(),
  minTier: z.enum(['CASUAL', 'ENGAGED', 'DEDICATED', 'SUPERFAN']).optional(),
  limit: z.number().int().min(1).max(1000).optional(),
  mood: z.string().optional(),
  deliveryMode: z.enum(['TEXT', 'VOICE']).optional(),
  voiceConfigMode: z.enum(['SIMPLE', 'ADVANCED']).optional(),
  voiceModelId: z.string().min(1).max(200).optional(),
  voiceProvider: z.enum(['fish-audio', 'resemble-ai', 'chatterbox']).optional(),
  voiceStyle: z.enum(['natural', 'whisper', 'singing', 'shouting']).optional(),
  voiceEmotion: z.enum(['neutral', 'grateful', 'excited', 'playful', 'heartfelt']).optional(),
  voiceCtaLabel: z.string().min(1).max(120).optional(),
  ctaKey: z.string().max(80).optional(),
  ctaLabel: z.string().max(120).optional(),
  ctaDeadline: z.string().max(80).optional(),
  ctaProofInstruction: z.string().max(240).optional(),
  testOnly: z.boolean().optional(),
  testRecipientEmail: z.string().email().optional(),
  dryRun: z.boolean().optional(),
})

function getEchoniqApiUrl(): string {
  return process.env.ECHONIQ_API_URL || 'http://localhost:3004'
}

type EchoniqCampaignResponse = {
  campaignId?: string
  status?: string
  dispatch?: {
    mode?: string
    provider?: string
    subject?: string
    deliveryMode?: 'TEXT' | 'VOICE'
    voiceProvider?: string
    testOnly?: boolean
  }
  totals?: {
    segmentCount?: number
    queuedRecipients?: number
    skippedNoEmail?: number
    sent?: number
    failed?: number
    previewOnly?: number
  }
  reliability?: {
    retries?: number
    timedOutAttempts?: number
    providerErrors?: number
  }
}

async function callEchoniqCampaign(body: Record<string, unknown>) {
  const response = await fetch(`${getEchoniqApiUrl()}/api/campaigns/stanvault/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Stanvault-User-Id': String(body.artistId || ''),
      'X-Stanvault-Tier': String(body.pricingTier || ''),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const responseText = await response.text()
  return {
    ok: response.ok,
    status: response.status,
    responseText,
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)

    const runs = await prisma.campaignRun.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: Number.isNaN(limit) ? 20 : limit,
    })

    return NextResponse.json({ runs })
  } catch (error) {
    console.error('Stanvault campaign history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = requestSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          issues: payload.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        artistName: true,
        name: true,
        pricingTier: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Artist account not found' }, { status: 404 })
    }

    const tierPolicy = tierPolicies[user.pricingTier]
    const customVariablesCount = Object.keys(payload.data.customVariables || {}).length

    if (customVariablesCount > tierPolicy.maxCustomVariables) {
      return NextResponse.json(
        {
          error: `Your ${user.pricingTier} tier supports up to ${tierPolicy.maxCustomVariables} custom variables per campaign.`,
          entitlements: {
            pricingTier: user.pricingTier,
            ...tierPolicy,
          },
        },
        { status: 402 }
      )
    }

    if (payload.data.fromEmail && !tierPolicy.allowCustomFromEmail) {
      return NextResponse.json(
        {
          error: 'Custom fromEmail is available on Patron Growth and Sovereign tiers.',
          entitlements: {
            pricingTier: user.pricingTier,
            ...tierPolicy,
          },
        },
        { status: 402 }
      )
    }

    if (payload.data.deliveryMode === 'VOICE' && !tierPolicy.allowVoiceCampaigns) {
      return NextResponse.json(
        {
          error: `Voice campaigns are not available on ${user.pricingTier}.`,
          entitlements: {
            pricingTier: user.pricingTier,
            ...tierPolicy,
          },
        },
        { status: 402 }
      )
    }

    if (payload.data.deliveryMode === 'VOICE' && !payload.data.voiceModelId) {
      return NextResponse.json(
        {
          error: 'voiceModelId is required for VOICE delivery mode.',
        },
        { status: 400 }
      )
    }

    if (
      payload.data.deliveryMode === 'VOICE' &&
      payload.data.voiceConfigMode === 'ADVANCED' &&
      !tierPolicy.allowAdvancedVoiceConfig
    ) {
      return NextResponse.json(
        {
          error: `Advanced voice configuration is not available on ${user.pricingTier}.`,
          entitlements: {
            pricingTier: user.pricingTier,
            ...tierPolicy,
          },
        },
        { status: 402 }
      )
    }

    const effectiveVoiceProvider = payload.data.voiceProvider || 'fish-audio'
    if (
      payload.data.deliveryMode === 'VOICE' &&
      !tierPolicy.allowedVoiceProviders.includes(effectiveVoiceProvider)
    ) {
      return NextResponse.json(
        {
          error: `${effectiveVoiceProvider} is not available on ${user.pricingTier}.`,
          entitlements: {
            pricingTier: user.pricingTier,
            ...tierPolicy,
          },
        },
        { status: 402 }
      )
    }

    if (payload.data.testOnly && !session.user.email) {
      return NextResponse.json(
        {
          error: 'No email on your account. Add one in profile before using Test Voice to Me.',
        },
        { status: 400 }
      )
    }

    const body = {
      ...payload.data,
      pricingTier: user.pricingTier,
      artistId: payload.data.artistId || user.id,
      artistName: payload.data.artistName || user.artistName || user.name || undefined,
      testRecipientEmail:
        payload.data.testOnly && session.user.email ? session.user.email : payload.data.testRecipientEmail,
    }

    if (payload.data.deliveryMode === 'VOICE' && payload.data.ctaDeadline && !payload.data.ctaProofInstruction) {
      return NextResponse.json(
        {
          error: 'CTA proof instruction is required when CTA deadline is set for voice campaigns.',
        },
        { status: 400 }
      )
    }

    // Preflight for recipient count and render checks
    const preflightBody = {
      ...body,
      dryRun: true,
    }
    const preflight = await callEchoniqCampaign(preflightBody)
    if (!preflight.ok) {
      await prisma.campaignRun.create({
        data: {
          userId: user.id,
          status: 'failed',
          subject: payload.data.subject || null,
          messageTemplate: payload.data.messageTemplate,
          minTier: (payload.data.minTier as FanTier | undefined) || null,
          minStanScore: payload.data.minStanScore || null,
          recipientLimit: payload.data.limit || null,
          dryRun: true,
          errorMessage: `Echoniq preflight returned ${preflight.status}: ${preflight.responseText}`,
          requestPayload: body as unknown as Prisma.JsonValue,
        },
      })

      return NextResponse.json(
        {
          error: 'Echoniq campaign preflight failed',
          status: preflight.status,
          details: preflight.responseText,
        },
        { status: 502 }
      )
    }

    const preflightData = JSON.parse(preflight.responseText) as EchoniqCampaignResponse
    const plannedRecipients = preflightData.totals?.queuedRecipients || 0
    const isTestOnly = Boolean(payload.data.testOnly)

    // If this is a dry run request, return preflight response and persist it.
    if (payload.data.dryRun ?? true) {
      await prisma.campaignRun.create({
        data: {
          userId: user.id,
          externalCampaignId: preflightData.campaignId || null,
          status: preflightData.status || 'queued',
          dispatchMode: preflightData.dispatch?.mode || 'preview_only',
          provider: preflightData.dispatch?.provider || null,
          subject: preflightData.dispatch?.subject || payload.data.subject || null,
          messageTemplate: payload.data.messageTemplate,
          minTier: (payload.data.minTier as FanTier | undefined) || null,
          minStanScore: payload.data.minStanScore || null,
          recipientLimit: payload.data.limit || null,
          dryRun: true,
          segmentCount: preflightData.totals?.segmentCount || 0,
          queuedRecipients: preflightData.totals?.queuedRecipients || 0,
          skippedNoEmail: preflightData.totals?.skippedNoEmail || 0,
          sentCount: preflightData.totals?.sent || 0,
          voiceSentCount: payload.data.deliveryMode === 'VOICE' ? preflightData.totals?.sent || 0 : 0,
          failedCount: preflightData.totals?.failed || 0,
          previewOnlyCount: preflightData.totals?.previewOnly || 0,
          requestPayload: body as unknown as Prisma.JsonValue,
          responsePayload: preflightData as unknown as Prisma.JsonValue,
        },
      })

      return NextResponse.json({
        ...preflightData,
        entitlements: {
          pricingTier: user.pricingTier,
          ...tierPolicy,
        },
      })
    }

    // Enforce monthly live-send limits by tier
    const monthStart = new Date()
    monthStart.setUTCDate(1)
    monthStart.setUTCHours(0, 0, 0, 0)
    const monthAggregate = await prisma.campaignRun.aggregate({
      where: {
        userId: user.id,
        dryRun: false,
        createdAt: { gte: monthStart },
      },
      _sum: {
        sentCount: true,
        voiceSentCount: true,
      },
    })
    const monthSentSoFar = monthAggregate._sum.sentCount || 0
    const monthVoiceSentSoFar = monthAggregate._sum.voiceSentCount || 0
    const isVoiceCampaign = payload.data.deliveryMode === 'VOICE'

    if (
      !isTestOnly &&
      tierPolicy.monthlyLiveSendLimit !== null &&
      monthSentSoFar + plannedRecipients > tierPolicy.monthlyLiveSendLimit
    ) {
      return NextResponse.json(
        {
          error: `Monthly live send cap exceeded for ${user.pricingTier}.`,
          limits: {
            monthlyLiveSendLimit: tierPolicy.monthlyLiveSendLimit,
            monthSentSoFar,
            plannedRecipients,
            remaining: Math.max(tierPolicy.monthlyLiveSendLimit - monthSentSoFar, 0),
          },
          entitlements: {
            pricingTier: user.pricingTier,
            ...tierPolicy,
          },
        },
        { status: 402 }
      )
    }

    if (
      !isTestOnly &&
      isVoiceCampaign &&
      tierPolicy.monthlyVoiceSendLimit !== null &&
      monthVoiceSentSoFar + plannedRecipients > tierPolicy.monthlyVoiceSendLimit
    ) {
      return NextResponse.json(
        {
          error: `Monthly voice send cap exceeded for ${user.pricingTier}.`,
          limits: {
            monthlyVoiceSendLimit: tierPolicy.monthlyVoiceSendLimit,
            monthVoiceSentSoFar,
            plannedRecipients,
            remaining: Math.max(tierPolicy.monthlyVoiceSendLimit - monthVoiceSentSoFar, 0),
          },
          entitlements: {
            pricingTier: user.pricingTier,
            ...tierPolicy,
          },
        },
        { status: 402 }
      )
    }

    const liveBody = {
      ...body,
      dryRun: false,
    }
    const liveResponse = await callEchoniqCampaign(liveBody)
    if (!liveResponse.ok) {
      await prisma.campaignRun.create({
        data: {
          userId: user.id,
          status: 'failed',
          subject: payload.data.subject || null,
          messageTemplate: payload.data.messageTemplate,
          minTier: (payload.data.minTier as FanTier | undefined) || null,
          minStanScore: payload.data.minStanScore || null,
          recipientLimit: payload.data.limit || null,
          dryRun: false,
          errorMessage: `Echoniq live send returned ${liveResponse.status}: ${liveResponse.responseText}`,
          requestPayload: liveBody as unknown as Prisma.JsonValue,
        },
      })

      return NextResponse.json(
        {
          error: 'Echoniq campaign live send failed',
          status: liveResponse.status,
          details: liveResponse.responseText,
        },
        { status: 502 }
      )
    }

    const data = JSON.parse(liveResponse.responseText) as EchoniqCampaignResponse

    await prisma.campaignRun.create({
      data: {
        userId: user.id,
        externalCampaignId: data.campaignId || null,
        status: data.status || 'unknown',
        dispatchMode: data.dispatch?.mode || null,
        provider: data.dispatch?.provider || null,
        subject: data.dispatch?.subject || payload.data.subject || null,
        messageTemplate: payload.data.messageTemplate,
        minTier: (payload.data.minTier as FanTier | undefined) || null,
        minStanScore: payload.data.minStanScore || null,
        recipientLimit: payload.data.limit || null,
        dryRun: payload.data.dryRun ?? true,
        segmentCount: data.totals?.segmentCount || 0,
        queuedRecipients: data.totals?.queuedRecipients || 0,
        skippedNoEmail: data.totals?.skippedNoEmail || 0,
        sentCount: data.totals?.sent || 0,
        voiceSentCount: payload.data.deliveryMode === 'VOICE' ? data.totals?.sent || 0 : 0,
        failedCount: data.totals?.failed || 0,
        previewOnlyCount: data.totals?.previewOnly || 0,
        requestPayload: liveBody as unknown as Prisma.JsonValue,
        responsePayload: data as unknown as Prisma.JsonValue,
      },
    })

    return NextResponse.json({
      ...data,
      entitlements: {
        pricingTier: user.pricingTier,
        ...tierPolicy,
      },
    })
  } catch (error) {
    console.error('Stanvault campaign proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
