import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFanUser } from '@/lib/fan-auth/service'

export async function PATCH(request: Request) {
  const user = await getFanUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { avatarUrl } = await request.json()

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return NextResponse.json({ error: 'avatarUrl is required' }, { status: 400 })
    }

    // Validate it's a data URL or a proper URL
    if (!avatarUrl.startsWith('data:image/') && !avatarUrl.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
    }

    // Cap at ~500KB for data URLs stored in DB
    if (avatarUrl.startsWith('data:') && avatarUrl.length > 500_000) {
      return NextResponse.json({ error: 'Image too large' }, { status: 400 })
    }

    await prisma.fanUser.update({
      where: { id: user.id },
      data: { avatarUrl },
    })

    return NextResponse.json({ success: true, avatarUrl })
  } catch (error) {
    console.error('Avatar update error:', error)
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 })
  }
}
