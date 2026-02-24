/**
 * Simulate a 200-user beta test with OnlyFans creators as the hypothetical ICP.
 *
 * Run: npx tsx scripts/simulate-onlyfans-beta.ts
 *
 * Tests whether OF creators/fans map to StanVault's scoring system.
 * Uses the REAL calculateStanScore() engine — no fake numbers.
 *
 * Creator segments (80 creators):
 *   - Top OF creators (high sub count, merch, social presence): 15
 *   - Mid-tier OF creators (steady subs, some social): 25
 *   - Micro OF creators (small audience, growing): 15
 *   - OF creators who also make music: 10
 *   - OF creators with Patreon/Ko-fi side: 10
 *   - Fitness/lifestyle OF creators: 5
 *
 * Fan segments (120 fans):
 *   - Paying subscribers ($10-50/mo, tipping): 30
 *   - Casual subscribers ($5-10/mo, browse only): 30
 *   - Social-only fans (follow IG/Twitter, don't sub): 25
 *   - Cross-platform superfans (sub + social + tip + merch): 15
 *   - Lurkers (found via link, minimal engagement): 20
 *
 * Hypothesis: Scores will be structurally low because:
 *   - No Spotify streams (kills Platform Score + Engagement)
 *   - No Dasham tips (kills 35-point Conviction ceiling)
 *   - OF subscription revenue is INVISIBLE to StanVault
 *   - Only Ko-fi/Patreon/Merch + social engagement contribute
 */

import { PrismaClient, Platform, FanTier, EventType } from '@prisma/client'
import { subDays } from 'date-fns'

const prisma = new PrismaClient()

const BETA_START = subDays(new Date(), 90)
const NOW = new Date()

// OF creator cities — dispersed, no geographic concentration
const OF_CITIES = [
  'Los Angeles', 'Miami', 'Las Vegas', 'London', 'New York',
  'Atlanta', 'Houston', 'Phoenix', 'Dallas', 'Orlando',
  'Toronto', 'Sydney', 'Dubai', 'Berlin', 'Barcelona',
]

// OF-adjacent niches
const OF_NICHES = [
  'Adult Content', 'Fitness', 'Cosplay', 'Lifestyle', 'ASMR',
  'Modeling', 'Dance', 'Cooking', 'Personal Training', 'Beauty',
]

