import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get top countries
    const countryStats = await prisma.fan.groupBy({
      by: ['country'],
      where: {
        userId: session.user.id,
        country: { not: null },
      },
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    })

    // Get top cities
    const cityStats = await prisma.fan.groupBy({
      by: ['city', 'country'],
      where: {
        userId: session.user.id,
        city: { not: null },
      },
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
      take: 10,
    })

    const countries = countryStats.map((stat) => ({
      name: stat.country || 'Unknown',
      count: stat._count.country,
    }))

    const cities = cityStats.map((stat) => ({
      name: stat.city || 'Unknown',
      country: stat.country || '',
      count: stat._count.city,
    }))

    return NextResponse.json({ countries, cities })
  } catch (error) {
    console.error('Geography insights error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
