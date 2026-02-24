import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: {
    presetId: string
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preset = await prisma.campaignVariablePreset.findUnique({
      where: { id: context.params.presetId },
      select: { id: true, userId: true },
    })

    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    if (preset.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.campaignVariablePreset.delete({
      where: { id: preset.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Campaign preset delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
