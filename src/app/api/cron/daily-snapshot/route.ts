import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { takeDailySnapshot } from '@/lib/scoring/scr'

// This endpoint is designed to be called by a cron job (e.g., Vercel Cron)
// In production, protect this with a secret header
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret in production
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Get all users with fans
    const usersWithFans = await prisma.user.findMany({
      where: {
        fans: {
          some: {},
        },
      },
      select: {
        id: true,
      },
    })

    const results = []

    // Take snapshots for each user
    for (const user of usersWithFans) {
      try {
        await takeDailySnapshot(user.id)
        results.push({ userId: user.id, success: true })
      } catch (error) {
        results.push({
          userId: user.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Daily snapshot error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Also allow GET for testing
export async function GET(request: NextRequest) {
  return POST(request)
}
