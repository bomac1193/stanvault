'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { MapPin } from 'lucide-react'

interface GeoPoint {
  city: string
  country: string
  lat: number
  lng: number
  fanCount: number
  avgPulse: number
}

interface FanHeatmapProps {
  geoPoints: GeoPoint[]
}

// Lazy-load the map to avoid SSR issues with mapbox-gl
const MapInner = dynamic(() => import('./fan-heatmap-map'), { ssr: false })

export function FanHeatmap({ geoPoints }: FanHeatmapProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!mapboxToken || geoPoints.length === 0) return null

  return (
    <Card className="lg:col-span-2 overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-accent" />
          <CardTitle>Fan Heatmap</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px]">
          <MapInner geoPoints={geoPoints} mapboxToken={mapboxToken} />
        </div>
      </CardContent>
    </Card>
  )
}