// Email suffix to distinguish from music beta
const EMAIL_SUFFIX = '@of-beta.stanvault.test'

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function chance(pct: number): boolean {
  return Math.random() * 100 < pct
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// ============================================
// Creator (Artist) Generation
// ============================================

interface SimOFCreator {
  name: string
  email: string
  artistName: string
  genre: string // niche
  location: string
  betaCohort: string
  pricingTier: string
  acquisitionChannel: string
  retained: boolean
  joinDate: Date
  wave: number
  fanCount: number
  hasDasham: boolean
  hasBandcamp: boolean
  hasKofi: boolean
  hasPatreon: boolean
  hasMerch: boolean
  alsoMakesMusic: boolean
}

function generateOFCreators(): SimOFCreator[] {
  const creators: SimOFCreator[] = []
  let idx = 0

  const makeCreator = (
    cohort: string,
    tier: string,
    channel: string,
    wave: number,
    retentionRate: number,
    config: {
      niches: string[]
      cities: string[]
      fanRange: [number, number]
      hasDasham: boolean
      hasBandcamp: boolean
      hasKofi: boolean
      hasPatreon: boolean
      hasMerch: boolean
      alsoMakesMusic: boolean
    }
  ): SimOFCreator => {
    idx++
    const waveOffset = (wave - 1) * 14
    const joinDate = randomDate(
      subDays(BETA_START, -waveOffset),
      subDays(BETA_START, -(waveOffset + 13))
    )
    return {
      name: `OF Creator ${idx}`,
      email: `of.creator${idx}${EMAIL_SUFFIX}`,
      artistName: `${pick(['Goddess', 'Princess', 'Queen', 'Miss', 'Lady', 'The'])} ${pick(['Luna', 'Jade', 'Ruby', 'Sapphire', 'Destiny', 'Nova', 'Raven', 'Phoenix', 'Storm', 'Blaze'])} ${idx}`,
      genre: pick(config.niches),
      location: pick(config.cities),
      betaCohort: cohort,
      pricingTier: tier,
      acquisitionChannel: channel,
      retained: chance(retentionRate),
      joinDate,
      wave,
      fanCount: rand(...config.fanRange),
      hasDasham: config.hasDasham,
      hasBandcamp: config.hasBandcamp,
      hasKofi: config.hasKofi,
      hasPatreon: config.hasPatreon,
      hasMerch: config.hasMerch,
      alsoMakesMusic: config.alsoMakesMusic,
    }
  }

  // Top OF creators — 15
  // High social following, some merch, NO music, NO Dasham
  // Retention: LOW (~20%) — they already have OF analytics, StanVault adds little
  for (let i = 0; i < 15; i++) {
    creators.push(
      makeCreator('CORE_AFROBEATS', 'STARTER', 'COLD_SIGNUP', 1, 20, {
        niches: ['Adult Content', 'Modeling', 'Cosplay'],
        cities: OF_CITIES,
        fanRange: [8, 25],
        hasDasham: false,
        hasBandcamp: false,
        hasKofi: chance(10), // Very few top OF creators use Ko-fi
        hasPatreon: chance(15), // Some have backup Patreon
        hasMerch: chance(30), // Some sell merch
        alsoMakesMusic: false,
      })
    )
  }

  // Mid-tier OF creators — 25
  // Moderate social, minimal cross-platform
  // Retention: VERY LOW (~12%) — scoring feels useless
  for (let i = 0; i < 25; i++) {
    creators.push(
      makeCreator('DIRECT_TO_FAN_INDIE', 'STARTER', 'COLD_SIGNUP', 1, 12, {
        niches: ['Adult Content', 'Fitness', 'ASMR', 'Dance'],
        cities: OF_CITIES,
        fanRange: [5, 15],
        hasDasham: false,
        hasBandcamp: false,
        hasKofi: chance(8),
        hasPatreon: chance(10),
        hasMerch: chance(15),
        alsoMakesMusic: false,
      })
    )
  }

  // Micro OF creators — 15
  // Small audience, grinding, looking for any edge
  // Retention: LOW (~15%) — might stay hoping scoring helps, but signals are thin
  for (let i = 0; i < 15; i++) {
    creators.push(
      makeCreator('EXPERIMENTAL_NICHE', 'STARTER', 'COLD_SIGNUP', 2, 15, {
        niches: OF_NICHES,
        cities: OF_CITIES,
        fanRange: [3, 10],
        hasDasham: false,
        hasBandcamp: false,
        hasKofi: chance(5),
        hasPatreon: chance(5),
        hasMerch: chance(10),
        alsoMakesMusic: false,
      })
    )
  }

  // OF creators who ALSO make music — 10
  // THE EXCEPTION: These creators have Spotify, sometimes Bandcamp
  // Retention: MODERATE (~45%) — scoring actually works for their music side
  for (let i = 0; i < 10; i++) {
    creators.push(
      makeCreator('DIASPORA', 'STARTER', 'MUSIC_TWITTER', 2, 45, {
        niches: ['Music', 'Dance', 'Lifestyle'],
        cities: ['Los Angeles', 'Atlanta', 'London', 'New York', 'Miami'],
        fanRange: [8, 25],
        hasDasham: false,
        hasBandcamp: chance(50),
        hasKofi: chance(30),
        hasPatreon: chance(40),
        hasMerch: chance(40),
        alsoMakesMusic: true,
      })
    )
  }

  // OF creators with Patreon/Ko-fi side — 10
  // Use Ko-fi/Patreon for SFW content alongside OF
  // Retention: LOW (~25%) — Ko-fi/Patreon signals fire but ceiling is low
  for (let i = 0; i < 10; i++) {
    creators.push(
      makeCreator('INDIE_HIPHOP_RNB', 'STARTER', 'BANDCAMP_OUTREACH', 3, 25, {
        niches: ['Cosplay', 'Art', 'Fitness', 'Cooking', 'Beauty'],
        cities: OF_CITIES,
        fanRange: [5, 15],
        hasDasham: false,
        hasBandcamp: false,
        hasKofi: true, // Always has Ko-fi
        hasPatreon: chance(60), // Often has Patreon too
        hasMerch: chance(30),
        alsoMakesMusic: false,
      })
    )
  }

  // Fitness/lifestyle OF creators — 5
  // YouTube presence, some email lists
  // Retention: LOW (~18%) — YouTube engagement helps slightly
  for (let i = 0; i < 5; i++) {
    creators.push(
      makeCreator('PRODUCER_DJ', 'STARTER', 'COLD_SIGNUP', 3, 18, {
        niches: ['Fitness', 'Personal Training', 'Lifestyle'],
        cities: OF_CITIES,
        fanRange: [5, 15],
        hasDasham: false,
        hasBandcamp: false,
        hasKofi: chance(20),
        hasPatreon: chance(30),
        hasMerch: chance(40),
        alsoMakesMusic: false,
      })
    )
  }

  return creators
}

// ============================================
// OF Fan Generation
// ============================================

interface SimOFFan {
  displayName: string
  email: string
  city: string
  betaCohort: string
  retained: boolean
  joinDate: Date
  // Engagement profile — KEY: OF fans have VERY different behavior
  streams: number // Only non-zero if creator makes music
  hasDashamTips: boolean // Always false
  tipAmountUsd: number
  tipCount: number
  hasKofiPurchase: boolean
  hasPatreonSub: boolean
  hasMerchPurchase: boolean
  kofiAmountUsd: number
  patreonMonths: number
  merchAmountUsd: number
  // Social engagement
  instagramFollows: boolean
  instagramLikes: number
  instagramComments: number
  twitterFollows: boolean
  twitterLikes: number
  youtubeSubscribed: boolean
  youtubeViews: number
  emailOpens: number
  emailClicks: number
  // OF-specific (INVISIBLE to StanVault)
  ofSubscriptionMonthly: number // What they pay on OF — StanVault can't see this
  ofTipsTotal: number // OF tips — StanVault can't see this
  ofPPVPurchases: number // OF PPV — StanVault can't see this
  hasSpotifyVerified: boolean
  artistCount: number
}

function generateOFFan(
  creator: SimOFCreator,
  fanIdx: number,
  fanCohort: string,
  retentionRate: number
): SimOFFan {
  const isPayingSub = fanCohort === 'DEEP_AFRICAN' // Repurposing enum: paying subscribers
  const isCasualSub = fanCohort === 'DIASPORA_SUPERFAN' // Casual subs
  const isSocialOnly = fanCohort === 'BANDCAMP_KOFI_SUPPORTER' // Social-only fans
  const isCrossPlatform = fanCohort === 'STREET_TEAM_LEADER' // Cross-platform superfans
  const isLurker = fanCohort === 'COLD_SIGNUP' // Lurkers

  const retained = chance(retentionRate)
  const joinDate = randomDate(creator.joinDate, subDays(NOW, 30))

  // OF-specific revenue (INVISIBLE to StanVault scoring)
  let ofSubscriptionMonthly = 0
  let ofTipsTotal = 0
  let ofPPVPurchases = 0

  // StanVault-visible signals
  let streams = 0
  let hasKofiPurchase = false
  let hasPatreonSub = false
  let hasMerchPurchase = false
  let kofiAmountUsd = 0
  let patreonMonths = 0
  let merchAmountUsd = 0
  let instagramFollows = false
  let instagramLikes = 0
  let instagramComments = 0
  let twitterFollows = false
  let twitterLikes = 0
  let youtubeSubscribed = false
  let youtubeViews = 0
  let emailOpens = 0
  let emailClicks = 0

  if (isPayingSub) {
    // PAYING SUBSCRIBER: spends $15-50/mo on OF, tips heavily
    // But StanVault can only see their social engagement + maybe Ko-fi
    ofSubscriptionMonthly = rand(15, 50)
    ofTipsTotal = rand(20, 500)
    ofPPVPurchases = rand(5, 30)
    // Visible signals are MINIMAL relative to actual spend
    instagramFollows = chance(80)
    instagramLikes = rand(5, 30)
    instagramComments = rand(1, 10)
    twitterFollows = chance(60)
    twitterLikes = rand(2, 15)
    hasKofiPurchase = creator.hasKofi ? chance(10) : false // Very few sub on Ko-fi TOO
    if (hasKofiPurchase) kofiAmountUsd = rand(3, 15)
    hasMerchPurchase = creator.hasMerch ? chance(15) : false
    if (hasMerchPurchase) merchAmountUsd = rand(15, 60)
    emailOpens = chance(30) ? rand(1, 5) : 0
    emailClicks = emailOpens > 0 ? rand(0, 2) : 0
    // Music streams only if creator makes music
    if (creator.alsoMakesMusic) streams = rand(20, 100)
  } else if (isCasualSub) {
    // CASUAL SUBSCRIBER: $5-10/mo, browses, minimal interaction
    ofSubscriptionMonthly = rand(5, 10)
    ofTipsTotal = rand(0, 20)
    ofPPVPurchases = rand(0, 5)
    // Even less visible
    instagramFollows = chance(50)
    instagramLikes = rand(0, 10)
    twitterFollows = chance(30)
    twitterLikes = rand(0, 5)
    if (creator.alsoMakesMusic) streams = rand(5, 30)
  } else if (isSocialOnly) {
    // SOCIAL-ONLY: follows on IG/Twitter, never subscribed to OF
    ofSubscriptionMonthly = 0
    ofTipsTotal = 0
    instagramFollows = true
    instagramLikes = rand(10, 50) // Very active on social
    instagramComments = rand(3, 15)
    twitterFollows = chance(80)
    twitterLikes = rand(5, 25)
    youtubeSubscribed = chance(40)
    youtubeViews = youtubeSubscribed ? rand(5, 50) : 0
    if (creator.alsoMakesMusic) streams = rand(10, 60)
  } else if (isCrossPlatform) {
    // CROSS-PLATFORM SUPERFAN: OF sub + social + Ko-fi/Patreon + maybe merch
    // This is the BEST CASE for StanVault scoring on OF fans
    ofSubscriptionMonthly = rand(20, 50)
    ofTipsTotal = rand(50, 300)
    ofPPVPurchases = rand(10, 40)
    instagramFollows = true
    instagramLikes = rand(15, 50)
    instagramComments = rand(5, 20)
    twitterFollows = true
    twitterLikes = rand(10, 30)
    youtubeSubscribed = chance(60)
    youtubeViews = youtubeSubscribed ? rand(10, 80) : 0
    hasKofiPurchase = creator.hasKofi ? chance(50) : false
    if (hasKofiPurchase) kofiAmountUsd = rand(5, 30)
    hasPatreonSub = creator.hasPatreon ? chance(40) : false
    if (hasPatreonSub) patreonMonths = rand(2, 12)
    hasMerchPurchase = creator.hasMerch ? chance(40) : false
    if (hasMerchPurchase) merchAmountUsd = rand(20, 80)
    emailOpens = rand(3, 10)
    emailClicks = rand(1, 5)
    if (creator.alsoMakesMusic) streams = rand(50, 200)
  } else if (isLurker) {
    // LURKER: clicked a link, maybe followed on one platform
    ofSubscriptionMonthly = 0
    ofTipsTotal = 0
    instagramFollows = chance(20)
    instagramLikes = rand(0, 3)
    twitterFollows = chance(15)
    if (creator.alsoMakesMusic) streams = rand(0, 10)
  }

  return {
    displayName: `OF Fan ${fanCohort.slice(0, 4)}-${fanIdx}`,
    email: `of.fan.${fanCohort.toLowerCase().replace(/_/g, '')}.${fanIdx}${EMAIL_SUFFIX}`,
    city: pick(OF_CITIES),
    betaCohort: fanCohort,
    retained,
    joinDate,
    streams,
    hasDashamTips: false, // OF fans NEVER tip on Dasham
    tipAmountUsd: 0,
    tipCount: 0,
    hasKofiPurchase,
    hasPatreonSub,
    hasMerchPurchase,
    kofiAmountUsd,
    patreonMonths,
    merchAmountUsd,
    instagramFollows,
    instagramLikes,
    instagramComments,
    twitterFollows,
    twitterLikes,
    youtubeSubscribed,
    youtubeViews,
    emailOpens,
    emailClicks,
    ofSubscriptionMonthly,
    ofTipsTotal,
    ofPPVPurchases,
    hasSpotifyVerified: creator.alsoMakesMusic ? chance(50) : chance(10), // Most OF fans don't have Spotify to verify
    artistCount: isCrossPlatform ? rand(2, 4) : 1,
  }
}

// ============================================
// Database Operations
// ============================================

async function createSimulatedCreator(creator: SimOFCreator): Promise<string> {
  const user = await prisma.user.create({
    data: {
      email: creator.email,
      name: creator.name,
      artistName: creator.artistName,
      genre: creator.genre,
      location: creator.location,
      pricingTier: creator.pricingTier as any,
      betaCohort: creator.betaCohort as any,
      acquisitionChannel: creator.acquisitionChannel as any,
      betaInviteCode: `SIM-OF-${creator.betaCohort.slice(0, 4)}-${Date.now()}`,
      betaJoinedAt: creator.joinDate,
      onboardingCompleted: true,
      createdAt: creator.joinDate,
      updatedAt: creator.retained ? randomDate(subDays(NOW, 7), NOW) : randomDate(subDays(NOW, 90), subDays(NOW, 35)),
    },
  })
  return user.id
}

async function createSimulatedOFFanRecord(
  creatorId: string,
  creatorCity: string,
  fan: SimOFFan,
  creator: SimOFCreator
): Promise<void> {
  const lastActive = fan.retained
    ? randomDate(subDays(NOW, 14), NOW)
    : randomDate(subDays(NOW, 90), subDays(NOW, 40))

  const fanRecord = await prisma.fan.create({
    data: {
      userId: creatorId,
      displayName: fan.displayName,
      email: fan.email,
      city: fan.city,
      stanScore: 0,
      tier: 'CASUAL',
      firstSeenAt: fan.joinDate,
      lastActiveAt: lastActive,
      createdAt: fan.joinDate,
    },
  })

  // Create platform links — THIS is where the scoring gap becomes visible
  // OF fans' primary platform (OnlyFans) is NOT in the Platform enum

  // Spotify — only if creator makes music AND fan listens
  if (fan.streams > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id,
        platform: Platform.SPOTIFY,
        streams: fan.streams,
        playlistAdds: rand(0, Math.floor(fan.streams / 30)),
        saves: rand(0, Math.floor(fan.streams / 20)),
        follows: chance(40),
        firstSeenAt: fan.joinDate,
        lastActiveAt: lastActive,
      },
    })
  }

  // Instagram engagement
  if (fan.instagramFollows || fan.instagramLikes > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id,
        platform: Platform.INSTAGRAM,
        follows: fan.instagramFollows,
        likes: fan.instagramLikes,
        comments: fan.instagramComments,
        shares: rand(0, 2),
        firstSeenAt: fan.joinDate,
        lastActiveAt: lastActive,
      },
    })
  }

  // Twitter engagement
  if (fan.twitterFollows || fan.twitterLikes > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id,
        platform: Platform.TWITTER,
        follows: fan.twitterFollows,
        likes: fan.twitterLikes,
        comments: rand(0, 3),
        shares: rand(0, 2),
        firstSeenAt: fan.joinDate,
        lastActiveAt: lastActive,
      },
    })
  }

  // YouTube
  if (fan.youtubeSubscribed || fan.youtubeViews > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id,
        platform: Platform.YOUTUBE,
        subscribed: fan.youtubeSubscribed,
        videoViews: fan.youtubeViews,
        firstSeenAt: fan.joinDate,
        lastActiveAt: lastActive,
      },
    })
  }

  // Email
  if (fan.emailOpens > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id,
        platform: Platform.EMAIL,
        emailOpens: fan.emailOpens,
        emailClicks: fan.emailClicks,
        firstSeenAt: fan.joinDate,
        lastActiveAt: lastActive,
      },
    })
  }

  // Ko-fi purchases
  if (fan.hasKofiPurchase) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id,
        platform: Platform.KOFI,
        purchaseCount: rand(1, 3),
        purchaseAmountUsd: fan.kofiAmountUsd,
        firstSeenAt: fan.joinDate,
        lastActiveAt: lastActive,
      },
    })
  }

  // Patreon subscription
  if (fan.hasPatreonSub) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id,
        platform: Platform.PATREON,
        subscriptionMonths: fan.patreonMonths,
        purchaseCount: fan.patreonMonths,
        purchaseAmountUsd: fan.patreonMonths * rand(5, 20),
        firstSeenAt: fan.joinDate,
        lastActiveAt: lastActive,
      },
    })
  }

  // Merch purchases
  if (fan.hasMerchPurchase) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id,
        platform: Platform.MERCH,
        purchaseCount: rand(1, 3),
        purchaseAmountUsd: fan.merchAmountUsd,
        firstSeenAt: fan.joinDate,
        lastActiveAt: lastActive,
      },
    })
  }

  // Now calculate the real score using the ACTUAL scoring system
  const allLinks = await prisma.fanPlatformLink.findMany({
    where: { fanId: fanRecord.id },
  })

  const { calculateStanScore } = await import('../src/lib/scoring/stan-score')
  const scoreResult = calculateStanScore({
    platformLinks: allLinks.map((l) => ({
      platform: l.platform,
      streams: l.streams,
      playlistAdds: l.playlistAdds,
      saves: l.saves,
      follows: l.follows,
      likes: l.likes,
      comments: l.comments,
      shares: l.shares,
      subscribed: l.subscribed,
      videoViews: l.videoViews,
      watchTime: l.watchTime,
      emailOpens: l.emailOpens,
      emailClicks: l.emailClicks,
      tipCount: l.tipCount,
      tipAmountUsd: l.tipAmountUsd,
      tipFrequency: l.tipFrequency,
      momentSaves: l.momentSaves,
      cityAffiliation: l.cityAffiliation,
      purchaseCount: l.purchaseCount,
      purchaseAmountUsd: l.purchaseAmountUsd,
      subscriptionMonths: l.subscriptionMonths,
    })),
    firstSeenAt: fan.joinDate,
    lastActiveAt: lastActive,
    artistCity: creatorCity,
  })

  await prisma.fan.update({
    where: { id: fanRecord.id },
    data: {
      stanScore: scoreResult.totalScore,
      tier: scoreResult.tier,
      convictionScore: scoreResult.convictionScore,
      platformScore: scoreResult.platformScore,
      engagementScore: scoreResult.engagementScore,
      longevityScore: scoreResult.longevityScore,
      recencyScore: scoreResult.recencyScore,
    },
  })

  // Track the INVISIBLE revenue for comparison
  if (fan.ofSubscriptionMonthly > 0 || fan.ofTipsTotal > 0) {
    await prisma.fanEvent.create({
      data: {
        fanId: fanRecord.id,
        eventType: EventType.FIRST_STREAM, // Repurpose to log invisible OF data
        platform: Platform.INSTAGRAM, // No OF platform enum
        description: `[INVISIBLE TO SCORING] OF sub: $${fan.ofSubscriptionMonthly}/mo, tips: $${fan.ofTipsTotal}, PPV: ${fan.ofPPVPurchases}. Total spend: $${fan.ofSubscriptionMonthly * 3 + fan.ofTipsTotal}. Stan Score: ${scoreResult.totalScore} (${scoreResult.tier})`,
        occurredAt: fan.joinDate,
      },
    })
  }
}

