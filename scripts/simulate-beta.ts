/**
 * Simulate the 200-user beta test.
 *
 * Run: npx tsx scripts/simulate-beta.ts
 *
 * Creates 80 simulated artists + 120 fans with realistic:
 * - Platform engagement data (Spotify, Dasham, Bandcamp, etc.)
 * - Drops and claims
 * - Retention patterns matching ICP analysis predictions
 * - Score distributions that test the conviction scoring system
 *
 * Retention targets (from BETA_200_USER_PLAN.md):
 *   Core ICP (Afrobeats + Diaspora + Managers): ~75%
 *   Starter tier: ~40%
 *   Fan 90-day: ~48%
 */

import { PrismaClient, Platform, FanTier, EventType } from '@prisma/client'
import { subDays, subMonths } from 'date-fns'

const prisma = new PrismaClient()

// ============================================
// Config
// ============================================

const BETA_START = subDays(new Date(), 90) // Simulate 90 days ago
const NOW = new Date()

const CITIES = {
  african: ['Lagos', 'Nairobi', 'Johannesburg', 'Accra', 'Kampala'],
  diaspora: ['London', 'Atlanta', 'Toronto', 'New York', 'Paris'],
  western: ['Los Angeles', 'Chicago', 'Berlin', 'Amsterdam', 'Tokyo'],
}

const AFRO_GENRES = ['Afrobeats', 'Amapiano', 'Afropop', 'Afro-fusion', 'Afro-R&B']
const INDIE_GENRES = ['Indie Pop', 'Indie Rock', 'Experimental', 'Electronic', 'Alt-R&B']
const HIPHOP_GENRES = ['Hip-Hop', 'R&B', 'Trap', 'Conscious Rap', 'Neo-Soul']

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
// Artist Generation
// ============================================

interface SimArtist {
  name: string
  email: string
  artistName: string
  genre: string
  location: string
  betaCohort: string
  pricingTier: string
  acquisitionChannel: string
  retained: boolean // Will this artist still be active at day 90?
  joinDate: Date
  wave: number
  fanCount: number // How many fans to generate
  hasDasham: boolean
  hasBandcamp: boolean
}

