/**
 * Centralized terminology mapping for the Imprint rebrand.
 *
 * DB enum values (CASUAL, ENGAGED, DEDICATED, SUPERFAN) stay as-is.
 * DB field `stanScore` stays. UI surfaces the labels defined here.
 */

// ── Product ──────────────────────────────────────────────
export const PRODUCT_NAME = 'Imprint'
export const PRODUCT_TAGLINE = 'Own Your Fans. Own Your Future.'
export const SCORE_NAME = 'Pulse'
export const CONVERSION_RATE_NAME = 'CCR'          // Core Conversion Rate
export const CONVERSION_RATE_LONG = 'Core Conversion Rate'

// ── Tier labels (DB enum → UI) ──────────────────────────
export const TIER_LABELS: Record<string, string> = {
  CASUAL: 'Faint',
  ENGAGED: 'Steady',
  DEDICATED: 'Strong',
  SUPERFAN: 'Core',
}

// ── Tier Tailwind color classes ─────────────────────────
export const TIER_COLORS: Record<string, string> = {
  CASUAL: 'tier-casual',
  ENGAGED: 'tier-engaged',
  DEDICATED: 'tier-dedicated',
  SUPERFAN: 'tier-superfan',
}

// ── Tier badge variant colors (Tailwind class strings) ──
export const TIER_BADGE_CLASSES: Record<string, string> = {
  CASUAL: 'bg-white/5 text-gray-500 border-white/5',
  ENGAGED: 'bg-white/8 text-gray-400 border-white/8',
  DEDICATED: 'bg-white/10 text-gray-300 border-white/10',
  SUPERFAN: 'bg-white/15 text-white border-white/15',
}

// ── Helpers ─────────────────────────────────────────────
export function getTierLabel(tier: string): string {
  return TIER_LABELS[tier.toUpperCase()] || tier
}

export function getTierColor(tier: string): string {
  return TIER_COLORS[tier.toUpperCase()] || 'tier-casual'
}
