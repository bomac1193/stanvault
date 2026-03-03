import { Skeleton } from '@/components/ui'

export default function InsightsLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-4 w-64 mb-8" />

      <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 mb-6">
        <Skeleton className="h-5 w-44 mb-6" />
        <Skeleton className="h-8 w-20 mb-4" />
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}
