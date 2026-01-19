import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FanTier, Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tier = searchParams.get('tier')
    const search = searchParams.get('search')
    const sortField = searchParams.get('sortField') || 'stanScore'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Build where clause
    const where: Prisma.FanWhereInput = {
      userId: session.user.id,
    }

    if (tier && tier !== 'ALL') {
      where.tier = tier as FanTier
    }

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Build order by
    const orderBy: Prisma.FanOrderByWithRelationInput = {}
    if (sortField === 'stanScore') orderBy.stanScore = sortOrder as 'asc' | 'desc'
    else if (sortField === 'displayName') orderBy.displayName = sortOrder as 'asc' | 'desc'
    else if (sortField === 'lastActiveAt') orderBy.lastActiveAt = sortOrder as 'asc' | 'desc'
    else if (sortField === 'firstSeenAt') orderBy.firstSeenAt = sortOrder as 'asc' | 'desc'

    // Get total count for pagination
    const totalCount = await prisma.fan.count({ where })

    // Get fans
    const fans = await prisma.fan.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        platformLinks: {
          select: {
            platform: true,
          },
        },
      },
    })

    // Get tier counts for filter tabs
    const tierCounts = await prisma.fan.groupBy({
      by: ['tier'],
      where: { userId: session.user.id },
      _count: { tier: true },
    })

    const tierCountMap = tierCounts.reduce((acc, item) => {
      acc[item.tier] = item._count.tier
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      fans,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      tierCounts: {
        ALL: totalCount,
        CASUAL: tierCountMap.CASUAL || 0,
        ENGAGED: tierCountMap.ENGAGED || 0,
        DEDICATED: tierCountMap.DEDICATED || 0,
        SUPERFAN: tierCountMap.SUPERFAN || 0,
      },
    })
  } catch (error) {
    console.error('Fans fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
