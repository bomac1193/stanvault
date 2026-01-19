'use client'

import { Card, CardHeader, CardTitle, CardContent, Tabs } from '@/components/ui'
import { formatNumber } from '@/lib/utils'
import { MapPin, Building2 } from 'lucide-react'
import { useState } from 'react'

interface Country {
  name: string
  count: number
}

interface City {
  name: string
  country: string
  count: number
}

interface GeographyListProps {
  countries: Country[]
  cities: City[]
}

export function GeographyList({ countries, cities }: GeographyListProps) {
  const [view, setView] = useState('countries')

  const tabs = [
    { value: 'countries', label: 'Countries' },
    { value: 'cities', label: 'Cities' },
  ]

  const maxCountryCount = Math.max(...countries.map((c) => c.count), 1)
  const maxCityCount = Math.max(...cities.map((c) => c.count), 1)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Geography</CardTitle>
        <Tabs tabs={tabs} value={view} onChange={setView} className="w-auto" />
      </CardHeader>
      <CardContent>
        {view === 'countries' ? (
          <div className="space-y-3">
            {countries.length === 0 ? (
              <p className="text-center text-vault-muted py-4">No data available</p>
            ) : (
              countries.map((country, index) => (
                <div key={country.name} className="flex items-center gap-3">
                  <span className="text-sm text-vault-muted w-6">{index + 1}</span>
                  <MapPin className="w-4 h-4 text-vault-muted" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-warm-white">{country.name}</span>
                      <span className="text-sm font-mono text-warm-white">
                        {formatNumber(country.count)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-vault-darker rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold rounded-full"
                        style={{ width: `${(country.count / maxCountryCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {cities.length === 0 ? (
              <p className="text-center text-vault-muted py-4">No data available</p>
            ) : (
              cities.map((city, index) => (
                <div key={`${city.name}-${city.country}`} className="flex items-center gap-3">
                  <span className="text-sm text-vault-muted w-6">{index + 1}</span>
                  <Building2 className="w-4 h-4 text-vault-muted" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm text-warm-white">{city.name}</span>
                        <span className="text-xs text-vault-muted ml-2">{city.country}</span>
                      </div>
                      <span className="text-sm font-mono text-warm-white">
                        {formatNumber(city.count)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-vault-darker rounded-full overflow-hidden">
                      <div
                        className="h-full bg-moss rounded-full"
                        style={{ width: `${(city.count / maxCityCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
