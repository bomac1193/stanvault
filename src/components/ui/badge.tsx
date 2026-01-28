import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'casual' | 'engaged' | 'dedicated' | 'superfan' | 'success' | 'warning' | 'error'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-vault-gray text-warm-white',
    casual: 'bg-tier-casual/20 text-tier-casual border border-tier-casual/30',
    engaged: 'bg-tier-engaged/20 text-tier-engaged border border-tier-engaged/30',
    dedicated: 'bg-tier-dedicated/20 text-tier-dedicated border border-tier-dedicated/30',
    superfan: 'bg-gold/20 text-gold border border-gold/30',
    success: 'bg-status-success/20 text-status-success border border-status-success/30',
    warning: 'bg-status-warning/20 text-status-warning border border-status-warning/30',
    error: 'bg-status-error/20 text-status-error border border-status-error/30',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-display font-bold uppercase tracking-wide',
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
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gold/10 border border-gold/20 rounded-md">
      <span className="text-gold font-mono font-semibold text-sm">{score}</span>
      <span className="text-gold/60 text-xs font-display uppercase tracking-wide">Stan Score</span>
    </div>
  )
}
