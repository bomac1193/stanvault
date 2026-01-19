import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FanTier, Prisma } from '@prisma/client'
import { z } from 'zod'

const exportSchema = z.object({
  format: z.enum(['csv', 'json']),
  tier: z.enum(['ALL', 'CASUAL', 'ENGAGED', 'DEDICATED', 'SUPERFAN']).optional(),
  fields: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = exportSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { format, tier, fields } = parsed.data

    // Build query
    const where: Prisma.FanWhereInput = { userId: session.user.id }
    if (tier && tier !== 'ALL') {
      where.tier = tier as FanTier
    }

    const fans = await prisma.fan.findMany({
      where,
      include: {
        platformLinks: {
          select: {
            platform: true,
          },
        },
      },
      orderBy: { stanScore: 'desc' },
    })

    // Default fields
    const defaultFields = [
      'displayName',
      'email',
      'location',
      'stanScore',
      'tier',
      'platforms',
      'firstSeenAt',
      'lastActiveAt',
    ]
    const selectedFields = fields?.length ? fields : defaultFields

    // Transform data
    const exportData = fans.map((fan) => {
      const record: Record<string, string | number | null> = {}

      if (selectedFields.includes('displayName')) record.displayName = fan.displayName
      if (selectedFields.includes('email')) record.email = fan.email || ''
      if (selectedFields.includes('location')) record.location = fan.location || ''
      if (selectedFields.includes('stanScore')) record.stanScore = fan.stanScore
      if (selectedFields.includes('tier')) record.tier = fan.tier
      if (selectedFields.includes('platforms')) {
        record.platforms = fan.platformLinks.map((p) => p.platform).join(', ')
      }
      if (selectedFields.includes('firstSeenAt')) {
        record.firstSeenAt = fan.firstSeenAt.toISOString()
      }
      if (selectedFields.includes('lastActiveAt')) {
        record.lastActiveAt = fan.lastActiveAt.toISOString()
      }

      return record
    })

    if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="fans-export-${Date.now()}.json"`,
        },
      })
    }

    // CSV format
    const headers = selectedFields.join(',')
    const rows = exportData.map((row) =>
      selectedFields
        .map((field) => {
          const value = row[field]
          // Escape commas and quotes
          const stringValue = String(value ?? '')
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
        .join(',')
    )

    const csv = [headers, ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="fans-export-${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
