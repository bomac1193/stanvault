'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { FanTable, FanFilters, Pagination } from '@/components/fans'
import { TableSkeleton, Skeleton } from '@/components/ui'
import { CsvImportModal } from '@/components/import/csv-import-modal'
import { useFans } from '@/hooks/use-fans'
import { useFanFiltersStore } from '@/stores/fan-filters-store'
import { Upload } from 'lucide-react'

export default function FansPage() {
  const { data, isLoading, refetch } = useFans()
  const { sortField, sortOrder, setSort, setPage } = useFanFiltersStore()
  const [showImport, setShowImport] = useState(false)

  const handleSort = (field: string) => {
    setSort(field as 'stanScore' | 'displayName' | 'lastActiveAt' | 'firstSeenAt')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-0">
        <PageHeader
          title="Fans"
          description="Manage and explore your fanbase"
        />
        <button
          onClick={() => setShowImport(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[#1a1a1a] text-gray-300 hover:text-white hover:border-[#333] transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </button>
      </div>

      <CsvImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => refetch()}
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
        <div className="bg-[#0a0a0a] border border-[#1a1a1a]">
          <div className="px-6 py-3 border-b border-[#1a1a1a]">
            <Skeleton className="h-5 w-full" />
          </div>
          <TableSkeleton rows={10} />
        </div>
      ) : data?.fans.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-12 text-center">
          <p className="text-lg text-white mb-2">No fans found</p>
          <p className="text-gray-500 mb-4">
            Connect a platform to start discovering your fans, or import a CSV.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="/connections" className="text-accent hover:underline text-sm">
              Connect a platform
            </a>
            <span className="text-gray-700">|</span>
            <a href="/fans" className="text-gray-400 hover:text-white text-sm">
              Adjust filters
            </a>
          </div>
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
