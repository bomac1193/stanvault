import { prisma } from '@/lib/prisma'
import { FanTier } from '@prisma/client'

interface PredictiveSignal {
  fanId: string
  displayName: string
  currentTier: FanTier
  currentScore: number
  predictedTier: FanTier
  conversionProbability: number // 0-1
  daysToConversion: number | null
  signals: {
    name: string
    strength: 'weak' | 'moderate' | 'strong'
    description: string
  }[]
  recommendedAction: string
}

interface BehaviorPattern {
  recentActivitySpike: boolean // Activity increased recently
  consistentEngagement: boolean // Regular activity over time
  multiPlatformPresence: boolean // Active on multiple platforms
  earlyAdopter: boolean // Engaged with new releases quickly
  playlistAdder: boolean // Adds to playlists (strong signal)
  follower: boolean
  highStreamRatio: boolean // Streams per day above average
}

// Weights for each signal (based on superfan conversion research)
const SIGNAL_WEIGHTS = {
  recentActivitySpike: 0.15,
  consistentEngagement: 0.25,
  multiPlatformPresence: 0.10,
  earlyAdopter: 0.15,
  playlistAdder: 0.20,
  follower: 0.05,
  highStreamRatio: 0.10,
}

// Tier thresholds
const TIER_THRESHOLDS = {
  SUPERFAN: 0.75,
  DEDICATED: 0.50,
  ENGAGED: 0.25,
}

export async function getPredictiveSignals(userId: string): Promise<PredictiveSignal[]> {
  // Get all fans with their platform links and events
  const fans = await prisma.fan.findMany({
    where: {
      userId,
      tier: { in: ['CASUAL', 'ENGAGED', 'DEDICATED'] }, // Not already superfans
    },
    include: {
      platformLinks: true,
      events: {
        orderBy: { occurredAt: 'desc' },
        take: 50,
      },
    },
    orderBy: { stanScore: 'desc' },
    take: 100, // Analyze top 100 non-superfans
  })

  const signals: PredictiveSignal[] = []
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  for (const fan of fans) {
    const pattern = analyzeBehaviorPattern(fan, thirtyDaysAgo, sevenDaysAgo)
    const probability = calculateConversionProbability(pattern)
    const predictedTier = getPredictedTier(fan.tier, probability)
    const signalList = generateSignalList(pattern)
    const action = getRecommendedAction(pattern, fan.tier)

    // Only include fans with meaningful conversion probability
    if (probability > 0.20) {
      signals.push({
        fanId: fan.id,
        displayName: fan.displayName,
        currentTier: fan.tier,
        currentScore: fan.stanScore,
        predictedTier,
        conversionProbability: probability,
        daysToConversion: estimateDaysToConversion(pattern, probability),
        signals: signalList,
        recommendedAction: action,
      })
    }
  }

  // Sort by conversion probability
  return signals.sort((a, b) => b.conversionProbability - a.conversionProbability)
}

