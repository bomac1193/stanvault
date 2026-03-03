import { Skeleton } from '@/components/ui'

export default function DropsLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-48 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  )
}