async function createSimulatedOFFanUser(fan: SimOFFan): Promise<string> {
  const fanUser = await prisma.fanUser.create({
    data: {
      email: fan.email,
      displayName: fan.displayName,
      betaCohort: fan.betaCohort as any,
      acquisitionChannel: 'COLD_SIGNUP' as any,
      betaInviteCode: `SIM-OF-FAN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      betaJoinedAt: fan.joinDate,
      onboardingCompleted: fan.hasSpotifyVerified,
      spotifyUserId: fan.hasSpotifyVerified ? `spotify_of_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : null,
      createdAt: fan.joinDate,
      updatedAt: fan.retained ? randomDate(subDays(NOW, 14), NOW) : randomDate(subDays(NOW, 90), subDays(NOW, 40)),
    },
  })
  return fanUser.id
}

// ============================================
// Main Simulation
// ============================================

async function main() {
  console.log('=== StanVault OnlyFans ICP Stress Test ===\n')
  console.log('Testing hypothesis: OF creators are structurally excluded from StanVault value.\n')

  // Clean up previous OF simulation data
  const existingSim = await prisma.user.count({
    where: { email: { endsWith: EMAIL_SUFFIX } },
  })
  if (existingSim > 0) {
    console.log(`Cleaning up ${existingSim} existing OF simulation users...`)
    const simUsers = await prisma.user.findMany({
      where: { email: { endsWith: EMAIL_SUFFIX } },
      select: { id: true },
    })
    const simUserIds = simUsers.map((u) => u.id)

    await prisma.fanEvent.deleteMany({ where: { fan: { userId: { in: simUserIds } } } })
    await prisma.fanSnapshot.deleteMany({ where: { fan: { userId: { in: simUserIds } } } })
    await prisma.fanPlatformLink.deleteMany({ where: { fan: { userId: { in: simUserIds } } } })
    await prisma.listeningEvent.deleteMany({ where: { fan: { userId: { in: simUserIds } } } })
    await prisma.dropClaim.deleteMany({ where: { drop: { userId: { in: simUserIds } } } })
    await prisma.drop.deleteMany({ where: { userId: { in: simUserIds } } })
    await prisma.fanUserArtistLink.deleteMany({ where: { artistId: { in: simUserIds } } })
    await prisma.fan.deleteMany({ where: { userId: { in: simUserIds } } })
    await prisma.user.deleteMany({ where: { id: { in: simUserIds } } })

    await prisma.fanUserSession.deleteMany({
      where: { fanUser: { email: { endsWith: EMAIL_SUFFIX } } },
    })
    await prisma.fanUserArtistLink.deleteMany({
      where: { fanUser: { email: { endsWith: EMAIL_SUFFIX } } },
    })
    await prisma.dropClaim.deleteMany({
      where: { fanUser: { email: { endsWith: EMAIL_SUFFIX } } },
    })
    await prisma.fanUser.deleteMany({ where: { email: { endsWith: EMAIL_SUFFIX } } })

    console.log('Cleanup complete.\n')
  }

  // Generate creators
  const creators = generateOFCreators()
  console.log(`Generating ${creators.length} OF creators...\n`)

  const creatorRecords: Array<{ id: string; creator: SimOFCreator }> = []
  const cohortStats: Record<string, { total: number; retained: number; label: string }> = {
    'CORE_AFROBEATS': { total: 0, retained: 0, label: 'Top OF Creators' },
    'DIRECT_TO_FAN_INDIE': { total: 0, retained: 0, label: 'Mid-Tier OF Creators' },
    'EXPERIMENTAL_NICHE': { total: 0, retained: 0, label: 'Micro OF Creators' },
    'DIASPORA': { total: 0, retained: 0, label: 'OF + Music Creators' },
    'INDIE_HIPHOP_RNB': { total: 0, retained: 0, label: 'OF + Ko-fi/Patreon' },
    'PRODUCER_DJ': { total: 0, retained: 0, label: 'Fitness/Lifestyle OF' },
  }

  for (const creator of creators) {
    const id = await createSimulatedCreator(creator)
    creatorRecords.push({ id, creator })
    cohortStats[creator.betaCohort].total++
    if (creator.retained) cohortStats[creator.betaCohort].retained++
  }

  console.log('Creator cohort breakdown:')
  for (const [cohort, stats] of Object.entries(cohortStats)) {
    const rate = stats.total ? Math.round((stats.retained / stats.total) * 100) : 0
    console.log(`  ${stats.label.padEnd(24)} (${cohort}): ${stats.total} total, ${stats.retained} retained (${rate}%)`)
  }

  // Generate fans
  console.log('\nGenerating OF fans and platform data...\n')

  // Fan cohorts — mapped to existing enums but representing OF fan segments
  const fanCohortAlloc = [
    { cohort: 'DEEP_AFRICAN', count: 30, retentionRate: 15, label: 'Paying Subscribers' },
    { cohort: 'DIASPORA_SUPERFAN', count: 30, retentionRate: 10, label: 'Casual Subscribers' },
    { cohort: 'BANDCAMP_KOFI_SUPPORTER', count: 25, retentionRate: 20, label: 'Social-Only Fans' },
    { cohort: 'STREET_TEAM_LEADER', count: 15, retentionRate: 30, label: 'Cross-Platform Superfans' },
    { cohort: 'COLD_SIGNUP', count: 20, retentionRate: 5, label: 'Lurkers' },
  ]

  let totalFans = 0
  let totalFanUsers = 0
  const fanUserIds: string[] = []
  const fanCohortStats: Record<string, { total: number; retained: number; verified: number; label: string }> = {}

  // Track invisible vs visible revenue
  let totalInvisibleRevenue = 0
  let totalVisibleRevenue = 0

  for (const alloc of fanCohortAlloc) {
    fanCohortStats[alloc.cohort] = { total: 0, retained: 0, verified: 0, label: alloc.label }

    for (let i = 0; i < alloc.count; i++) {
      const targetCreator = pick(creatorRecords)
      const fan = generateOFFan(targetCreator.creator, i + 1, alloc.cohort, alloc.retentionRate)

      await createSimulatedOFFanRecord(targetCreator.id, targetCreator.creator.location, fan, targetCreator.creator)
      totalFans++

      // Track invisible vs visible revenue
      const invisibleRevenue = (fan.ofSubscriptionMonthly * 3) + fan.ofTipsTotal // 3 months of sub
      const visibleRevenue = fan.kofiAmountUsd + (fan.patreonMonths * 10) + fan.merchAmountUsd
      totalInvisibleRevenue += invisibleRevenue
      totalVisibleRevenue += visibleRevenue

      const fanUserId = await createSimulatedOFFanUser(fan)
      fanUserIds.push(fanUserId)
      totalFanUsers++

      fanCohortStats[alloc.cohort].total++
      if (fan.retained) fanCohortStats[alloc.cohort].retained++
      if (fan.hasSpotifyVerified) fanCohortStats[alloc.cohort].verified++

      await prisma.fanUserArtistLink.create({
        data: {
          fanUserId,
          artistId: targetCreator.id,
          verified: fan.hasSpotifyVerified,
          verifiedAt: fan.hasSpotifyVerified ? randomDate(fan.joinDate, NOW) : null,
          verifiedVia: fan.hasSpotifyVerified ? 'spotify' : null,
          tier: 'CASUAL',
          stanScore: 0,
          totalStreams: fan.streams,
          isFollowing: chance(40),
          firstSeenAt: fan.joinDate,
          lastActiveAt: fan.retained ? randomDate(subDays(NOW, 14), NOW) : randomDate(subDays(NOW, 90), subDays(NOW, 40)),
        },
      })

      if (fan.artistCount > 1) {
        const otherCreators = creatorRecords.filter((c) => c.id !== targetCreator.id)
        for (let j = 1; j < fan.artistCount && otherCreators.length > 0; j++) {
          const other = pick(otherCreators)
          try {
            await prisma.fanUserArtistLink.create({
              data: {
                fanUserId,
                artistId: other.id,
                verified: chance(30),
                verifiedAt: chance(30) ? randomDate(fan.joinDate, NOW) : null,
                verifiedVia: chance(30) ? 'spotify' : null,
                tier: 'CASUAL',
                stanScore: 0,
                totalStreams: rand(0, 20),
                isFollowing: chance(30),
                firstSeenAt: fan.joinDate,
                lastActiveAt: fan.retained ? randomDate(subDays(NOW, 14), NOW) : randomDate(subDays(NOW, 90), subDays(NOW, 40)),
              },
            })
          } catch {
            // Skip duplicates
          }
        }
      }
    }
  }

  console.log('Fan cohort breakdown:')
  for (const [cohort, stats] of Object.entries(fanCohortStats)) {
    const retRate = stats.total ? Math.round((stats.retained / stats.total) * 100) : 0
    const verRate = stats.total ? Math.round((stats.verified / stats.total) * 100) : 0
    console.log(`  ${stats.label.padEnd(26)} (${cohort}): ${stats.total} total, ${stats.retained} retained (${retRate}%), ${stats.verified} verified (${verRate}%)`)
  }

  // Generate drops
  console.log('\nGenerating drops and claims...\n')

  let totalDrops = 0
  let totalClaims = 0

  for (const { id, creator } of creatorRecords) {
    if (!creator.retained) continue
    const dropCount = rand(0, 3) // OF creators create fewer drops — less obvious use case

    for (let d = 0; d < dropCount; d++) {
      const drop = await prisma.drop.create({
        data: {
          userId: id,
          slug: `sim-of-${creator.artistName.replace(/\s+/g, '-').toLowerCase()}-drop-${d + 1}-${Date.now()}`,
          title: pick([
            'Exclusive Photo Set',
            'Behind the Scenes',
            'Early Access Content',
            'Custom Shoutout',
            'Free Trial Link',
            'Merch Discount Code',
          ]),
          contentType: pick(['DOWNLOAD', 'LINK', 'MESSAGE']),
          minTier: pick(['CASUAL', 'ENGAGED', null]) as FanTier | null,
          isActive: true,
          createdAt: randomDate(creator.joinDate, NOW),
        },
      })
      totalDrops++

      const claimCount = rand(0, Math.min(2, fanUserIds.length))
      for (let c = 0; c < claimCount; c++) {
        const claimFanId = pick(fanUserIds)
        try {
          await prisma.dropClaim.create({
            data: {
              dropId: drop.id,
              fanUserId: claimFanId,
              tier: pick(['CASUAL', 'ENGAGED']),
              stanScore: rand(5, 40), // Lower scores expected
              claimedAt: randomDate(drop.createdAt, NOW),
            },
          })
          totalClaims++
        } catch {
          // Skip duplicates
        }
      }
    }
  }

  console.log(`Created ${totalDrops} drops with ${totalClaims} claims\n`)

  // Final summary
  console.log('=== OF Simulation Complete ===\n')
  console.log(`  Creators: ${creators.length}`)
  console.log(`  Fans (scored records): ${totalFans}`)
  console.log(`  Fan users (accounts): ${totalFanUsers}`)
  console.log(`  Drops: ${totalDrops}`)
  console.log(`  Claims: ${totalClaims}`)

  // Score distribution
  const allFans = await prisma.fan.findMany({
    where: { user: { email: { endsWith: EMAIL_SUFFIX } } },
    select: { stanScore: true, tier: true, convictionScore: true, engagementScore: true, platformScore: true, longevityScore: true, recencyScore: true },
  })

  const tierCounts = { CASUAL: 0, ENGAGED: 0, DEDICATED: 0, SUPERFAN: 0 }
  let totalScore = 0
  let totalConviction = 0
  let totalEngagement = 0
  let totalPlatform = 0
  let withConviction = 0

  for (const fan of allFans) {
    tierCounts[fan.tier]++
    totalScore += fan.stanScore
    totalConviction += fan.convictionScore
    totalEngagement += fan.engagementScore
    totalPlatform += fan.platformScore
    if (fan.convictionScore > 0) withConviction++
  }

  const n = allFans.length || 1
  console.log(`\n  Score Distribution:`)
  console.log(`    CASUAL:    ${tierCounts.CASUAL}`)
  console.log(`    ENGAGED:   ${tierCounts.ENGAGED}`)
  console.log(`    DEDICATED: ${tierCounts.DEDICATED}`)
  console.log(`    SUPERFAN:  ${tierCounts.SUPERFAN}`)
  console.log(`    Avg Score: ${(totalScore / n).toFixed(1)}`)
  console.log(`    Avg Conviction: ${(totalConviction / n).toFixed(1)}`)
  console.log(`    Avg Engagement: ${(totalEngagement / n).toFixed(1)}`)
  console.log(`    Avg Platform: ${(totalPlatform / n).toFixed(1)}`)
  console.log(`    Fans with conviction > 0: ${withConviction}/${allFans.length} (${allFans.length > 0 ? Math.round((withConviction / allFans.length) * 100) : 0}%)`)

  // THE KEY INSIGHT: invisible vs visible revenue
  console.log(`\n  === REVENUE VISIBILITY GAP ===`)
  console.log(`    Total fan spend on OF (INVISIBLE to StanVault): $${totalInvisibleRevenue.toLocaleString()}`)
  console.log(`    Total fan spend on Ko-fi/Patreon/Merch (VISIBLE): $${totalVisibleRevenue.toLocaleString()}`)
  console.log(`    Revenue visibility: ${totalVisibleRevenue > 0 ? ((totalVisibleRevenue / (totalInvisibleRevenue + totalVisibleRevenue)) * 100).toFixed(1) : '0.0'}%`)
  console.log(`    StanVault sees ${totalVisibleRevenue > 0 ? ((totalVisibleRevenue / (totalInvisibleRevenue + totalVisibleRevenue)) * 100).toFixed(1) : '0.0'}% of actual fan spend — the rest is invisible.`)

  // Compare with music beta
  console.log(`\n  === COMPARISON: Music Beta vs OF Beta ===`)
  console.log(`    Music beta avg score:     42.8`)
  console.log(`    OF beta avg score:        ${(totalScore / n).toFixed(1)}`)
  console.log(`    Music beta SUPERFAN:      10/561 (1.8%)`)
  console.log(`    OF beta SUPERFAN:         ${tierCounts.SUPERFAN}/${allFans.length} (${allFans.length > 0 ? ((tierCounts.SUPERFAN / allFans.length) * 100).toFixed(1) : '0'}%)`)
  console.log(`    Music conviction avg:     2.7`)
  console.log(`    OF conviction avg:        ${(totalConviction / n).toFixed(1)}`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
