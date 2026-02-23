import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PricingTier } from '@prisma/client'

function canOverrideTier(email?: string | null): boolean {
  if (process.env.ENABLE_PRICING_TIER_OVERRIDE === 'true') return true
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
  if (!email) return false
  return admins.includes(email.toLowerCase())
}

function parsePricingTier(value: unknown): PricingTier | null {
  if (value === 'STARTER') return 'STARTER'
  if (value === 'PRIVATE_CIRCLE') return 'PRIVATE_CIRCLE'
  if (value === 'PATRON_GROWTH') return 'PATRON_GROWTH'
  if (value === 'SOVEREIGN') return 'SOVEREIGN'
  return null
}

// GET /api/settings/profile - Current artist settings
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      artistName: true,
      spotifyArtistId: true,
      pricingTier: true,
      email: true,
    },
  })

  return NextResponse.json({
    user,
    controls: {
      canOverrideTier: canOverrideTier(session.user.email),
    },
  })
}

// PATCH /api/settings/profile - Update artist profile
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { artistName, spotifyArtistId, pricingTier } = body

  // Validate Spotify Artist ID format if provided
  if (spotifyArtistId && !/^[a-zA-Z0-9]{22}$/.test(spotifyArtistId)) {
    return NextResponse.json(
      { error: 'Invalid Spotify Artist ID format. Should be 22 characters.' },
      { status: 400 }
    )
  }

  const parsedTier = parsePricingTier(pricingTier)
  if (pricingTier && !parsedTier) {
    return NextResponse.json({ error: 'Invalid pricing tier.' }, { status: 400 })
  }

  if (parsedTier && !canOverrideTier(session.user.email)) {
    return NextResponse.json(
      { error: 'Tier override is disabled for this account.' },
      { status: 403 }
    )
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      artistName: artistName || null,
      spotifyArtistId: spotifyArtistId || null,
      ...(parsedTier ? { pricingTier: parsedTier } : {}),
    },
    select: {
      id: true,
      artistName: true,
      spotifyArtistId: true,
      pricingTier: true,
    },
  })

  return NextResponse.json({ user: updated })
}
