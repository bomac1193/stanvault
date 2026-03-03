import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { geocodeCity } from '@/lib/geocoding'

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

    // Build geoPoints for heatmap (only when Mapbox is configured)
    let geoPoints: Array<{ city: string; country: string; lat: number; lng: number; fanCount: number; avgPulse: number }> = []

    if (process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      const cityAvgScores = await prisma.fan.groupBy({
        by: ['city', 'country'],
        where: {
          userId: session.user.id,
          city: { not: null },
        },
        _count: { city: true },
        _avg: { stanScore: true },
        orderBy: { _count: { city: 'desc' } },
        take: 50,
      })

      const geoPromises = cityAvgScores.map(async (stat) => {
        if (!stat.city || !stat.country) return null
        const geo = await geocodeCity(stat.city, stat.country)
        if (!geo) return null
        return {
          city: stat.city,
          country: stat.country,
          lat: geo.latitude,
          lng: geo.longitude,
          fanCount: stat._count.city,
          avgPulse: Math.round(stat._avg.stanScore || 0),
        }
      })

      const results = await Promise.all(geoPromises)
      geoPoints = results.filter(Boolean) as typeof geoPoints
    }

    return NextResponse.json({ countries, cities, geoPoints })
  } catch (error) {
    console.error('Geography insights error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