function generateArtists(): SimArtist[] {
  const artists: SimArtist[] = []
  let idx = 0

  const makeArtist = (
    cohort: string,
    tier: string,
    channel: string,
    wave: number,
    retentionRate: number,
    config: {
      genres: string[]
      cities: string[]
      fanRange: [number, number]
      hasDasham: boolean
      hasBandcamp: boolean
    }
  ): SimArtist => {
    idx++
    const waveOffset = (wave - 1) * 14 // 2 weeks per wave
    const joinDate = randomDate(
      subDays(BETA_START, -waveOffset),
      subDays(BETA_START, -(waveOffset + 13))
    )
    return {
      name: `Artist ${idx}`,
      email: `artist${idx}@beta.stanvault.test`,
      artistName: `${pick(['DJ', 'MC', 'King', 'Queen', 'Lil', 'Big', 'Young'])} ${pick(['Pulse', 'Wave', 'Fire', 'Storm', 'Gold', 'Sky', 'Star', 'Moon', 'Sun', 'Rain'])} ${idx}`,
      genre: pick(config.genres),
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
    }
  }

  // Core Afrobeats/Amapiano — 30 artists, ~81% retention
  for (let i = 0; i < 30; i++) {
    artists.push(
      makeArtist(
        'CORE_AFROBEATS',
        'PRIVATE_CIRCLE',
        i < 20 ? 'ORYX_PALMLION' : 'MUSIC_TWITTER',
        1,
        81,
        {
          genres: AFRO_GENRES,
          cities: CITIES.african,
          fanRange: [15, 60],
          hasDasham: true,
          hasBandcamp: chance(30),
        }
      )
    )
  }

  // Diaspora — 15 artists, ~80% retention
  for (let i = 0; i < 15; i++) {
    artists.push(
      makeArtist('DIASPORA', 'PRIVATE_CIRCLE', 'MUSIC_TWITTER', 2, 80, {
        genres: ['Afrobeats', 'Afro-fusion', 'Afro-R&B', 'Dancehall'],
        cities: CITIES.diaspora,
        fanRange: [10, 40],
        hasDasham: chance(50),
        hasBandcamp: chance(40),
      })
    )
  }

  // Managers — 10, ~100% retention
  for (let i = 0; i < 10; i++) {
    artists.push(
      makeArtist('MANAGER', 'PATRON_GROWTH', 'MANAGER_NETWORK', 2, 95, {
        genres: AFRO_GENRES,
        cities: [...CITIES.african.slice(0, 2), ...CITIES.diaspora.slice(0, 2)],
        fanRange: [30, 80],
        hasDasham: true,
        hasBandcamp: chance(20),
      })
    )
  }

  // Direct-to-fan indie — 10, ~40% retention
  for (let i = 0; i < 10; i++) {
    artists.push(
      makeArtist('DIRECT_TO_FAN_INDIE', 'STARTER', 'BANDCAMP_OUTREACH', 3, 40, {
        genres: INDIE_GENRES,
        cities: CITIES.western,
        fanRange: [5, 20],
        hasDasham: false,
        hasBandcamp: true,
      })
    )
  }

  // Experimental/niche — 5, ~50% retention
  for (let i = 0; i < 5; i++) {
    artists.push(
      makeArtist('EXPERIMENTAL_NICHE', 'STARTER', 'PERSONAL_NETWORK', 3, 50, {
        genres: ['Experimental', 'Art Pop', 'Ambient', 'Noise'],
        cities: [...CITIES.diaspora, ...CITIES.western],
        fanRange: [3, 12],
        hasDasham: false,
        hasBandcamp: true,
      })
    )
  }

  // Producer-DJs — 5, ~30% retention
  for (let i = 0; i < 5; i++) {
    artists.push(
      makeArtist('PRODUCER_DJ', 'STARTER', 'DISCORD_COMMUNITY', 3, 30, {
        genres: ['House', 'Techno', 'Afrohouse', 'UK Garage', 'Drum & Bass'],
        cities: CITIES.western,
        fanRange: [3, 10],
        hasDasham: false,
        hasBandcamp: chance(60),
      })
    )
  }

  // Indie Hip-Hop/R&B — 5, ~40% retention
  for (let i = 0; i < 5; i++) {
    artists.push(
      makeArtist('INDIE_HIPHOP_RNB', 'STARTER', 'MUSIC_TWITTER', 3, 40, {
        genres: HIPHOP_GENRES,
        cities: ['New York', 'Los Angeles', 'Atlanta', 'Chicago'],
        fanRange: [5, 15],
        hasDasham: false,
        hasBandcamp: chance(40),
      })
    )
  }

  return artists
}

// ============================================
// Fan Generation
// ============================================

interface SimFan {
  displayName: string
  email: string
  city: string
  betaCohort: string
  retained: boolean
  joinDate: Date
  // Engagement profile
  streams: number
  hasDashamTips: boolean
  tipAmountUsd: number
  tipCount: number
  hasBandcampPurchase: boolean
  purchaseAmountUsd: number
  hasSpotifyVerified: boolean
  artistCount: number // How many artists they follow
}

