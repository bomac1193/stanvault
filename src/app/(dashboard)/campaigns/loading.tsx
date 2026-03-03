import { Skeleton } from '@/components/ui'

export default function CampaignsLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-36 mb-2" />
      <Skeleton className="h-4 w-52 mb-8" />
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}
