import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

const createPresetSchema = z.object({
  name: z.string().min(1).max(80),
  fanClubName: z.string().max(120).optional(),
  customVariables: z.record(z.union([z.string(), z.number()])).default({}),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const presets = await prisma.campaignVariablePreset.findMany({
      where: { userId: session.user.id },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ presets })
  } catch (error) {
    console.error('Campaign presets fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = createPresetSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          issues: payload.error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      )
    }

    const preset = await prisma.campaignVariablePreset.upsert({
      where: {
        userId_name: {
          userId: session.user.id,
          name: payload.data.name.trim(),
        },
      },
      update: {
        fanClubName: payload.data.fanClubName || null,
        customVariables: payload.data.customVariables as unknown as Prisma.JsonValue,
      },
      create: {
        userId: session.user.id,
        name: payload.data.name.trim(),
        fanClubName: payload.data.fanClubName || null,
        customVariables: payload.data.customVariables as unknown as Prisma.JsonValue,
      },
    })

    return NextResponse.json({ preset })
  } catch (error) {
    console.error('Campaign preset save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
