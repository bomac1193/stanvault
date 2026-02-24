import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { tierPolicies } from '@/lib/campaign-entitlements'

function getEchoniqApiUrl(): string {
  return process.env.ECHONIQ_API_URL || 'http://localhost:3004'
}

export async function POST(request: NextRequest) {
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
    if (!policy.allowVoiceCampaigns) {
      return NextResponse.json(
        {
          error: `Voice cloning is not available on ${user.pricingTier}.`,
          entitlements: {
            pricingTier: user.pricingTier,
            ...policy,
          },
        },
        { status: 402 }
      )
    }

    const incoming = await request.formData()
    const audio = incoming.get('audio')
    if (!(audio instanceof File)) {
      return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 })
    }

    const form = new FormData()
    form.append('audio', audio, audio.name || 'voice-sample.webm')

    const name = incoming.get('name')
    if (typeof name === 'string' && name.trim().length > 0) {
      form.append('name', name.trim())
    }

    const description = incoming.get('description')
    if (typeof description === 'string' && description.trim().length > 0) {
      form.append('description', description.trim())
    }

    const duration = incoming.get('duration')
    if (typeof duration === 'string' && duration.trim().length > 0) {
      form.append('duration', duration.trim())
    }

    const provider = incoming.get('provider')
    if (typeof provider === 'string' && provider.trim().length > 0) {
      if (!policy.allowedVoiceProviders.includes(provider as 'fish-audio' | 'resemble-ai' | 'chatterbox')) {
        return NextResponse.json(
          {
            error: `${provider} is not available on ${user.pricingTier}.`,
            entitlements: {
              pricingTier: user.pricingTier,
              ...policy,
            },
          },
          { status: 402 }
        )
      }
      form.append('provider', provider.trim())
    }

    const response = await fetch(`${getEchoniqApiUrl()}/api/voice/clone`, {
      method: 'POST',
      headers: {
        'X-Stanvault-User-Id': session.user.id,
        'X-Stanvault-Tier': user.pricingTier,
      },
      body: form,
      cache: 'no-store',
    })

    const text = await response.text()
    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Echoniq voice clone failed',
          status: response.status,
          details: text,
        },
        { status: 502 }
      )
    }

    const data = JSON.parse(text) as {
      id?: string
      externalId?: string
      provider?: 'fish-audio' | 'resemble-ai' | 'chatterbox'
      name?: string
      previewUrl?: string
    }

    if (data.provider && !policy.allowedVoiceProviders.includes(data.provider)) {
      return NextResponse.json(
        {
          error: `${data.provider} voice model is not available on ${user.pricingTier}.`,
          entitlements: {
            pricingTier: user.pricingTier,
            ...policy,
          },
        },
        { status: 402 }
      )
    }

    if (data.externalId && data.provider) {
      await prisma.$transaction([
        prisma.savedVoiceModel.updateMany({
          where: { userId: session.user.id, isActive: true },
          data: { isActive: false },
        }),
        prisma.savedVoiceModel.upsert({
          where: {
            userId_externalId: {
              userId: session.user.id,
              externalId: data.externalId,
            },
          },
          create: {
            userId: session.user.id,
            externalId: data.externalId,
            provider: data.provider,
            name: data.name || 'Echoniq Voice',
            previewUrl: data.previewUrl || null,
            isActive: true,
            source: 'stanvault_clone',
          },
          update: {
            provider: data.provider,
            name: data.name || 'Echoniq Voice',
            previewUrl: data.previewUrl || null,
            isActive: true,
            source: 'stanvault_clone',
          },
        }),
      ])
    }

    return NextResponse.json({
      ...data,
      entitlements: {
        pricingTier: user.pricingTier,
        ...policy,
      },
    })
  } catch (error) {
    console.error('Stanvault voice clone proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
