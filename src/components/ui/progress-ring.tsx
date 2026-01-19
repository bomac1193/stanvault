'use client'

import { cn } from '@/lib/utils'

export interface ProgressRingProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  label?: string
  showValue?: boolean
  className?: string
}

export function ProgressRing({
  value,
  max,
  size = 80,
  strokeWidth = 6,
  label,
  showValue = true,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min(value / max, 1)
  const offset = circumference - percentage * circumference

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            className="text-vault-gray"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            className="text-gold transition-all duration-500 ease-out"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-warm-white font-mono font-semibold text-sm">
              {value}
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-xs text-vault-muted text-center">{label}</span>
      )}
    </div>
  )
}