function generateFanForArtist(
  artist: SimArtist,
  fanIdx: number,
  fanCohort: string,
  retentionRate: number
): SimFan {
  const isDeepFan = fanCohort === 'DEEP_AFRICAN'
  const isDiaspora = fanCohort === 'DIASPORA_SUPERFAN'
  const isBandcampFan = fanCohort === 'BANDCAMP_KOFI_SUPPORTER'
  const isStreetTeam = fanCohort === 'STREET_TEAM_LEADER'
  const isCasual = fanCohort === 'CASUAL_CURIOUS'
  const isCold = fanCohort === 'COLD_SIGNUP'

  const retained = chance(retentionRate)
  const joinDate = randomDate(artist.joinDate, subDays(NOW, 30))

  let streams = 0
  let hasDashamTips = false
  let tipAmountUsd = 0
  let tipCount = 0
  let hasBandcampPurchase = false
  let purchaseAmountUsd = 0

  if (isDeepFan) {
    streams = rand(80, 500)
    hasDashamTips = chance(70)
    if (hasDashamTips) {
      tipCount = rand(1, 15)
      tipAmountUsd = tipCount * rand(1, 8)
    }
    hasBandcampPurchase = chance(20)
    if (hasBandcampPurchase) purchaseAmountUsd = rand(5, 30)
  } else if (isDiaspora) {
    streams = rand(50, 300)
    hasDashamTips = chance(30)
    if (hasDashamTips) {
      tipCount = rand(1, 5)
      tipAmountUsd = tipCount * rand(2, 10)
    }
    hasBandcampPurchase = chance(40)
    if (hasBandcampPurchase) purchaseAmountUsd = rand(8, 50)
  } else if (isBandcampFan) {
    streams = rand(20, 150)
    hasDashamTips = false
    hasBandcampPurchase = true
    purchaseAmountUsd = rand(10, 80)
  } else if (isStreetTeam) {
    streams = rand(100, 400)
    hasDashamTips = chance(40)
    if (hasDashamTips) {
      tipCount = rand(2, 10)
      tipAmountUsd = tipCount * rand(1, 5)
    }
    hasBandcampPurchase = chance(30)
    if (hasBandcampPurchase) purchaseAmountUsd = rand(5, 25)
  } else if (isCasual) {
    streams = rand(5, 40)
    hasDashamTips = false
    hasBandcampPurchase = false
  } else if (isCold) {
    streams = rand(0, 15)
    hasDashamTips = false
    hasBandcampPurchase = false
  }

  const cities = isDeepFan
    ? CITIES.african
    : isDiaspora
      ? CITIES.diaspora
      : [...CITIES.african, ...CITIES.diaspora, ...CITIES.western]

  return {
    displayName: `Fan ${fanCohort.slice(0, 4)}-${fanIdx}`,
    email: `fan.${fanCohort.toLowerCase().replace(/_/g, '')}.${fanIdx}@beta.stanvault.test`,
    city: pick(cities),
    betaCohort: fanCohort,
    retained,
    joinDate,
    streams,
    hasDashamTips,
    tipAmountUsd,
    tipCount,
    hasBandcampPurchase,
    purchaseAmountUsd,
    hasSpotifyVerified: chance(isDeepFan || isDiaspora ? 90 : isCasual ? 60 : isCold ? 40 : 80),
    artistCount: isStreetTeam ? rand(2, 4) : isDiaspora ? rand(1, 3) : 1,
  }
}

// ============================================
// Database Operations
// ============================================

async function createSimulatedArtist(artist: SimArtist): Promise<string> {
  const user = await prisma.user.create({
    data: {
      email: artist.email,
      name: artist.name,
      artistName: artist.artistName,
      genre: artist.genre,
      location: artist.location,
      pricingTier: artist.pricingTier as any,
      betaCohort: artist.betaCohort as any,
      acquisitionChannel: artist.acquisitionChannel as any,
      betaInviteCode: `SIM-${artist.betaCohort.slice(0, 4)}-${Date.now()}`,
      betaJoinedAt: artist.joinDate,
      onboardingCompleted: true,
      createdAt: artist.joinDate,
      updatedAt: artist.retained ? randomDate(subDays(NOW, 7), NOW) : randomDate(subDays(NOW, 90), subDays(NOW, 35)),
    },
  })
  return user.id
}

