'use client'

import { useState, useMemo } from 'react'
import Map, { Source, Layer, Popup } from 'react-map-gl/mapbox'
import type { CircleLayer } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

interface GeoPoint {
  city: string
  country: string
  lat: number
  lng: number
  fanCount: number
  avgPulse: number
}

const circleLayerStyle: CircleLayer = {
  id: 'fan-circles',
  type: 'circle',
  paint: {
    'circle-radius': ['interpolate', ['linear'], ['get', 'fanCount'], 1, 6, 10, 14, 50, 24, 200, 36],
    'circle-color': ['interpolate', ['linear'], ['get', 'avgPulse'], 0, '#3B82F6', 25, '#8B5CF6', 50, '#D97706', 75, '#C9A227', 100, '#FFD700'],
    'circle-opacity': 0.75,
    'circle-stroke-width': 1,
    'circle-stroke-color': 'rgba(255,255,255,0.2)',
  },
}

export default function FanHeatmapMap({ geoPoints, mapboxToken }: { geoPoints: GeoPoint[]; mapboxToken: string }) {
  const [popup, setPopup] = useState<GeoPoint | null>(null)

  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: geoPoints.map((p) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
        properties: { city: p.city, country: p.country, fanCount: p.fanCount, avgPulse: p.avgPulse },
      })),
    }),
    [geoPoints]
  )

  return (
    <Map
      mapboxAccessToken={mapboxToken}
      initialViewState={{ longitude: 3.4, latitude: 6.5, zoom: 2 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      interactiveLayerIds={['fan-circles']}
      onClick={(e) => {
        const feature = e.features?.[0]
        if (feature?.properties) {
          const p = feature.properties as any
          const [lng, lat] = (feature.geometry as any).coordinates
          setPopup({ city: p.city, country: p.country, lat, lng, fanCount: p.fanCount, avgPulse: p.avgPulse })
        }
      }}
    >
      <Source id="fans" type="geojson" data={geojson}>
        <Layer {...circleLayerStyle} />
      </Source>

      {popup && (
        <Popup
          longitude={popup.lng}
          latitude={popup.lat}
          anchor="bottom"
          onClose={() => setPopup(null)}
          closeButton={false}
          className="fan-popup"
        >
          <div className="p-2 min-w-[140px]">
            <p className="font-medium text-sm">{popup.city}</p>
            <p className="text-xs text-gray-400">{popup.country}</p>
            <div className="mt-1 text-xs space-y-0.5">
              <p><span className="text-white font-medium">{popup.fanCount}</span> fans</p>
              <p>Avg Pulse: <span className="text-white font-medium">{Math.round(popup.avgPulse)}</span></p>
            </div>
          </div>
        </Popup>
      )}
    </Map>
  )
}
