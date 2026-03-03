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
export const CONVERSION_RATE_NAME = 'PCR'          // Pulse Conversion Rate
export const CONVERSION_RATE_LONG = 'Pulse Conversion Rate'

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
  CASUAL: 'bg-gray-800 text-gray-400',
  ENGAGED: 'bg-gray-700 text-gray-300',
  DEDICATED: 'bg-gray-600 text-gray-200',
  SUPERFAN: 'bg-white text-black',
}

// ── Helpers ─────────────────────────────────────────────
export function getTierLabel(tier: string): string {
  return TIER_LABELS[tier.toUpperCase()] || tier
}

export function getTierColor(tier: string): string {
  return TIER_COLORS[tier.toUpperCase()] || 'tier-casual'
}
