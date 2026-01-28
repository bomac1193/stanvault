import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/settings/profile - Update artist profile
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { artistName, spotifyArtistId } = body

  // Validate Spotify Artist ID format if provided
  if (spotifyArtistId && !/^[a-zA-Z0-9]{22}$/.test(spotifyArtistId)) {
    return NextResponse.json(
      { error: 'Invalid Spotify Artist ID format. Should be 22 characters.' },
      { status: 400 }
    )
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      artistName: artistName || null,
      spotifyArtistId: spotifyArtistId || null,
    },
    select: {
      id: true,
      artistName: true,
      spotifyArtistId: true,
    },
  })

  return NextResponse.json({ user: updated })
}
