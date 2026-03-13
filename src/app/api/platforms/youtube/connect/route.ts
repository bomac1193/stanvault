import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Platform } from '@prisma/client'

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.platformConnection.delete({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: Platform.YOUTUBE,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('YouTube disconnect error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
