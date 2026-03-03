import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon?: LucideIcon
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  icon: Icon,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'bg-[#0a0a0a] border border-[#1a1a1a] p-6 transition-all duration-200 hover:border-[#333]',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-mono font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {changeType === 'increase' && (
                <TrendingUp className="w-4 h-4 text-status-success" />
              )}
              {changeType === 'decrease' && (
                <TrendingDown className="w-4 h-4 text-status-error" />
              )}
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
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-[#141414]">
            <Icon className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  )
}
