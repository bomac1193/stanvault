import { FanTier, Platform } from '@prisma/client'

interface PlatformMetrics {
  platform: Platform
  streams?: number | null
  playlistAdds?: number | null
  saves?: number | null
  follows?: boolean | null
  likes?: number | null
  comments?: number | null
  shares?: number | null
  subscribed?: boolean | null
  videoViews?: number | null
  watchTime?: number | null
  emailOpens?: number | null
  emailClicks?: number | null
}

interface ScoreInput {
  platformLinks: PlatformMetrics[]
  firstSeenAt: Date
  lastActiveAt: Date
}

interface ScoreBreakdown {
  platformScore: number
  engagementScore: number
  longevityScore: number
  recencyScore: number
  totalScore: number
  tier: FanTier
}

// Platform presence: max 30 points (10 per platform, capped at 3)
function calculatePlatformScore(platformLinks: PlatformMetrics[]): number {
  const activePlatforms = platformLinks.filter((link) => {
    // A platform is "active" if user has some engagement
    return (
      link.follows ||
      link.subscribed ||
      (link.streams && link.streams > 0) ||
      (link.likes && link.likes > 0) ||
      (link.emailOpens && link.emailOpens > 0)
    )
  })

  return Math.min(activePlatforms.length * 10, 30)
}

// Engagement depth: max 40 points
function calculateEngagementScore(platformLinks: PlatformMetrics[]): number {
  let score = 0

  for (const link of platformLinks) {
    // Spotify engagement
    if (link.streams) {
      score += Math.min(link.streams / 10, 10) // 10 points max for 100+ streams
    }
    if (link.playlistAdds) {
      score += Math.min(link.playlistAdds * 2, 5) // 5 points max for playlist adds
    }
    if (link.saves) {
      score += Math.min(link.saves, 5) // 5 points max for saves
    }

    // Social engagement
    if (link.follows) {
      score += 3
    }
    if (link.likes) {
      score += Math.min(link.likes / 5, 5) // 5 points max for 25+ likes
    }
    if (link.comments) {
      score += Math.min(link.comments * 2, 5) // 5 points max for comments
    }
    if (link.shares) {
      score += Math.min(link.shares * 3, 5) // 5 points max for shares
    }

    // YouTube engagement
    if (link.subscribed) {
      score += 3
    }
    if (link.videoViews) {
      score += Math.min(link.videoViews / 20, 5) // 5 points max
    }

    // Email engagement
    if (link.emailOpens) {
      score += Math.min(link.emailOpens / 2, 5) // 5 points max
    }
    if (link.emailClicks) {
      score += Math.min(link.emailClicks * 2, 5) // 5 points max
    }
  }

  return Math.min(Math.round(score), 40)
}

// Longevity: max 20 points (based on days since first seen)
function calculateLongevityScore(firstSeenAt: Date): number {
  const now = new Date()
  const daysSinceFirstSeen = Math.floor(
    (now.getTime() - firstSeenAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Scale: 0-30 days = 0-5 points, 30-90 days = 5-10 points, 90-180 days = 10-15 points, 180+ = 15-20 points
  if (daysSinceFirstSeen < 30) {
    return Math.round((daysSinceFirstSeen / 30) * 5)
  } else if (daysSinceFirstSeen < 90) {
    return Math.round(5 + ((daysSinceFirstSeen - 30) / 60) * 5)
  } else if (daysSinceFirstSeen < 180) {
    return Math.round(10 + ((daysSinceFirstSeen - 90) / 90) * 5)
  } else {
    return Math.min(15 + Math.round((daysSinceFirstSeen - 180) / 180) * 5, 20)
  }
}

// Recency: max 10 points (bonus for recent activity)
function calculateRecencyScore(lastActiveAt: Date): number {
  const now = new Date()
  const daysSinceLastActive = Math.floor(
    (now.getTime() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  // More recent = higher score
  if (daysSinceLastActive <= 1) return 10
  if (daysSinceLastActive <= 7) return 8
  if (daysSinceLastActive <= 14) return 6
  if (daysSinceLastActive <= 30) return 4
  if (daysSinceLastActive <= 60) return 2
  return 0
}

// Determine tier based on total score
function determineTier(score: number): FanTier {
  if (score >= 75) return 'SUPERFAN'
  if (score >= 50) return 'DEDICATED'
  if (score >= 25) return 'ENGAGED'
  return 'CASUAL'
}

export function calculateStanScore(input: ScoreInput): ScoreBreakdown {
  const platformScore = calculatePlatformScore(input.platformLinks)
  const engagementScore = calculateEngagementScore(input.platformLinks)
  const longevityScore = calculateLongevityScore(input.firstSeenAt)
  const recencyScore = calculateRecencyScore(input.lastActiveAt)

  const totalScore = platformScore + engagementScore + longevityScore + recencyScore
  const tier = determineTier(totalScore)

  return {
    platformScore,
    engagementScore,
    longevityScore,
    recencyScore,
    totalScore: Math.min(totalScore, 100),
    tier,
  }
}

export function getTierFromScore(score: number): FanTier {
  return determineTier(score)
}
