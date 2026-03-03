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
  const styles: Record<string, string> = {
    CASUAL: 'bg-white/5 text-gray-500 border-white/5',
    ENGAGED: 'bg-white/8 text-gray-400 border-white/8',
    DEDICATED: 'bg-white/10 text-gray-300 border-white/10',
    SUPERFAN: 'bg-white/15 text-white border-white/15',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
        styles[upperTier] || 'bg-white/5 text-gray-500 border-white/5'
      )}
    >
      {getTierLabel(upperTier)}
    </span>
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
