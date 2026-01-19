'use client'

import { Tabs } from '@/components/ui'
import { Search } from 'lucide-react'
import { useFanFiltersStore, TierFilter } from '@/stores/fan-filters-store'

interface TierCounts {
  ALL: number
  CASUAL: number
  ENGAGED: number
  DEDICATED: number
  SUPERFAN: number
}

interface FanFiltersProps {
  tierCounts: TierCounts
}

export function FanFilters({ tierCounts }: FanFiltersProps) {
  const { tier, search, setTier, setSearch } = useFanFiltersStore()

  const tabs = [
    { value: 'ALL', label: 'All', count: tierCounts.ALL },
    { value: 'SUPERFAN', label: 'Superfans', count: tierCounts.SUPERFAN },
    { value: 'DEDICATED', label: 'Dedicated', count: tierCounts.DEDICATED },
    { value: 'ENGAGED', label: 'Engaged', count: tierCounts.ENGAGED },
    { value: 'CASUAL', label: 'Casual', count: tierCounts.CASUAL },
  ]

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <Tabs
        tabs={tabs}
        value={tier}
        onChange={(value) => setTier(value as TierFilter)}
      />

      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vault-muted" />
        <input
          type="text"
          placeholder="Search fans..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-vault-dark border border-vault-gray rounded-lg text-warm-white placeholder:text-vault-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
        />
      </div>
    </div>
  )
}
