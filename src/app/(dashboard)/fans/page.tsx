'use client'

import { PageHeader } from '@/components/layout'
import { FanTable, FanFilters, Pagination } from '@/components/fans'
import { TableSkeleton, Skeleton } from '@/components/ui'
import { useFans } from '@/hooks/use-fans'
import { useFanFiltersStore } from '@/stores/fan-filters-store'

export default function FansPage() {
  const { data, isLoading } = useFans()
  const { sortField, sortOrder, setSort, setPage } = useFanFiltersStore()

  const handleSort = (field: string) => {
    setSort(field as 'stanScore' | 'displayName' | 'lastActiveAt' | 'firstSeenAt')
  }

  return (
    <div>
      <PageHeader
        title="Fans"
        description="Manage and explore your fanbase"
      />

      {/* Filters */}
      {isLoading ? (
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-10 w-80" />
        </div>
      ) : (
        <FanFilters
          tierCounts={data?.tierCounts || {
            ALL: 0,
            CASUAL: 0,
            ENGAGED: 0,
            DEDICATED: 0,
            SUPERFAN: 0,
          }}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <div className="bg-vault-dark border border-vault-gray rounded-lg">
          <div className="px-6 py-3 border-b border-vault-gray">
            <Skeleton className="h-5 w-full" />
          </div>
          <TableSkeleton rows={10} />
        </div>
      ) : data?.fans.length === 0 ? (
        <div className="bg-vault-dark border border-vault-gray rounded-lg p-12 text-center">
          <p className="text-lg text-warm-white mb-2">No fans found</p>
          <p className="text-vault-muted">
            Try adjusting your filters or connect more platforms to discover fans.
          </p>
        </div>
      ) : (
        <>
          <FanTable
            fans={data?.fans || []}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          {data && data.pagination.totalPages > 1 && (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              totalCount={data.pagination.totalCount}
              pageSize={data.pagination.pageSize}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  )
}
