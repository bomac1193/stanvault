import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  campaignRunId: z.string().optional(),
  fanId: z.string().optional(),
  fanEmail: z.string().email().optional(),
  ctaKey: z.string().min(1).max(80),
  ctaLabel: z.string().min(1).max(120),
  proofUrl: z.string().url().optional(),
  proofNote: z.string().max(500).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

    const completions = await prisma.ctaActionCompletion.findMany({
      where: { userId: session.user.id },
      orderBy: { submittedAt: 'desc' },
      take: Number.isNaN(limit) ? 50 : limit,
    })

    return NextResponse.json({ completions })
  } catch (error) {
    console.error('CTA completion GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = createSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', issues: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      )
    }

    const completion = await prisma.ctaActionCompletion.create({
      data: {
        userId: session.user.id,
        campaignRunId: parsed.data.campaignRunId,
        fanId: parsed.data.fanId,
        fanEmail: parsed.data.fanEmail,
        ctaKey: parsed.data.ctaKey,
        ctaLabel: parsed.data.ctaLabel,
        proofUrl: parsed.data.proofUrl,
        proofNote: parsed.data.proofNote,
      },
    })

    return NextResponse.json({ completion })
  } catch (error) {
    console.error('CTA completion POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
