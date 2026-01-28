import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DropContentType } from '@prisma/client'

// GET /api/drops - List artist's drops
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const drops = await prisma.drop.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { claims: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    drops: drops.map((drop) => ({
      ...drop,
      claimCount: drop._count.claims,
    })),
  })
}

// POST /api/drops - Create a new drop
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    title,
    description,
    contentType,
    contentUrl,
    minTier,
    minScore,
    minMonths,
    startsAt,
    endsAt,
    maxClaims,
  } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  if (!contentType || !Object.values(DropContentType).includes(contentType)) {
    return NextResponse.json({ error: 'Valid content type is required' }, { status: 400 })
  }

  // Generate URL-friendly slug
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)

  // Ensure unique slug
  const existingCount = await prisma.drop.count({
    where: { slug: { startsWith: baseSlug } },
  })
  const slug = existingCount > 0 ? `${baseSlug}-${existingCount + 1}` : baseSlug

  const drop = await prisma.drop.create({
    data: {
      userId: session.user.id,
      slug,
      title,
      description,
      contentType,
      contentUrl,
      minTier: minTier || null,
      minScore: minScore ? parseInt(minScore) : null,
      minMonths: minMonths ? parseInt(minMonths) : null,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      maxClaims: maxClaims ? parseInt(maxClaims) : null,
    },
  })

  return NextResponse.json({ drop })
}
