import { faker } from '@faker-js/faker'
import { Platform, EventType, FanTier } from '@prisma/client'
import { calculateStanScore } from '@/lib/scoring/stan-score'

interface GeneratedPlatformLink {
  platform: Platform
  platformFanId: string
  streams?: number
  playlistAdds?: number
  saves?: number
  follows?: boolean
  likes?: number
  comments?: number
  shares?: number
  subscribed?: boolean
  videoViews?: number
  watchTime?: number
  emailOpens?: number
  emailClicks?: number
  firstSeenAt: Date
  lastActiveAt: Date
}

interface GeneratedEvent {
  eventType: EventType
  platform?: Platform
  description: string
  occurredAt: Date
}

interface GeneratedFan {
  displayName: string
  email: string
  avatarUrl?: string
  location: string
  city: string
  country: string
  stanScore: number
  tier: FanTier
  platformScore: number
  engagementScore: number
  longevityScore: number
  recencyScore: number
  firstSeenAt: Date
  lastActiveAt: Date
  platformLinks: GeneratedPlatformLink[]
  events: GeneratedEvent[]
}

const COUNTRIES = [
  { name: 'United States', cities: ['Los Angeles', 'New York', 'Chicago', 'Houston', 'Phoenix', 'Nashville', 'Atlanta', 'Miami', 'Seattle', 'Austin'] },
  { name: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Bristol'] },
  { name: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Edmonton'] },
  { name: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'] },
  { name: 'Germany', cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'] },
  { name: 'France', cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'] },
  { name: 'Brazil', cities: ['Sao Paulo', 'Rio de Janeiro', 'Brasilia', 'Salvador', 'Fortaleza'] },
  { name: 'Japan', cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya'] },
]

function generatePlatformLink(platform: Platform, firstSeenAt: Date): GeneratedPlatformLink {
  const lastActiveAt = faker.date.between({ from: firstSeenAt, to: new Date() })

  const base = {
    platform,
    platformFanId: faker.string.uuid(),
    firstSeenAt,
    lastActiveAt,
  }

  switch (platform) {
    case 'SPOTIFY':
      return {
        ...base,
        streams: faker.number.int({ min: 1, max: 500 }),
        playlistAdds: faker.number.int({ min: 0, max: 10 }),
        saves: faker.number.int({ min: 0, max: 20 }),
        follows: faker.datatype.boolean({ probability: 0.7 }),
      }
    case 'INSTAGRAM':
    case 'TIKTOK':
    case 'TWITTER':
      return {
        ...base,
        follows: faker.datatype.boolean({ probability: 0.8 }),
        likes: faker.number.int({ min: 0, max: 100 }),
        comments: faker.number.int({ min: 0, max: 20 }),
        shares: faker.number.int({ min: 0, max: 10 }),
      }
    case 'YOUTUBE':
      return {
        ...base,
        subscribed: faker.datatype.boolean({ probability: 0.6 }),
        videoViews: faker.number.int({ min: 1, max: 200 }),
        watchTime: faker.number.int({ min: 5, max: 300 }),
      }
    case 'EMAIL':
      return {
        ...base,
        emailOpens: faker.number.int({ min: 1, max: 30 }),
        emailClicks: faker.number.int({ min: 0, max: 15 }),
      }
    default:
      return base
  }
}

function generateEvents(
  platformLinks: GeneratedPlatformLink[],
  tier: FanTier,
  firstSeenAt: Date
): GeneratedEvent[] {
  const events: GeneratedEvent[] = []

  // First interaction event
  const firstPlatform = platformLinks[0]
  if (firstPlatform) {
    const firstEventType: Record<Platform, EventType> = {
      SPOTIFY: 'FIRST_STREAM',
      INSTAGRAM: 'FIRST_FOLLOW',
      TIKTOK: 'FIRST_FOLLOW',
      TWITTER: 'FIRST_FOLLOW',
      YOUTUBE: 'FIRST_FOLLOW',
      EMAIL: 'EMAIL_SUBSCRIBE',
    }
    events.push({
      eventType: firstEventType[firstPlatform.platform],
      platform: firstPlatform.platform,
      description: `First interaction on ${firstPlatform.platform.toLowerCase()}`,
      occurredAt: firstSeenAt,
    })
  }

  // Additional platform connections
  platformLinks.slice(1).forEach((link) => {
    events.push({
      eventType: 'FIRST_FOLLOW',
      platform: link.platform,
      description: `Started following on ${link.platform.toLowerCase()}`,
      occurredAt: faker.date.between({ from: firstSeenAt, to: link.lastActiveAt }),
    })
  })

  // Tier upgrades
  if (tier === 'ENGAGED' || tier === 'DEDICATED' || tier === 'SUPERFAN') {
    events.push({
      eventType: 'TIER_UPGRADE',
      description: 'Upgraded to Engaged tier',
      occurredAt: faker.date.between({ from: firstSeenAt, to: new Date() }),
    })
  }

  if (tier === 'DEDICATED' || tier === 'SUPERFAN') {
    events.push({
      eventType: 'TIER_UPGRADE',
      description: 'Upgraded to Dedicated tier',
      occurredAt: faker.date.between({ from: firstSeenAt, to: new Date() }),
    })
  }

  if (tier === 'SUPERFAN') {
    events.push({
      eventType: 'BECAME_SUPERFAN',
      description: 'Achieved Superfan status!',
      occurredAt: faker.date.recent({ days: 60 }),
    })
  }

  // Sort events by date
  return events.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
}

export function generateFan(platforms: Platform[]): GeneratedFan {
  const country = faker.helpers.arrayElement(COUNTRIES)
  const city = faker.helpers.arrayElement(country.cities)

  // Determine how many platforms this fan uses (1-3)
  const numPlatforms = Math.min(
    faker.number.int({ min: 1, max: 3 }),
    platforms.length
  )
  const fanPlatforms = faker.helpers.arrayElements(platforms, numPlatforms)

  // Generate random first seen date (between 1 year ago and 1 week ago)
  const firstSeenAt = faker.date.between({
    from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    to: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  })

  // Generate platform links
  const platformLinks = fanPlatforms.map((platform) =>
    generatePlatformLink(platform, firstSeenAt)
  )

  // Calculate stan score
  const lastActiveAt = platformLinks.reduce(
    (latest, link) => (link.lastActiveAt > latest ? link.lastActiveAt : latest),
    firstSeenAt
  )

  const scoreBreakdown = calculateStanScore({
    platformLinks,
    firstSeenAt,
    lastActiveAt,
  })

  // Generate events
  const events = generateEvents(platformLinks, scoreBreakdown.tier, firstSeenAt)

  return {
    displayName: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    avatarUrl: faker.datatype.boolean({ probability: 0.7 })
      ? faker.image.avatar()
      : undefined,
    location: `${city}, ${country.name}`,
    city,
    country: country.name,
    stanScore: scoreBreakdown.totalScore,
    tier: scoreBreakdown.tier,
    platformScore: scoreBreakdown.platformScore,
    engagementScore: scoreBreakdown.engagementScore,
    longevityScore: scoreBreakdown.longevityScore,
    recencyScore: scoreBreakdown.recencyScore,
    firstSeenAt,
    lastActiveAt,
    platformLinks,
    events,
  }
}

export function generateFans(count: number, platforms: Platform[]): GeneratedFan[] {
  return Array.from({ length: count }, () => generateFan(platforms))
}
