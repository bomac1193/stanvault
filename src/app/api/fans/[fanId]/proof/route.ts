import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { fanId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the fan belongs to this creator
    const fan = await prisma.fan.findFirst({
      where: { id: params.fanId, userId: session.user.id },
      select: { id: true },
    })

    if (!fan) {
      return NextResponse.json({ error: 'Fan not found' }, { status: 404 })
    }

    const proofs = await prisma.fanProof.findMany({
      where: { fanId: params.fanId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ proofs })
  } catch (error) {
    console.error('Get proofs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { fanId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fan = await prisma.fan.findFirst({
      where: { id: params.fanId, userId: session.user.id },
      select: { id: true },
    })

    if (!fan) {
      return NextResponse.json({ error: 'Fan not found' }, { status: 404 })
    }

    const body = await req.json()
    const { proofType, proofUrl, description } = body

    if (!proofType) {
      return NextResponse.json({ error: 'proofType is required' }, { status: 400 })
    }

    const proof = await prisma.fanProof.create({
      data: {
        fanId: params.fanId,
        proofType,
        proofUrl: proofUrl || null,
        description: description || null,
      },
    })

    return NextResponse.json({ proof }, { status: 201 })
  } catch (error) {
    console.error('Create proof error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
