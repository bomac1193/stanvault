import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-vault-gray/50',
        className
      )}
    />
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-vault-dark border border-vault-gray rounded-lg p-6">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

export function FanRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-vault-gray">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-16" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <FanRowSkeleton key={i} />
      ))}
    </div>
  )
}
