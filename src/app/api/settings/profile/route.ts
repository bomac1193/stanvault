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

  // Resolve user — fall back to email if JWT has stale ID
  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, artistName: true, spotifyArtistId: true, pricingTier: true, email: true },
  })
  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, artistName: true, spotifyArtistId: true, pricingTier: true, email: true },
    })
  }

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

  // Resolve the actual DB user — JWT may have a stale ID after DB reset
  let userId = session.user.id
  const userById = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!userById && session.user.email) {
    const userByEmail = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (userByEmail) {
      userId = userByEmail.id
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
  }

  const body = await req.json()
  const { artistName, spotifyArtistId, pricingTier, image, email } = body

  // Validate image if provided
  if (image !== undefined && image !== null) {
    if (typeof image !== 'string') {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
    }
    if (!image.startsWith('data:image/') && !image.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
    }
    if (image.startsWith('data:') && image.length > 2_000_000) {
      return NextResponse.json({ error: 'Image too large (max 1.5MB)' }, { status: 400 })
    }
  }

  // Validate email if provided
  if (email !== undefined && email !== null && email !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
  }

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

  // Only update fields that were explicitly sent in the request
  const data: Record<string, unknown> = {}
  if (artistName !== undefined) data.artistName = artistName || null
  if (spotifyArtistId !== undefined) data.spotifyArtistId = spotifyArtistId || null
  if (parsedTier) data.pricingTier = parsedTier
  if (image !== undefined) data.image = image || null
  if (email !== undefined && email !== null && email !== '') data.email = email

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        artistName: true,
        email: true,
        spotifyArtistId: true,
        pricingTier: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (err: unknown) {
    console.error('Profile update error:', err)
    const message = err instanceof Error ? err.message : 'Failed to update profile'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