async function createSimulatedFanRecord(
  artistId: string,
  artistCity: string,
  fan: SimFan
): Promise<void> {
  const lastActive = fan.retained
    ? randomDate(subDays(NOW, 14), NOW)
    : randomDate(subDays(NOW, 90), subDays(NOW, 40))

  // Create artist-side fan record
  const fanRecord = await prisma.fan.create({
    data: {
      userId: artistId,
      displayName: fan.displayName,
      email: fan.email,
      city: fan.city,
      stanScore: 0, // Will be calculated
      tier: 'CASUAL',
      firstSeenAt: fan.joinDate,
      lastActiveAt: lastActive,
      createdAt: fan.joinDate,
    },
  })

  // Create platform links
  // Spotify (almost everyone)
  if (fan.streams > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id,
        platform: Platform.SPOTIFY,
        streams: fan.streams,
        playlistAdds: rand(0, Math.floor(fan.streams / 20)),
        saves: rand(0, Math.floor(fan.streams / 10)),
        follows: chance(70),
        firstSeenAt: fan.joinDate,
        lastActiveAt: lastActive,
      },
    })
  }

  // Dasham tips
  if (fan.hasDashamTips) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id,
        platform: Platform.DASHAM,
        tipCount: fan.tipCount,
        tipAmountUsd: fan.tipAmountUsd,
        tipFrequency: Math.min(fan.tipCount, rand(1, 6)),
        momentSaves: rand(0, 5),
        cityAffiliation: fan.city,
        firstSeenAt: fan.joinDate,
        lastActiveAt: lastActive,
      },
    })
  }

  // Bandcamp purchases
  if (fan.hasBandcampPurchase) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id,
        platform: Platform.BANDCAMP,
        purchaseCount: rand(1, 5),
        purchaseAmountUsd: fan.purchaseAmountUsd,
        cityAffiliation: fan.city,
        firstSeenAt: fan.joinDate,
        lastActiveAt: lastActive,
      },
    })
  }

  // Social engagement (some fans)
  if (chance(50)) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id,
        platform: pick([Platform.INSTAGRAM, Platform.TIKTOK, Platform.TWITTER]),
        follows: true,
        likes: rand(1, 30),
        comments: rand(0, 10),
        shares: rand(0, 5),
        firstSeenAt: fan.joinDate,
        lastActiveAt: lastActive,
      },
    })
  }

  // Now calculate the real score using the scoring system
  const allLinks = await prisma.fanPlatformLink.findMany({
    where: { fanId: fanRecord.id },
  })

  // Import scoring function dynamically
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
    artistCity: artistCity,
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

  // Create journey events
  if (fan.streams > 0) {
    await prisma.fanEvent.create({
      data: {
        fanId: fanRecord.id,
        eventType: EventType.FIRST_STREAM,
        platform: Platform.SPOTIFY,
        description: 'First stream detected',
        occurredAt: fan.joinDate,
      },
    })
  }

  if (fan.hasDashamTips) {
    await prisma.fanEvent.create({
      data: {
        fanId: fanRecord.id,
        eventType: EventType.FIRST_TIP,
        platform: Platform.DASHAM,
        description: `First Dasham tip: $${fan.tipAmountUsd.toFixed(2)}`,
        occurredAt: randomDate(fan.joinDate, lastActive),
      },
    })
  }

  if (scoreResult.tier === 'SUPERFAN') {
    await prisma.fanEvent.create({
      data: {
        fanId: fanRecord.id,
        eventType: EventType.BECAME_SUPERFAN,
        description: `Reached SUPERFAN tier (score: ${scoreResult.totalScore})`,
        occurredAt: randomDate(fan.joinDate, lastActive),
      },
    })
  }
}

