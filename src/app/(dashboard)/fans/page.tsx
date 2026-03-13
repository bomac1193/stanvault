'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/layout'
import { FanTable, FanFilters, Pagination } from '@/components/fans'
import { TableSkeleton, Skeleton } from '@/components/ui'
import { CsvImportModal } from '@/components/import/csv-import-modal'
import { useFans } from '@/hooks/use-fans'
import { useFanFiltersStore, TierFilter } from '@/stores/fan-filters-store'
import { AdminPreviewBar } from '@/components/admin/admin-preview-bar'
import { Upload } from 'lucide-react'

const VALID_TIERS = new Set(['ALL', 'CASUAL', 'ENGAGED', 'DEDICATED', 'SUPERFAN'])

export default function FansPage() {
  const searchParams = useSearchParams()
  const { data, isLoading, refetch } = useFans()
  const { sortField, sortOrder, setSort, setPage, setTier } = useFanFiltersStore()

  // Apply ?tier= param from URL (e.g. from tier chart "View all" links)
  useEffect(() => {
    const tierParam = searchParams.get('tier')
    if (tierParam && VALID_TIERS.has(tierParam)) {
      setTier(tierParam as TierFilter)
    }
  }, [searchParams, setTier])
  const [showImport, setShowImport] = useState(false)

  const handleSort = (field: string) => {
    setSort(field as 'stanScore' | 'displayName' | 'lastActiveAt' | 'firstSeenAt')
  }

  return (
    <div>
      <AdminPreviewBar />

      <div className="flex items-center justify-between mb-0">
        <PageHeader title="Fans" />
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

      {data?.previewMode === 'demo' && (
        <div className="mb-6 border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
          <p className="text-sm text-gray-300">
            Beta stress test loaded. These 50 rows represent 30 ICPs, 10 non-customers, and 10
            haters. Tier badges show fit strength, not real fan status.
          </p>
        </div>
      )}

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
            disableLinks={data?.previewMode === 'demo'}
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
