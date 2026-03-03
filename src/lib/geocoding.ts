import { prisma } from '@/lib/prisma'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

interface GeoResult {
  latitude: number
  longitude: number
}

export async function geocodeCity(city: string, country: string): Promise<GeoResult | null> {
  if (!MAPBOX_TOKEN) return null

  // Check cache first
  const cached = await prisma.cityGeocode.findUnique({
    where: { city_country: { city, country } },
  })

  if (cached) {
    return { latitude: cached.latitude, longitude: cached.longitude }
  }

  // Query Mapbox Geocoding API
  try {
    const query = encodeURIComponent(`${city}, ${country}`)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=place`

    const res = await fetch(url)
    if (!res.ok) return null

    const data = await res.json()
    const feature = data.features?.[0]
    if (!feature?.center) return null

    const [longitude, latitude] = feature.center

    // Cache result
    await prisma.cityGeocode.create({
      data: { city, country, latitude, longitude },
    }).catch(() => {
      // Ignore duplicate key errors from race conditions
    })

    return { latitude, longitude }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}
