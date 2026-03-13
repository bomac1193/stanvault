import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Platform } from '@prisma/client'

const VALID_PLATFORMS: Platform[] = ['SPOTIFY', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER', 'EMAIL']

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = await params
    const platformUpper = platform.toUpperCase() as Platform

    if (!VALID_PLATFORMS.includes(platformUpper)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    return NextResponse.json({
      error:
        `${platformUpper} does not use mock fan generation anymore. Use a real platform integration or email import.`,
    }, { status: 501 })
  } catch (error) {
    console.error('Platform connection error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = await params
    const platformUpper = platform.toUpperCase() as Platform

    await prisma.platformConnection.delete({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: platformUpper,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Platform disconnect error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
