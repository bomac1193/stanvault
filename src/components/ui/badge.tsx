import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { getTierLabel, TIER_BADGE_CLASSES, SCORE_NAME } from '@/lib/labels'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'white' | 'casual' | 'engaged' | 'dedicated' | 'superfan' | 'success' | 'warning' | 'error'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#1a1a1a] text-gray-300',
    accent: 'bg-accent/20 text-accent border border-accent/30',
    white: 'bg-white text-black',
    casual: TIER_BADGE_CLASSES.CASUAL,
    engaged: TIER_BADGE_CLASSES.ENGAGED,
    dedicated: TIER_BADGE_CLASSES.DEDICATED,
    superfan: TIER_BADGE_CLASSES.SUPERFAN,
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
  const upperTier = tier.toUpperCase()
  const variantMap: Record<string, BadgeProps['variant']> = {
    CASUAL: 'casual',
    ENGAGED: 'engaged',
    DEDICATED: 'dedicated',
    SUPERFAN: 'superfan',
  }
  const variant = variantMap[upperTier] || 'default'

  return (
    <Badge variant={variant}>
      {getTierLabel(upperTier)}
    </Badge>
  )
}

export function PulseBadge({ score }: { score: number }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-body-lg font-bold text-white font-mono">{score}</span>
      <span className="text-caption text-gray-500 uppercase tracking-wider">{SCORE_NAME}</span>
    </div>
  )
}

/** @deprecated Use PulseBadge instead */
export const StanScoreBadge = PulseBadge
