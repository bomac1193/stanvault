import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fanId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fanId } = await params

    // Check fan belongs to user
    const fan = await prisma.fan.findFirst({
      where: {
        id: fanId,
        userId: session.user.id,
      },
    })

    if (!fan) {
      return NextResponse.json({ error: 'Fan not found' }, { status: 404 })
    }

    const events = await prisma.fanEvent.findMany({
      where: { fanId },
      orderBy: { occurredAt: 'desc' },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Fan events fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
