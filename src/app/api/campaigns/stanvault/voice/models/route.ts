import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const models = await prisma.savedVoiceModel.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
    })

    return NextResponse.json({ models })
  } catch (error) {
    console.error('Voice models GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as { modelId?: string }
    if (!body.modelId) {
      return NextResponse.json({ error: 'modelId is required' }, { status: 400 })
    }

    const selected = await prisma.savedVoiceModel.findFirst({
      where: { id: body.modelId, userId: session.user.id },
    })
    if (!selected) {
      return NextResponse.json({ error: 'Voice model not found' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.savedVoiceModel.updateMany({
        where: { userId: session.user.id, isActive: true },
        data: { isActive: false },
      }),
      prisma.savedVoiceModel.update({
        where: { id: selected.id },
        data: { isActive: true },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Voice models PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
