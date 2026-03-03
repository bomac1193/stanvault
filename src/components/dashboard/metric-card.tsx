import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'bg-[#0a0a0a] border border-[#1a1a1a] p-6 transition-all duration-200 hover:border-[#333]',
        className
      )}
    >
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-mono font-bold text-white">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
      {change !== undefined && (
        <span
          className={cn(
            'text-sm font-medium',
            changeType === 'increase' && 'text-status-success',
            changeType === 'decrease' && 'text-status-error',
            changeType === 'neutral' && 'text-gray-500'
          )}
        >
          {change > 0 ? '+' : ''}
          {change} this month
        </span>
      )}
    </div>
  )
}
