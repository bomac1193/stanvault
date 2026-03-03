import { Skeleton } from '@/components/ui'

export default function SettingsLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-28 mb-2" />
      <Skeleton className="h-4 w-48 mb-8" />
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  )
}
