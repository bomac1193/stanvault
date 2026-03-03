import { Skeleton, TableSkeleton } from '@/components/ui'

export default function FansLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-0">
        <div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="flex items-center justify-between gap-4 mb-6 mt-8">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-10 w-80" />
      </div>

      <div className="bg-[#0a0a0a] border border-[#1a1a1a]">
        <div className="px-6 py-3 border-b border-[#1a1a1a]">
          <Skeleton className="h-5 w-full" />
        </div>
        <TableSkeleton rows={10} />
      </div>
    </div>
  )
}
