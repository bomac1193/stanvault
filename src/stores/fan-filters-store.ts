import { create } from 'zustand'

export type TierFilter = 'ALL' | 'CASUAL' | 'ENGAGED' | 'DEDICATED' | 'SUPERFAN'
export type SortField = 'stanScore' | 'displayName' | 'lastActiveAt' | 'firstSeenAt'
export type SortOrder = 'asc' | 'desc'

interface FanFiltersState {
  tier: TierFilter
  search: string
  sortField: SortField
  sortOrder: SortOrder
  page: number
  pageSize: number

  // Actions
  setTier: (tier: TierFilter) => void
  setSearch: (search: string) => void
  setSort: (field: SortField, order?: SortOrder) => void
  setPage: (page: number) => void
  resetFilters: () => void
}

const initialState = {
  tier: 'ALL' as TierFilter,
  search: '',
  sortField: 'stanScore' as SortField,
  sortOrder: 'desc' as SortOrder,
  page: 1,
  pageSize: 20,
}

export const useFanFiltersStore = create<FanFiltersState>((set) => ({
  ...initialState,

  setTier: (tier) => set({ tier, page: 1 }),
  setSearch: (search) => set({ search, page: 1 }),
  setSort: (field, order) =>
    set((state) => ({
      sortField: field,
      sortOrder: order ?? (state.sortField === field && state.sortOrder === 'desc' ? 'asc' : 'desc'),
      page: 1,
    })),
  setPage: (page) => set({ page }),
  resetFilters: () => set(initialState),
}))
