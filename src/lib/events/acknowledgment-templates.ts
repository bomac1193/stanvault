import { EventType } from '@prisma/client'

export const ACKNOWLEDGABLE_EVENT_TYPES: EventType[] = [
  'TIER_UPGRADE',
  'BECAME_SUPERFAN',
  'FIRST_TIP',
  'MILESTONE_TIPS',
]

export interface DefaultTemplate {
  eventType: EventType
  subject: string
  messageBody: string
}

export const DEFAULT_TEMPLATES: Record<string, DefaultTemplate> = {
  TIER_UPGRADE: {
    eventType: 'TIER_UPGRADE',
    subject: 'You just leveled up',
    messageBody:
      'Hey {fan_name} — I see you moving. You are now {fan_tier}. Pulse: {stan_score}. That kind of support does not go unnoticed.',
  },
  BECAME_SUPERFAN: {
    eventType: 'BECAME_SUPERFAN',
    subject: 'You are in my core now',
    messageBody:
      '{fan_name}, you just reached Core. Pulse: {stan_score}. You are one of the people who actually showed up — and I see it. Welcome to the inner circle.',
  },
  FIRST_TIP: {
    eventType: 'FIRST_TIP',
    subject: 'First tip received',
    messageBody:
      '{fan_name}, your first tip just landed. That is real conviction — not a like, not a follow, but actual support. It means more than you think.',
  },
  MILESTONE_TIPS: {
    eventType: 'MILESTONE_TIPS',
    subject: 'You are one of my biggest supporters',
    messageBody:
      '{fan_name}, you have tipped {tip_count} times now. That puts you in a very small group of people who back this with more than words. Thank you.',
  },
}

export function getDefaultTemplate(eventType: EventType): DefaultTemplate | null {
  return DEFAULT_TEMPLATES[eventType] || null
}
