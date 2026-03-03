// ── Types ────────────────────────────────────────────────────────────────────

export type CampaignResponse = {
  campaignId: string
  status: string
  note?: string
  dispatch?: {
    mode: string
    provider: string
    deliveryMode?: 'TEXT' | 'VOICE'
    voiceProvider?: string
    fromEmail: string
    subject: string
  }
  variables?: {
    builtIn: string[]
    custom: string[]
  }
  totals?: {
    segmentCount: number
    queuedRecipients: number
    skippedNoEmail: number
    sent: number
    failed: number
    previewOnly: number
  }
  reliability?: {
    retries?: number
    timedOutAttempts?: number
    providerErrors?: number
  }
  deliveryResultsPreview?: Array<{
    fanId: string
    email: string
    status: string
    messageId?: string | null
    error?: string
  }>
}

export type VoiceCloneResponse = {
  id?: string
  externalId?: string
  provider?: 'fish-audio' | 'resemble-ai' | 'chatterbox'
  name?: string
  previewUrl?: string
}

export type VoiceTake = {
  id: string
  blob: Blob
  durationMs: number
  source: 'recorded' | 'uploaded'
}

export type SavedVoiceModel = {
  id: string
  externalId: string
  provider: 'fish-audio' | 'resemble-ai' | 'chatterbox'
  name: string
  previewUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CampaignHistoryItem = {
  id: string
  externalCampaignId: string | null
  status: string
  dispatchMode: string | null
  provider: string | null
  subject: string | null
  minTier: string | null
  minStanScore: number | null
  recipientLimit: number | null
  dryRun: boolean
  segmentCount: number
  queuedRecipients: number
  sentCount: number
  failedCount: number
  previewOnlyCount: number
  createdAt: string
}

export type VariablePreset = {
  id: string
  name: string
  fanClubName: string | null
  customVariables: Record<string, string | number> | null
  createdAt: string
  updatedAt: string
}

export type CampaignEntitlements = {
  pricingTier: 'STARTER' | 'PRIVATE_CIRCLE' | 'PATRON_GROWTH' | 'SOVEREIGN'
  monthlyLiveSendLimit: number | null
  monthlyVoiceSendLimit: number | null
  maxCustomVariables: number
  allowCustomFromEmail: boolean
  prioritySupport: boolean
  allowVoiceCampaigns: boolean
  allowAdvancedVoiceConfig: boolean
  allowedVoiceProviders: Array<'fish-audio' | 'resemble-ai' | 'chatterbox'>
  monthSentSoFar: number
  monthVoiceSentSoFar: number
  remaining: number | null
  voiceRemaining: number | null
}

export type CampaignAnalytics = {
  ctaByKey: Array<{ ctaKey: string; count: number }>
  completionByStatus: Array<{ status: string; count: number }>
}

export type VoiceProvider = 'fish-audio' | 'resemble-ai' | 'chatterbox'

// ── Constants ────────────────────────────────────────────────────────────────

export const suggestedVariableFields = [
  {
    key: 'oryx_phase',
    label: 'Oryx Phase',
    placeholder: 'Propagation',
    hint: 'Token: {oryx_phase}',
  },
  {
    key: 'propagation_goal',
    label: 'Propagation Goal',
    placeholder: '12',
    hint: 'Token: {propagation_goal}',
  },
  {
    key: 'campaign_theme',
    label: 'Campaign Theme',
    placeholder: 'Core Fan Summer',
    hint: 'Token: {campaign_theme}',
  },
  {
    key: 'call_to_action',
    label: 'Call To Action',
    placeholder: 'Share this with your circle',
    hint: 'Token: {call_to_action}',
  },
  {
    key: 'reward_name',
    label: 'Reward Name',
    placeholder: 'Backstage Voice Drop',
    hint: 'Token: {reward_name}',
  },
] as const

export const messageTemplateSuggestions = [
  {
    id: 'welcome',
    label: 'Welcome Core Fan',
    subject: 'You are officially in my inner circle',
    body: 'Hey {fan_name} - I see you. Welcome to the {stan_club_name}. Your pulse score is {stan_score}, and that support means everything to me.',
  },
  {
    id: 'propagation',
    label: 'Propagation Push',
    subject: 'Can you help me push this one out?',
    body: '{fan_name}, you already drove {propagation_count} propagations for me. We are aiming for {propagation_goal} this round. If you are in, {call_to_action}.',
  },
  {
    id: 'tip-reward',
    label: 'Tip Reward',
    subject: 'I made this for my real supporters',
    body: 'Hey {fan_name}, you have tipped {tip_count} times (${tip_amount_usd}) and held me down for real. I unlocked {reward_name} for you.',
  },
] as const

export const actionCtaPresets = [
  {
    id: 'propagate',
    label: 'Propagate This Drop',
    action: 'Send this drop to 3 specific people who will take action, not just react.',
    cta: 'Propagate this drop to 3 high-intent people in your circle.',
    oryxPhase: 'Propagation',
  },
  {
    id: 'prove-conviction',
    label: 'Prove Conviction',
    action: 'Back your support with one real stake action now: tip, pledge, or pre-order.',
    cta: 'Prove conviction with one real stake action right now.',
    oryxPhase: 'Conviction',
  },
  {
    id: 'micro-circle',
    label: 'Lead a Listening Circle',
    action: 'Run a small listening circle (5-10 people) and report what landed.',
    cta: 'Lead a 5-10 person listening circle and send me the key feedback.',
  },
  {
    id: 'city-node',
    label: 'Activate Your City',
    action: 'Execute one local move: DJ handoff, campus share, venue intro, or playlist placement.',
    cta: 'Activate your city with one local move this week.',
  },
  {
    id: 'bring-one-fan',
    label: 'Bring One New Fan',
    action: 'Bring one new fan in and guide them to their first meaningful action.',
    cta: 'Bring one new fan in and guide their first real action.',
  },
  {
    id: 'archive',
    label: 'Archive This Era',
    action: 'Contribute one story, clip, translation, or memory that deepens the movement.',
    cta: 'Archive one story or clip that defines this era.',
  },
  {
    id: 'city-surge',
    label: 'Run City Surge',
    action: 'Execute one verified local move and log it to advance your city phase.',
    cta: 'Run one verified city surge action and report it today.',
    oryxPhase: 'Propagation',
  },
  {
    id: 'conviction-proof',
    label: 'Log Conviction Proof',
    action: 'Complete one stake-backed action and submit proof for conviction progression.',
    cta: 'Log one conviction-proof action with evidence now.',
    oryxPhase: 'Conviction',
  },
] as const

export const defaultVoiceProviders: VoiceProvider[] = ['fish-audio']

export const moodPresets = [
  'excited',
  'grateful',
  'heartfelt',
  'playful',
  'direct',
] as const

export const tokenGroups = [
  {
    label: 'Fan',
    tokens: ['{fan_name}', '{city}', '{country}', '{fan_tier}'],
  },
  {
    label: 'Scores',
    tokens: ['{stan_score}', '{conviction_score}', '{engagement_score}', '{longevity_score}', '{recency_score}', '{platform_score}'],
  },
  {
    label: 'Activity',
    tokens: ['{propagation_count}', '{propagrations}', '{tip_count}', '{tip_amount_usd}', '{tip_frequency}', '{moment_saves}'],
  },
  {
    label: 'Identity',
    tokens: ['{stan_club_name}', '{stan_name}'],
  },
] as const

export const voiceDefaults: Record<
  string,
  {
    style: 'natural' | 'whisper' | 'singing' | 'shouting'
    emotion: 'neutral' | 'grateful' | 'excited' | 'playful' | 'heartfelt'
    mood: string
  }
> = {
  propagate: { style: 'shouting', emotion: 'excited', mood: 'excited' },
  'prove-conviction': { style: 'natural', emotion: 'heartfelt', mood: 'heartfelt' },
  'micro-circle': { style: 'natural', emotion: 'playful', mood: 'playful' },
  'city-node': { style: 'natural', emotion: 'excited', mood: 'excited' },
  'bring-one-fan': { style: 'natural', emotion: 'grateful', mood: 'grateful' },
  archive: { style: 'whisper', emotion: 'heartfelt', mood: 'heartfelt' },
  'city-surge': { style: 'shouting', emotion: 'excited', mood: 'excited' },
  'conviction-proof': { style: 'natural', emotion: 'heartfelt', mood: 'heartfelt' },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function formatVoiceDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function getVoiceDurationGuidance(ms: number) {
  const seconds = Math.floor(ms / 1000)
  if (seconds <= 0) return { label: 'No duration yet', tone: 'text-gray-500' }
  if (seconds < 45) return { label: 'Too short: aim for 90-180s', tone: 'text-status-error' }
  if (seconds < 90) return { label: 'Usable, longer is better', tone: 'text-gray-400' }
  if (seconds <= 180) return { label: 'Ideal range', tone: 'text-green-400' }
  if (seconds <= 300) return { label: 'Great depth', tone: 'text-green-400' }
  return { label: 'Long sample, trim pauses if possible', tone: 'text-gray-400' }
}

export function getTieredActionCtaPresets(pricingTier: string) {
  if (pricingTier === 'STARTER') {
    return actionCtaPresets.filter((p) => ['propagate', 'bring-one-fan'].includes(p.id))
  }
  if (pricingTier === 'PRIVATE_CIRCLE') {
    return actionCtaPresets.filter((p) =>
      ['propagate', 'prove-conviction', 'bring-one-fan'].includes(p.id)
    )
  }
  if (pricingTier === 'PATRON_GROWTH') {
    return actionCtaPresets.filter((p) =>
      ['propagate', 'prove-conviction', 'micro-circle', 'city-node', 'bring-one-fan', 'city-surge'].includes(p.id)
    )
  }
  return [...actionCtaPresets]
}

export function getRecommendedActionCtaPresets(
  pricingTier: string,
  tiered: readonly (typeof actionCtaPresets)[number][]
) {
  const orderByTier: Record<string, string[]> = {
    STARTER: ['propagate', 'bring-one-fan'],
    PRIVATE_CIRCLE: ['propagate', 'prove-conviction', 'bring-one-fan'],
    PATRON_GROWTH: ['propagate', 'prove-conviction', 'city-node'],
    SOVEREIGN: ['city-surge', 'conviction-proof', 'archive'],
  }
  const order = orderByTier[pricingTier] || orderByTier.PRIVATE_CIRCLE
  return order
    .map((id) => tiered.find((p) => p.id === id))
    .filter((p): p is (typeof actionCtaPresets)[number] => Boolean(p))
}