async function createSimulatedFanUser(fan: SimFan): Promise<string> {
  const fanUser = await prisma.fanUser.create({
    data: {
      email: fan.email,
      displayName: fan.displayName,
      betaCohort: fan.betaCohort as any,
      acquisitionChannel: 'ORYX_PALMLION' as any,
      betaInviteCode: `SIM-FAN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      betaJoinedAt: fan.joinDate,
      onboardingCompleted: fan.hasSpotifyVerified,
      spotifyUserId: fan.hasSpotifyVerified ? `spotify_sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : null,
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
  console.log('=== StanVault 200-User Beta Simulation ===\n')

  // Clean up any previous simulation data
  const existingSimUsers = await prisma.user.count({
    where: { email: { endsWith: '@beta.stanvault.test' } },
  })
  if (existingSimUsers > 0) {
    console.log(`Cleaning up ${existingSimUsers} existing simulation users...`)
    const simUsers = await prisma.user.findMany({
      where: { email: { endsWith: '@beta.stanvault.test' } },
      select: { id: true },
    })
    const simUserIds = simUsers.map((u) => u.id)

    // Delete in order to respect foreign keys
    await prisma.fanEvent.deleteMany({ where: { fan: { userId: { in: simUserIds } } } })
    await prisma.fanSnapshot.deleteMany({ where: { fan: { userId: { in: simUserIds } } } })
    await prisma.fanPlatformLink.deleteMany({ where: { fan: { userId: { in: simUserIds } } } })
    await prisma.listeningEvent.deleteMany({ where: { fan: { userId: { in: simUserIds } } } })
    await prisma.dropClaim.deleteMany({ where: { drop: { userId: { in: simUserIds } } } })
    await prisma.drop.deleteMany({ where: { userId: { in: simUserIds } } })
    await prisma.fanUserArtistLink.deleteMany({ where: { artistId: { in: simUserIds } } })
    await prisma.fan.deleteMany({ where: { userId: { in: simUserIds } } })
    await prisma.artistMetricsHistory.deleteMany({ where: { userId: { in: simUserIds } } })
    await prisma.user.deleteMany({ where: { id: { in: simUserIds } } })

    // Clean sim fan users too
    await prisma.fanUserSession.deleteMany({
      where: { fanUser: { email: { endsWith: '@beta.stanvault.test' } } },
    })
    await prisma.fanUserArtistLink.deleteMany({
      where: { fanUser: { email: { endsWith: '@beta.stanvault.test' } } },
    })
    await prisma.dropClaim.deleteMany({
      where: { fanUser: { email: { endsWith: '@beta.stanvault.test' } } },
    })
    await prisma.fanUser.deleteMany({ where: { email: { endsWith: '@beta.stanvault.test' } } })

    console.log('Cleanup complete.\n')
  }

  // Generate artists
  const artists = generateArtists()
  console.log(`Generating ${artists.length} artists...\n`)

  const artistRecords: Array<{ id: string; artist: SimArtist }> = []
  const cohortStats: Record<string, { total: number; retained: number }> = {}

  for (const artist of artists) {
    const id = await createSimulatedArtist(artist)
    artistRecords.push({ id, artist })

    if (!cohortStats[artist.betaCohort]) {
      cohortStats[artist.betaCohort] = { total: 0, retained: 0 }
    }
    cohortStats[artist.betaCohort].total++
    if (artist.retained) cohortStats[artist.betaCohort].retained++
  }

  console.log('Artist cohort breakdown:')
  for (const [cohort, stats] of Object.entries(cohortStats)) {
    const rate = Math.round((stats.retained / stats.total) * 100)
    console.log(`  ${cohort}: ${stats.total} total, ${stats.retained} retained (${rate}%)`)
  }

  // Generate fans and connect to artists
  console.log('\nGenerating fans and platform data...\n')

  const fanCohortAlloc = [
    { cohort: 'DEEP_AFRICAN', count: 35, retentionRate: 60 },
    { cohort: 'DIASPORA_SUPERFAN', count: 25, retentionRate: 55 },
    { cohort: 'BANDCAMP_KOFI_SUPPORTER', count: 20, retentionRate: 45 },
    { cohort: 'STREET_TEAM_LEADER', count: 15, retentionRate: 50 },
    { cohort: 'CASUAL_CURIOUS', count: 15, retentionRate: 25 },
    { cohort: 'COLD_SIGNUP', count: 10, retentionRate: 10 },
  ]

  let totalFans = 0
  let totalFanUsers = 0
  const fanUserIds: string[] = []
  const fanCohortStats: Record<string, { total: number; retained: number; verified: number }> = {}

  for (const alloc of fanCohortAlloc) {
    fanCohortStats[alloc.cohort] = { total: 0, retained: 0, verified: 0 }

    for (let i = 0; i < alloc.count; i++) {
      // Pick a random artist to be a fan of (weighted toward matching cohorts)
      const matchingArtists =
        alloc.cohort === 'DEEP_AFRICAN'
          ? artistRecords.filter((a) => a.artist.betaCohort === 'CORE_AFROBEATS')
          : alloc.cohort === 'DIASPORA_SUPERFAN'
            ? artistRecords.filter((a) => ['DIASPORA', 'CORE_AFROBEATS'].includes(a.artist.betaCohort))
            : alloc.cohort === 'BANDCAMP_KOFI_SUPPORTER'
              ? artistRecords.filter((a) =>
                  ['DIRECT_TO_FAN_INDIE', 'EXPERIMENTAL_NICHE'].includes(a.artist.betaCohort)
                )
              : artistRecords

      const targetArtist = pick(matchingArtists.length > 0 ? matchingArtists : artistRecords)

      const fan = generateFanForArtist(targetArtist.artist, i + 1, alloc.cohort, alloc.retentionRate)

      // Create artist-side fan record with platform data + scoring
      await createSimulatedFanRecord(targetArtist.id, targetArtist.artist.location, fan)
      totalFans++

      // Create fan-side user account
      const fanUserId = await createSimulatedFanUser(fan)
      fanUserIds.push(fanUserId)
      totalFanUsers++

      fanCohortStats[alloc.cohort].total++
      if (fan.retained) fanCohortStats[alloc.cohort].retained++
      if (fan.hasSpotifyVerified) fanCohortStats[alloc.cohort].verified++

      // Create fan→artist link (verification)
      await prisma.fanUserArtistLink.create({
        data: {
          fanUserId,
          artistId: targetArtist.id,
          verified: fan.hasSpotifyVerified,
          verifiedAt: fan.hasSpotifyVerified ? randomDate(fan.joinDate, NOW) : null,
          verifiedVia: fan.hasSpotifyVerified ? 'spotify' : null,
          tier: 'CASUAL',
          stanScore: 0,
          totalStreams: fan.streams,
          isFollowing: chance(60),
          firstSeenAt: fan.joinDate,
          lastActiveAt: fan.retained ? randomDate(subDays(NOW, 14), NOW) : randomDate(subDays(NOW, 90), subDays(NOW, 40)),
        },
      })

      // Cross-artist verification (some fans verify for multiple artists)
      if (fan.artistCount > 1) {
        const otherArtists = artistRecords.filter((a) => a.id !== targetArtist.id)
        for (let j = 1; j < fan.artistCount && otherArtists.length > 0; j++) {
          const otherArtist = pick(otherArtists)
          try {
            await prisma.fanUserArtistLink.create({
              data: {
                fanUserId,
                artistId: otherArtist.id,
                verified: chance(70),
                verifiedAt: chance(70) ? randomDate(fan.joinDate, NOW) : null,
                verifiedVia: chance(70) ? 'spotify' : null,
                tier: 'CASUAL',
                stanScore: 0,
                totalStreams: rand(5, 100),
                isFollowing: chance(40),
                firstSeenAt: fan.joinDate,
                lastActiveAt: fan.retained ? randomDate(subDays(NOW, 14), NOW) : randomDate(subDays(NOW, 90), subDays(NOW, 40)),
              },
            })
          } catch {
            // Skip duplicate links
          }
        }
      }
    }
  }

  console.log('Fan cohort breakdown:')
  for (const [cohort, stats] of Object.entries(fanCohortStats)) {
    const retRate = Math.round((stats.retained / stats.total) * 100)
    const verRate = Math.round((stats.verified / stats.total) * 100)
    console.log(`  ${cohort}: ${stats.total} total, ${stats.retained} retained (${retRate}%), ${stats.verified} verified (${verRate}%)`)
  }

  // Generate drops for retained artists
  console.log('\nGenerating drops and claims...\n')

  let totalDrops = 0
  let totalClaims = 0

  for (const { id, artist } of artistRecords) {
    if (!artist.retained) continue

    const dropCount = artist.betaCohort === 'MANAGER' ? rand(4, 8) : rand(1, 5)

    for (let d = 0; d < dropCount; d++) {
      const drop = await prisma.drop.create({
        data: {
          userId: id,
          slug: `sim-${artist.artistName.replace(/\s+/g, '-').toLowerCase()}-drop-${d + 1}-${Date.now()}`,
          title: pick([
            'Unreleased Track Preview',
            'Presale Access',
            'Behind the Scenes Video',
            'Exclusive Merch Drop',
            'Early Album Access',
            'Meet & Greet Lottery',
            'Signed Poster',
            'Studio Session Invite',
          ]),
          contentType: pick(['DOWNLOAD', 'LINK', 'MESSAGE', 'PRESALE']),
          minTier: pick(['CASUAL', 'ENGAGED', 'DEDICATED', null]) as FanTier | null,
          isActive: true,
          createdAt: randomDate(artist.joinDate, NOW),
        },
      })
      totalDrops++

      // Some fans claim this drop
      const claimCount = rand(0, Math.min(3, fanUserIds.length))
      for (let c = 0; c < claimCount; c++) {
        const claimFanId = pick(fanUserIds)
        try {
          await prisma.dropClaim.create({
            data: {
              dropId: drop.id,
              fanUserId: claimFanId,
              tier: pick(['CASUAL', 'ENGAGED', 'DEDICATED', 'SUPERFAN']),
              stanScore: rand(10, 90),
              claimedAt: randomDate(drop.createdAt, NOW),
            },
          })
          totalClaims++
        } catch {
          // Skip duplicate claims
        }
      }
    }
  }

  console.log(`Created ${totalDrops} drops with ${totalClaims} claims\n`)

  // Final summary
  console.log('=== Simulation Complete ===\n')
  console.log(`  Artists: ${artists.length}`)
  console.log(`  Fans (artist-side records): ${totalFans}`)
  console.log(`  Fan users (portal accounts): ${totalFanUsers}`)
  console.log(`  Drops: ${totalDrops}`)
  console.log(`  Claims: ${totalClaims}`)

  // Score distribution
  const allFans = await prisma.fan.findMany({
    where: { user: { email: { endsWith: '@beta.stanvault.test' } } },
    select: { stanScore: true, tier: true, convictionScore: true },
  })

  const tierCounts = { CASUAL: 0, ENGAGED: 0, DEDICATED: 0, SUPERFAN: 0 }
  let totalScore = 0
  let totalConviction = 0
  let withConviction = 0

  for (const fan of allFans) {
    tierCounts[fan.tier]++
    totalScore += fan.stanScore
    totalConviction += fan.convictionScore
    if (fan.convictionScore > 0) withConviction++
  }

  console.log(`\n  Score Distribution:`)
  console.log(`    CASUAL:    ${tierCounts.CASUAL}`)
  console.log(`    ENGAGED:   ${tierCounts.ENGAGED}`)
  console.log(`    DEDICATED: ${tierCounts.DEDICATED}`)
  console.log(`    SUPERFAN:  ${tierCounts.SUPERFAN}`)
  console.log(`    Avg Score: ${allFans.length > 0 ? Math.round(totalScore / allFans.length) : 0}`)
  console.log(`    Avg Conviction: ${allFans.length > 0 ? (totalConviction / allFans.length).toFixed(1) : 0}`)
  console.log(`    Fans with conviction > 0: ${withConviction}/${allFans.length} (${allFans.length > 0 ? Math.round((withConviction / allFans.length) * 100) : 0}%)`)

  console.log('\n  Run GET /api/beta/metrics to see the full dashboard.\n')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
