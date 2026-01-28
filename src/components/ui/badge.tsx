import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'white' | 'casual' | 'engaged' | 'dedicated' | 'superfan' | 'success' | 'warning' | 'error'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-gray-800 text-gray-300',
    accent: 'bg-accent/20 text-accent border border-accent/30',
    white: 'bg-white text-black',
    casual: 'bg-gray-800 text-gray-400',
    engaged: 'bg-gray-700 text-gray-300',
    dedicated: 'bg-gray-600 text-gray-200',
    superfan: 'bg-white text-black',
    success: 'bg-status-success/20 text-status-success',
    warning: 'bg-status-warning/20 text-status-warning',
    error: 'bg-status-error/20 text-status-error',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-caption font-medium uppercase tracking-wider',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export function TierBadge({ tier }: { tier: string }) {
  const tierVariant = tier.toLowerCase() as 'casual' | 'engaged' | 'dedicated' | 'superfan'
  const labels: Record<string, string> = {
    casual: 'Casual',
    engaged: 'Engaged',
    dedicated: 'Dedicated',
    superfan: 'Superfan',
  }

  return (
    <Badge variant={tierVariant}>
      {labels[tierVariant] || tier}
    </Badge>
  )
}

export function StanScoreBadge({ score }: { score: number }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-body-lg font-bold text-white font-mono">{score}</span>
      <span className="text-caption text-gray-500 uppercase tracking-wider">Score</span>
    </div>
  )
}
