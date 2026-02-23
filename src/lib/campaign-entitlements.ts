import { PricingTier } from '@prisma/client'

export type TierPolicy = {
  monthlyLiveSendLimit: number | null
  monthlyVoiceSendLimit: number | null
  maxCustomVariables: number
  allowCustomFromEmail: boolean
  prioritySupport: boolean
  allowVoiceCampaigns: boolean
  allowAdvancedVoiceConfig: boolean
  allowedVoiceProviders: Array<'fish-audio' | 'resemble-ai' | 'chatterbox'>
}

export const tierPolicies: Record<PricingTier, TierPolicy> = {
  STARTER: {
    monthlyLiveSendLimit: 500,
    monthlyVoiceSendLimit: 0,
    maxCustomVariables: 2,
    allowCustomFromEmail: false,
    prioritySupport: false,
    allowVoiceCampaigns: false,
    allowAdvancedVoiceConfig: false,
    allowedVoiceProviders: [],
  },
  PRIVATE_CIRCLE: {
    monthlyLiveSendLimit: 15000,
    monthlyVoiceSendLimit: 500,
    maxCustomVariables: 5,
    allowCustomFromEmail: false,
    prioritySupport: false,
    allowVoiceCampaigns: true,
    allowAdvancedVoiceConfig: false,
    allowedVoiceProviders: ['fish-audio'],
  },
  PATRON_GROWTH: {
    monthlyLiveSendLimit: 75000,
    monthlyVoiceSendLimit: 4000,
    maxCustomVariables: 50,
    allowCustomFromEmail: true,
    prioritySupport: true,
    allowVoiceCampaigns: true,
    allowAdvancedVoiceConfig: true,
    allowedVoiceProviders: ['fish-audio', 'resemble-ai'],
  },
  SOVEREIGN: {
    monthlyLiveSendLimit: null,
    monthlyVoiceSendLimit: null,
    maxCustomVariables: 500,
    allowCustomFromEmail: true,
    prioritySupport: true,
    allowVoiceCampaigns: true,
    allowAdvancedVoiceConfig: true,
    allowedVoiceProviders: ['fish-audio', 'resemble-ai', 'chatterbox'],
  },
}