function analyzeBehaviorPattern(
  fan: {
    platformLinks: { platform: string; streams?: number | null; saves?: number | null; playlistAdds?: number | null; follows?: boolean | null }[]
    events: { eventType: string; occurredAt: Date }[]
    firstSeenAt: Date
    lastActiveAt: Date
    stanScore: number
  },
  thirtyDaysAgo: Date,
  sevenDaysAgo: Date
): BehaviorPattern {
  const recentEvents = fan.events.filter((e) => e.occurredAt > thirtyDaysAgo)
  const veryRecentEvents = fan.events.filter((e) => e.occurredAt > sevenDaysAgo)
  const olderEvents = fan.events.filter(
    (e) => e.occurredAt <= thirtyDaysAgo && e.occurredAt > new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000)
  )

  // Recent activity spike: more events in last 7 days than average
  const recentActivitySpike = veryRecentEvents.length > recentEvents.length / 4

  // Consistent engagement: events spread across the month
  const consistentEngagement = recentEvents.length >= 4 && olderEvents.length >= 2

  // Multi-platform presence
  const activePlatforms = fan.platformLinks.filter(
    (p) => (p.streams && p.streams > 0) || (p.saves && p.saves > 0) || p.follows
  )
  const multiPlatformPresence = activePlatforms.length >= 2

  // Early adopter: first seen within 30 days of artist joining (simplified)
  const daysSinceFirstSeen = Math.floor(
    (Date.now() - fan.firstSeenAt.getTime()) / (1000 * 60 * 60 * 24)
  )
  const earlyAdopter = daysSinceFirstSeen < 90

  // Playlist adder
  const spotifyLink = fan.platformLinks.find((p) => p.platform === 'SPOTIFY')
  const playlistAdder = (spotifyLink?.playlistAdds ?? 0) > 0

  // Follower
  const follower = fan.platformLinks.some((p) => p.follows === true)

  // High stream ratio
  const totalStreams = fan.platformLinks.reduce((sum, p) => sum + (p.streams ?? 0), 0)
  const daysSinceActive = Math.max(
    1,
    Math.floor((Date.now() - fan.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
  )
  const streamsPerDay = totalStreams / Math.max(1, daysSinceFirstSeen)
  const highStreamRatio = streamsPerDay > 0.5 && daysSinceActive < 14

  return {
    recentActivitySpike,
    consistentEngagement,
    multiPlatformPresence,
    earlyAdopter,
    playlistAdder,
    follower,
    highStreamRatio,
  }
}

function calculateConversionProbability(pattern: BehaviorPattern): number {
  let probability = 0

  for (const [signal, weight] of Object.entries(SIGNAL_WEIGHTS)) {
    if (pattern[signal as keyof BehaviorPattern]) {
      probability += weight
    }
  }

  return Math.min(0.95, probability) // Cap at 95%
}

function getPredictedTier(currentTier: FanTier, probability: number): FanTier {
  if (probability >= TIER_THRESHOLDS.SUPERFAN) return 'SUPERFAN'
  if (probability >= TIER_THRESHOLDS.DEDICATED) return 'DEDICATED'
  if (probability >= TIER_THRESHOLDS.ENGAGED) return 'ENGAGED'
  return currentTier
}

function generateSignalList(
  pattern: BehaviorPattern
): { name: string; strength: 'weak' | 'moderate' | 'strong'; description: string }[] {
  const signals: { name: string; strength: 'weak' | 'moderate' | 'strong'; description: string }[] = []

  if (pattern.playlistAdder) {
    signals.push({
      name: 'Playlist Curator',
      strength: 'strong',
      description: 'Added your music to their playlists',
    })
  }

  if (pattern.consistentEngagement) {
    signals.push({
      name: 'Consistent Listener',
      strength: 'strong',
      description: 'Regular engagement over the past month',
    })
  }

  if (pattern.recentActivitySpike) {
    signals.push({
      name: 'Activity Surge',
      strength: 'moderate',
      description: 'Increased activity in the last 7 days',
    })
  }

  if (pattern.multiPlatformPresence) {
    signals.push({
      name: 'Multi-Platform',
      strength: 'moderate',
      description: 'Active on multiple platforms',
    })
  }

  if (pattern.earlyAdopter) {
    signals.push({
      name: 'Early Fan',
      strength: 'moderate',
      description: 'Discovered you early in their journey',
    })
  }

  if (pattern.highStreamRatio) {
    signals.push({
      name: 'Heavy Streamer',
      strength: 'moderate',
      description: 'Above-average streaming frequency',
    })
  }

  if (pattern.follower) {
    signals.push({
      name: 'Follower',
      strength: 'weak',
      description: 'Following on at least one platform',
    })
  }

  return signals
}

function estimateDaysToConversion(pattern: BehaviorPattern, probability: number): number | null {
  if (probability < 0.30) return null // Too uncertain

  // Base estimate
  let days = 90

  // Reduce based on strong signals
  if (pattern.playlistAdder) days -= 20
  if (pattern.consistentEngagement) days -= 15
  if (pattern.recentActivitySpike) days -= 25
  if (pattern.multiPlatformPresence) days -= 10

  // Scale by probability
  days = Math.round(days * (1 - probability * 0.5))

  return Math.max(7, Math.min(90, days))
}

function getRecommendedAction(pattern: BehaviorPattern, currentTier: FanTier): string {
  if (pattern.recentActivitySpike && !pattern.follower) {
    return "Engage now - they're active but not following. Send a personal message or exclusive content."
  }

  if (pattern.playlistAdder && currentTier === 'ENGAGED') {
    return 'Close to superfan - consider early access to new releases or behind-the-scenes content.'
  }

  if (pattern.consistentEngagement && !pattern.multiPlatformPresence) {
    return 'Expand touchpoints - invite them to follow on other platforms for deeper connection.'
  }

  if (pattern.earlyAdopter && pattern.highStreamRatio) {
    return 'OG fan candidate - acknowledge their early support with exclusive recognition.'
  }

  return 'Nurture relationship - continue providing value through regular content.'
}

// API endpoint helper
export async function getTopPredictions(userId: string, limit = 20) {
  const signals = await getPredictiveSignals(userId)
  return signals.slice(0, limit)
}
