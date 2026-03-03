/**
 * Simulate a 200-user beta test with Producers/Beatmakers as the hypothetical ICP.
 *
 * Run: npx tsx scripts/simulate-producer-beta.ts
 *
 * Tests whether producers/beatmakers map to StanVault's scoring system.
 * Uses the REAL calculateStanScore() engine.
 *
 * Creator segments (80 producers):
 *   - Afrobeats/Amapiano producers (Lagos/London/Joburg, sell beats, some on Dasham): 15
 *   - Hip-hop beatmakers (BeatStars, YouTube type beats): 15
 *   - Electronic/EDM producers (Bandcamp heavy, sample packs): 10
 *   - Lo-fi/ambient producers (Bandcamp, Ko-fi, small loyal fanbases): 10
 *   - Topliner/session producers (work for hire, less direct fanbase): 10
 *   - YouTube tutorial producers (teach production, sell courses/packs): 10
 *   - Multi-genre indie producers (release beats + albums, Spotify + Bandcamp): 10
 *
 * Fan segments (120 fans/customers):
 *   - Beat buyers (purchase beats on BeatStars/Bandcamp): 25
 *   - Sample pack buyers (buy from Bandcamp/Gumroad/Ko-fi): 20
 *   - Spotify listeners (stream producer albums/compilations): 20
 *   - YouTube subscribers (watch tutorials, type beats): 20
 *   - Social followers (follow on IG/Twitter, comment on posts): 20
 *   - Ko-fi/Patreon supporters (monthly support for stems/exclusives): 15
 *
 * Hypothesis: Revenue visibility ~30-50% (HIGHEST of any non-music-artist segment).
 * Bandcamp, Ko-fi, Patreon, Merch, and Dasham (for Afro producers) are all visible.
 * BeatStars and Splice royalties remain INVISIBLE. Producers are ecosystem-adjacent.
 */

import { PrismaClient, Platform, FanTier, EventType } from '@prisma/client'
import { subDays } from 'date-fns'

const prisma = new PrismaClient()

const BETA_START = subDays(new Date(), 90)
const NOW = new Date()

const PRODUCER_CITIES = [
  'Lagos', 'London', 'Johannesburg', 'Los Angeles', 'Atlanta',
  'New York', 'Toronto', 'Berlin', 'Nairobi', 'Accra',
  'Chicago', 'Miami', 'Houston', 'Paris', 'Amsterdam',
]

const PRODUCER_GENRES = [
  'Afrobeats', 'Amapiano', 'Hip-Hop', 'Trap', 'R&B',
  'Lo-fi', 'Ambient', 'EDM', 'House', 'Drill',
  'Boom Bap', 'Neo-Soul', 'Dancehall', 'Grime', 'Jersey Club',
]

const EMAIL_SUFFIX = '@producer-beta.stanvault.test'

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
// Producer (Creator) Generation
// ============================================

interface SimProducer {
  name: string
  email: string
  artistName: string
  genre: string
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
  hasYoutube: boolean
  hasSpotify: boolean
}

function generateProducers(): SimProducer[] {
  const producers: SimProducer[] = []
  let idx = 0

  const make = (
    cohort: string, tier: string, channel: string, wave: number, retentionRate: number,
    config: {
      genres: string[]; cities: string[]; fanRange: [number, number]
      hasDasham: boolean; hasBandcamp: boolean; hasKofi: boolean; hasPatreon: boolean
      hasMerch: boolean; hasYoutube: boolean; hasSpotify: boolean
    }
  ): SimProducer => {
    idx++
    const waveOffset = (wave - 1) * 14
    const joinDate = randomDate(subDays(BETA_START, -waveOffset), subDays(BETA_START, -(waveOffset + 13)))
    return {
      name: `Producer ${idx}`,
      email: `producer.creator${idx}${EMAIL_SUFFIX}`,
      artistName: `${pick(['', 'DJ ', 'The '])}${pick(['808', 'Sauce', 'Flame', 'Wave', 'Vibe', 'Pulse', 'Drift', 'Haze', 'Bass', 'Keys'])}${pick(['', ' '])}${pick(['Melo', 'Beatz', 'Sonics', 'Labs', 'Sound', 'Muzik', 'Trax', 'Prod', idx.toString()])}`,
      genre: pick(config.genres),
      location: pick(config.cities),
      betaCohort: cohort, pricingTier: tier, acquisitionChannel: channel,
      retained: chance(retentionRate), joinDate, wave,
      fanCount: rand(...config.fanRange),
      hasDasham: config.hasDasham, hasBandcamp: config.hasBandcamp,
      hasKofi: config.hasKofi, hasPatreon: config.hasPatreon,
      hasMerch: config.hasMerch, hasYoutube: config.hasYoutube,
      hasSpotify: config.hasSpotify,
    }
  }

  // Afrobeats/Amapiano producers — 15
  // Lagos/London/Joburg. Sell beats, some on Dasham. CLOSE to core ICP.
  // They're in the Oryx/Palmlion ecosystem. Dasham tips fire conviction.
  // Retention: ~65% — ecosystem-adjacent, scoring works because Dasham + Bandcamp visible
  for (let i = 0; i < 15; i++) {
    producers.push(make('CORE_AFROBEATS', 'STARTER', 'ORYX_PALMLION', 1, 65, {
      genres: ['Afrobeats', 'Amapiano', 'Dancehall', 'Afro House'],
      cities: ['Lagos', 'London', 'Johannesburg', 'Nairobi', 'Accra'],
      fanRange: [8, 25],
      hasDasham: true, // In the ecosystem
      hasBandcamp: chance(55), // Many sell beat tapes on Bandcamp
      hasKofi: chance(30),
      hasPatreon: chance(25),
      hasMerch: chance(20),
      hasYoutube: chance(60), // Tutorials, beat making videos
      hasSpotify: chance(70), // Beat tapes, producer albums
    }))
  }

  // Hip-hop beatmakers — 15
  // BeatStars is their primary platform (INVISIBLE). YouTube type beats for exposure.
  // Retention: ~30% — BeatStars invisible, but YouTube/social signals exist
  for (let i = 0; i < 15; i++) {
    producers.push(make('INDIE_HIPHOP_RNB', 'STARTER', 'MUSIC_TWITTER', 1, 30, {
      genres: ['Hip-Hop', 'Trap', 'Drill', 'Boom Bap', 'R&B'],
      cities: ['Los Angeles', 'Atlanta', 'New York', 'Chicago', 'Houston', 'Miami', 'London', 'Toronto'],
      fanRange: [6, 20],
      hasDasham: false,
      hasBandcamp: chance(25), // Some sell on Bandcamp too
      hasKofi: chance(10),
      hasPatreon: chance(15),
      hasMerch: chance(15),
      hasYoutube: true, // Almost all hip-hop beatmakers have YouTube type beats
      hasSpotify: chance(50), // Some have beat tapes on Spotify
    }))
  }

  // Electronic/EDM producers — 10
  // Bandcamp HEAVY. Sample packs, albums, EPs. Strong direct-to-fan culture.
  // Retention: ~35% — Bandcamp fires conviction scoring hard
  for (let i = 0; i < 10; i++) {
    producers.push(make('DIRECT_TO_FAN_INDIE', 'STARTER', 'BANDCAMP_OUTREACH', 2, 35, {
      genres: ['EDM', 'House', 'Techno', 'Drum & Bass', 'Ambient'],
      cities: ['Berlin', 'Amsterdam', 'London', 'Los Angeles', 'Paris', 'Chicago'],
      fanRange: [5, 18],
      hasDasham: false,
      hasBandcamp: true, // Bandcamp is core for electronic producers
      hasKofi: chance(20),
      hasPatreon: chance(30), // Sample pack subscriptions
      hasMerch: chance(20),
      hasYoutube: chance(45),
      hasSpotify: chance(65), // Most release on Spotify too
    }))
  }

  // Lo-fi/ambient producers — 10
  // Small but loyal fanbases. Bandcamp + Ko-fi for exclusive stems/project files.
  // Retention: ~40% — strong Bandcamp/Ko-fi signals, conviction fires
  for (let i = 0; i < 10; i++) {
    producers.push(make('EXPERIMENTAL_NICHE', 'STARTER', 'BANDCAMP_OUTREACH', 2, 40, {
      genres: ['Lo-fi', 'Ambient', 'Chillhop', 'Neo-Soul', 'Jazz Beats'],
      cities: ['Portland', 'Berlin', 'Tokyo', 'London', 'Brooklyn', 'Melbourne'],
      fanRange: [5, 15],
      hasDasham: false,
      hasBandcamp: true, // Core platform for lo-fi
      hasKofi: chance(50), // Ko-fi for exclusive content
      hasPatreon: chance(40), // Patreon for stems/project files
      hasMerch: chance(10),
      hasYoutube: chance(40), // Some have chill beat streams
      hasSpotify: chance(55), // Lo-fi compilations on Spotify
    }))
  }

  // Topliner/session producers — 10
  // Work for hire. They serve ARTISTS, not fans. Wrong product.
  // Retention: ~10% — no direct fanbase, scoring has nothing to measure
  for (let i = 0; i < 10; i++) {
    producers.push(make('MANAGER', 'STARTER', 'COLD_SIGNUP', 3, 10, {
      genres: ['Pop', 'R&B', 'Hip-Hop', 'Afrobeats', 'Dance'],
      cities: ['Los Angeles', 'London', 'Nashville', 'New York', 'Atlanta', 'Stockholm'],
      fanRange: [2, 6],
      hasDasham: false,
      hasBandcamp: chance(10), // Rarely sell direct
      hasKofi: chance(5),
      hasPatreon: chance(5),
      hasMerch: false,
      hasYoutube: chance(20),
      hasSpotify: chance(30), // Credits on songs, rarely own releases
    }))
  }

  // YouTube tutorial producers — 10
  // Teach production, sell courses/sample packs. YouTube is main platform.
  // Retention: ~25% — YouTube engagement visible + some merch/Ko-fi
  for (let i = 0; i < 10; i++) {
    producers.push(make('DIASPORA', 'STARTER', 'MUSIC_TWITTER', 2, 25, {
      genres: ['Hip-Hop', 'Trap', 'EDM', 'Lo-fi', 'R&B'],
      cities: ['Los Angeles', 'New York', 'London', 'Atlanta', 'Toronto', 'Berlin'],
      fanRange: [8, 25],
      hasDasham: false,
      hasBandcamp: chance(30), // Some sell sample packs on Bandcamp
      hasKofi: chance(35), // Tips for free tutorials
      hasPatreon: chance(40), // Exclusive tutorials, project files
      hasMerch: chance(15),
      hasYoutube: true, // YouTube is core platform
      hasSpotify: chance(35), // Some release beats on Spotify
    }))
  }

  // Multi-genre indie producers — 10
  // Release beats + full albums. Spotify + Bandcamp. Closest to artist ICP.
  // Retention: ~45% — most signals fire, cross-platform presence
  for (let i = 0; i < 10; i++) {
    producers.push(make('PRODUCER_DJ', 'STARTER', 'PERSONAL_NETWORK', 1, 45, {
      genres: pick([['Afrobeats', 'Hip-Hop'], ['R&B', 'Neo-Soul'], ['Lo-fi', 'Jazz Beats'], ['EDM', 'House'], ['Drill', 'Grime']]),
      cities: PRODUCER_CITIES, fanRange: [8, 22],
      hasDasham: false,
      hasBandcamp: chance(65), // Strong Bandcamp presence
      hasKofi: chance(25),
      hasPatreon: chance(30),
      hasMerch: chance(25),
      hasYoutube: chance(55),
      hasSpotify: true, // Always on Spotify — they release albums
    }))
  }

  return producers
}

// ============================================
// Producer Fan/Customer Generation
// ============================================

interface SimProducerFan {
  displayName: string
  email: string
  city: string
  betaCohort: string
  retained: boolean
  joinDate: Date
  // Spotify (producer albums, beat tapes, compilations)
  streams: number
  // Financial signals visible to StanVault
  hasBandcampPurchase: boolean
  hasKofiPurchase: boolean
  hasPatreonSub: boolean
  hasMerchPurchase: boolean
  hasDashamTip: boolean
  bandcampAmountUsd: number
  kofiAmountUsd: number
  patreonMonths: number
  merchAmountUsd: number
  dashamTipCount: number
  dashamTipAmountUsd: number
  // Social engagement
  instagramFollows: boolean
  instagramLikes: number
  instagramComments: number
  twitterFollows: boolean
  twitterLikes: number
  twitterComments: number
  youtubeSubscribed: boolean
  youtubeViews: number
  emailOpens: number
  emailClicks: number
  // Producer-specific INVISIBLE revenue
  beatStoresSales: number // BeatStars purchases ($) — INVISIBLE
  spliceRoyalties: number // Splice sample pack royalties ($) — INVISIBLE
  hasSpotifyVerified: boolean
  artistCount: number
}

function generateProducerFan(
  producer: SimProducer, fanIdx: number, fanCohort: string, retentionRate: number
): SimProducerFan {
  const isBeatBuyer = fanCohort === 'DEEP_AFRICAN'
  const isSamplePackBuyer = fanCohort === 'DIASPORA_SUPERFAN'
  const isSpotifyListener = fanCohort === 'BANDCAMP_KOFI_SUPPORTER'
  const isYoutubeSub = fanCohort === 'STREET_TEAM_LEADER'
  const isSocialFollower = fanCohort === 'CASUAL_CURIOUS'
  const isKofiPatreonSupporter = fanCohort === 'COLD_SIGNUP'

  const retained = chance(retentionRate)
  const joinDate = randomDate(producer.joinDate, subDays(NOW, 30))

  // Visible signals
  let streams = 0
  let hasBandcampPurchase = false
  let hasKofiPurchase = false
  let hasPatreonSub = false
  let hasMerchPurchase = false
  let hasDashamTip = false
  let bandcampAmountUsd = 0
  let kofiAmountUsd = 0
  let patreonMonths = 0
  let merchAmountUsd = 0
  let dashamTipCount = 0
  let dashamTipAmountUsd = 0
  let instagramFollows = false
  let instagramLikes = 0
  let instagramComments = 0
  let twitterFollows = false
  let twitterLikes = 0
  let twitterComments = 0
  let youtubeSubscribed = false
  let youtubeViews = 0
  let emailOpens = 0
  let emailClicks = 0

  // INVISIBLE revenue
  let beatStoresSales = 0
  let spliceRoyalties = 0

  if (isBeatBuyer) {
    // BEAT BUYER: Purchases beats on BeatStars (INVISIBLE) and sometimes Bandcamp (VISIBLE)
    // BeatStars is the primary purchase platform — completely invisible to StanVault
    beatStoresSales = rand(30, 200) // $30-200 in beat purchases on BeatStars
    // Some also buy on Bandcamp (VISIBLE)
    hasBandcampPurchase = producer.hasBandcamp ? chance(35) : false
    if (hasBandcampPurchase) bandcampAmountUsd = rand(8, 40) // Beat tape or individual beats
    // Social signals
    twitterFollows = chance(50)
    twitterLikes = rand(2, 10)
    twitterComments = rand(0, 4)
    instagramFollows = chance(40)
    instagramLikes = rand(1, 8)
    youtubeSubscribed = producer.hasYoutube ? chance(45) : false
    youtubeViews = youtubeSubscribed ? rand(5, 30) : 0
    // Some stream producer albums
    if (producer.hasSpotify) streams = rand(5, 40)
    // Ko-fi tip after purchase
    hasKofiPurchase = producer.hasKofi ? chance(15) : false
    if (hasKofiPurchase) kofiAmountUsd = rand(3, 10)
    // Dasham (only for Afro producers)
    if (producer.hasDasham) {
      hasDashamTip = chance(40)
      if (hasDashamTip) {
        dashamTipCount = rand(1, 5)
        dashamTipAmountUsd = rand(2, 15)
      }
    }
    emailOpens = chance(25) ? rand(1, 5) : 0
    emailClicks = emailOpens > 0 ? rand(0, 2) : 0
  } else if (isSamplePackBuyer) {
    // SAMPLE PACK BUYER: Buys from Bandcamp/Gumroad/Ko-fi
    // Gumroad/Sellfy purchases are INVISIBLE. Bandcamp/Ko-fi are VISIBLE.
    spliceRoyalties = rand(0, 30) // Some buy on Splice too (invisible)
    beatStoresSales = rand(0, 50) // Some also buy beats (invisible)
    // Bandcamp sample packs (VISIBLE)
    hasBandcampPurchase = producer.hasBandcamp ? chance(55) : false
    if (hasBandcampPurchase) bandcampAmountUsd = rand(10, 50) // Sample packs cost more
    // Ko-fi (VISIBLE)
    hasKofiPurchase = producer.hasKofi ? chance(40) : false
    if (hasKofiPurchase) kofiAmountUsd = rand(5, 25)
    // Patreon for monthly packs
    hasPatreonSub = producer.hasPatreon ? chance(30) : false
    if (hasPatreonSub) patreonMonths = rand(2, 8)
    // Social
    twitterFollows = chance(45)
    twitterLikes = rand(1, 8)
    instagramFollows = chance(35)
    instagramLikes = rand(0, 5)
    youtubeSubscribed = producer.hasYoutube ? chance(35) : false
    youtubeViews = youtubeSubscribed ? rand(3, 20) : 0
    if (producer.hasSpotify) streams = rand(5, 30)
    emailOpens = chance(30) ? rand(2, 6) : 0
    emailClicks = emailOpens > 0 ? rand(1, 3) : 0
  } else if (isSpotifyListener) {
    // SPOTIFY LISTENER: Streams producer albums/compilations/beat tapes
    // Spotify is visible but streams alone score low without financial signals
    if (producer.hasSpotify) streams = rand(15, 150) // Heavy listener range
    else streams = rand(5, 30) // Discover through playlists even without direct Spotify presence
    // Light social engagement
    twitterFollows = chance(30)
    twitterLikes = rand(0, 5)
    instagramFollows = chance(25)
    instagramLikes = rand(0, 3)
    youtubeSubscribed = producer.hasYoutube ? chance(20) : false
    youtubeViews = youtubeSubscribed ? rand(2, 10) : 0
    // Occasionally buy on Bandcamp after discovering via Spotify
    hasBandcampPurchase = producer.hasBandcamp ? chance(15) : false
    if (hasBandcampPurchase) bandcampAmountUsd = rand(5, 15)
    if (producer.hasDasham) {
      hasDashamTip = chance(15)
      if (hasDashamTip) {
        dashamTipCount = rand(1, 3)
        dashamTipAmountUsd = rand(1, 8)
      }
    }
  } else if (isYoutubeSub) {
    // YOUTUBE SUBSCRIBER: Watches tutorials, type beats, production breakdowns
    // YouTube engagement is visible — subscribed, views
    youtubeSubscribed = true
    youtubeViews = rand(15, 100) // Heavy viewer
    // Social cross-pollination
    twitterFollows = chance(55)
    twitterLikes = rand(3, 12)
    twitterComments = rand(1, 5)
    instagramFollows = chance(45)
    instagramLikes = rand(2, 8)
    instagramComments = rand(0, 3)
    // Some become beat buyers (invisible)
    beatStoresSales = chance(30) ? rand(20, 80) : 0
    // Some buy sample packs on Bandcamp (visible)
    hasBandcampPurchase = producer.hasBandcamp ? chance(20) : false
    if (hasBandcampPurchase) bandcampAmountUsd = rand(5, 20)
    // Ko-fi tip for free tutorials
    hasKofiPurchase = producer.hasKofi ? chance(25) : false
    if (hasKofiPurchase) kofiAmountUsd = rand(3, 15)
    // Some stream producer music
    if (producer.hasSpotify) streams = rand(5, 50)
    emailOpens = chance(20) ? rand(1, 4) : 0
    emailClicks = emailOpens > 0 ? rand(0, 2) : 0
  } else if (isSocialFollower) {
    // SOCIAL FOLLOWER: Follow on IG/Twitter, comment on posts, light engagement
    // Social signals are visible but low-weight in scoring
    instagramFollows = true
    instagramLikes = rand(3, 15)
    instagramComments = rand(1, 6)
    twitterFollows = chance(70)
    twitterLikes = rand(2, 10)
    twitterComments = rand(0, 4)
    // Light YouTube
    youtubeSubscribed = producer.hasYoutube ? chance(30) : false
    youtubeViews = youtubeSubscribed ? rand(2, 15) : 0
    // Very occasional Spotify
    if (producer.hasSpotify) streams = rand(0, 20)
    // Rarely convert to purchase
    hasBandcampPurchase = producer.hasBandcamp ? chance(8) : false
    if (hasBandcampPurchase) bandcampAmountUsd = rand(5, 12)
    hasKofiPurchase = producer.hasKofi ? chance(10) : false
    if (hasKofiPurchase) kofiAmountUsd = rand(3, 8)
  } else if (isKofiPatreonSupporter) {
    // KO-FI/PATREON SUPPORTER: Monthly support for stems, exclusives, tutorials
    // This is the most VISIBLE fan segment — Ko-fi + Patreon both fire conviction
    hasKofiPurchase = producer.hasKofi ? chance(70) : false
    if (hasKofiPurchase) kofiAmountUsd = rand(10, 50) // Regular supporter, higher amounts
    hasPatreonSub = producer.hasPatreon ? chance(65) : false
    if (hasPatreonSub) patreonMonths = rand(3, 14) // Long-term subscriber
    // Often also buy on Bandcamp
    hasBandcampPurchase = producer.hasBandcamp ? chance(45) : false
    if (hasBandcampPurchase) bandcampAmountUsd = rand(10, 40)
    // Merch (some producers have it)
    hasMerchPurchase = producer.hasMerch ? chance(30) : false
    if (hasMerchPurchase) merchAmountUsd = rand(15, 50)
    // Cross-platform
    twitterFollows = true
    twitterLikes = rand(5, 20)
    twitterComments = rand(2, 8)
    instagramFollows = chance(60)
    instagramLikes = rand(3, 12)
    instagramComments = rand(1, 4)
    youtubeSubscribed = producer.hasYoutube ? chance(55) : false
    youtubeViews = youtubeSubscribed ? rand(10, 50) : 0
    if (producer.hasSpotify) streams = rand(10, 80)
    emailOpens = chance(40) ? rand(3, 10) : 0
    emailClicks = emailOpens > 0 ? rand(1, 5) : 0
    // Dasham for Afro producer supporters
    if (producer.hasDasham) {
      hasDashamTip = chance(50)
      if (hasDashamTip) {
        dashamTipCount = rand(2, 8)
        dashamTipAmountUsd = rand(5, 25)
      }
    }
  }

  return {
    displayName: `Producer Fan ${fanCohort.slice(0, 4)}-${fanIdx}`,
    email: `producer.fan.${fanCohort.toLowerCase().replace(/_/g, '')}.${fanIdx}${EMAIL_SUFFIX}`,
    city: pick(PRODUCER_CITIES),
    betaCohort: fanCohort,
    retained, joinDate, streams,
    hasBandcampPurchase, hasKofiPurchase, hasPatreonSub, hasMerchPurchase, hasDashamTip,
    bandcampAmountUsd, kofiAmountUsd, patreonMonths, merchAmountUsd,
    dashamTipCount, dashamTipAmountUsd,
    instagramFollows, instagramLikes, instagramComments,
    twitterFollows, twitterLikes, twitterComments,
    youtubeSubscribed, youtubeViews,
    emailOpens, emailClicks,
    beatStoresSales, spliceRoyalties,
    hasSpotifyVerified: producer.hasSpotify ? chance(40) : chance(10),
    artistCount: isKofiPatreonSupporter ? rand(2, 4) : isBeatBuyer ? rand(1, 3) : 1,
  }
}

// ============================================
// Database Operations
// ============================================

async function createSimProducer(s: SimProducer): Promise<string> {
  const user = await prisma.user.create({
    data: {
      email: s.email, name: s.name, artistName: s.artistName,
      genre: s.genre, location: s.location,
      pricingTier: s.pricingTier as any,
      betaCohort: s.betaCohort as any,
      acquisitionChannel: s.acquisitionChannel as any,
      betaInviteCode: `SIM-PR-${s.betaCohort.slice(0, 4)}-${Date.now()}`,
      betaJoinedAt: s.joinDate, onboardingCompleted: true,
      createdAt: s.joinDate,
      updatedAt: s.retained ? randomDate(subDays(NOW, 7), NOW) : randomDate(subDays(NOW, 90), subDays(NOW, 35)),
    },
  })
  return user.id
}

async function createSimProducerFanRecord(
  producerId: string, producerCity: string, fan: SimProducerFan, producer: SimProducer
): Promise<void> {
  const lastActive = fan.retained
    ? randomDate(subDays(NOW, 14), NOW)
    : randomDate(subDays(NOW, 90), subDays(NOW, 40))

  const fanRecord = await prisma.fan.create({
    data: {
      userId: producerId, displayName: fan.displayName,
      email: fan.email, city: fan.city,
      stanScore: 0, tier: 'CASUAL',
      firstSeenAt: fan.joinDate, lastActiveAt: lastActive, createdAt: fan.joinDate,
    },
  })

  // Platform links — what StanVault CAN see

  // Spotify (producer albums, beat tapes, compilations)
  if (fan.streams > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.SPOTIFY,
        streams: fan.streams, playlistAdds: rand(0, Math.floor(fan.streams / 30)),
        saves: rand(0, Math.floor(fan.streams / 20)), follows: chance(35),
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // Bandcamp — HUGE for producers (sample packs, beat tapes, albums)
  if (fan.hasBandcampPurchase) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.BANDCAMP,
        purchaseCount: rand(1, 5), purchaseAmountUsd: fan.bandcampAmountUsd,
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // Ko-fi
  if (fan.hasKofiPurchase) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.KOFI,
        purchaseCount: rand(1, 4), purchaseAmountUsd: fan.kofiAmountUsd,
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // Patreon
  if (fan.hasPatreonSub) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.PATREON,
        subscriptionMonths: fan.patreonMonths,
        purchaseCount: fan.patreonMonths,
        purchaseAmountUsd: fan.patreonMonths * rand(5, 15),
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // Merch
  if (fan.hasMerchPurchase) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.MERCH,
        purchaseCount: rand(1, 2), purchaseAmountUsd: fan.merchAmountUsd,
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // Dasham (Afrobeats producers only — ecosystem-native tips)
  if (fan.hasDashamTip) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.DASHAM,
        tipCount: fan.dashamTipCount, tipAmountUsd: fan.dashamTipAmountUsd,
        tipFrequency: rand(1, 4),
        momentSaves: rand(0, 3),
        cityAffiliation: chance(40) ? producerCity : null,
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // Instagram
  if (fan.instagramFollows || fan.instagramLikes > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.INSTAGRAM,
        follows: fan.instagramFollows, likes: fan.instagramLikes,
        comments: fan.instagramComments, shares: rand(0, 2),
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // Twitter
  if (fan.twitterFollows || fan.twitterLikes > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.TWITTER,
        follows: fan.twitterFollows, likes: fan.twitterLikes,
        comments: fan.twitterComments, shares: rand(0, 3),
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // YouTube — tutorials, type beats, production content
  if (fan.youtubeSubscribed || fan.youtubeViews > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.YOUTUBE,
        subscribed: fan.youtubeSubscribed, videoViews: fan.youtubeViews,
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // Email
  if (fan.emailOpens > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.EMAIL,
        emailOpens: fan.emailOpens, emailClicks: fan.emailClicks,
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // Score using real engine
  const allLinks = await prisma.fanPlatformLink.findMany({ where: { fanId: fanRecord.id } })

  const { calculateStanScore } = await import('../src/lib/scoring/stan-score')
  const scoreResult = calculateStanScore({
    platformLinks: allLinks.map((l) => ({
      platform: l.platform, streams: l.streams, playlistAdds: l.playlistAdds,
      saves: l.saves, follows: l.follows, likes: l.likes, comments: l.comments,
      shares: l.shares, subscribed: l.subscribed, videoViews: l.videoViews,
      watchTime: l.watchTime, emailOpens: l.emailOpens, emailClicks: l.emailClicks,
      tipCount: l.tipCount, tipAmountUsd: l.tipAmountUsd, tipFrequency: l.tipFrequency,
      momentSaves: l.momentSaves, cityAffiliation: l.cityAffiliation,
      purchaseCount: l.purchaseCount, purchaseAmountUsd: l.purchaseAmountUsd,
      subscriptionMonths: l.subscriptionMonths,
    })),
    firstSeenAt: fan.joinDate, lastActiveAt: lastActive, artistCity: producerCity,
  })

  await prisma.fan.update({
    where: { id: fanRecord.id },
    data: {
      stanScore: scoreResult.totalScore, tier: scoreResult.tier,
      convictionScore: scoreResult.convictionScore, platformScore: scoreResult.platformScore,
      engagementScore: scoreResult.engagementScore, longevityScore: scoreResult.longevityScore,
      recencyScore: scoreResult.recencyScore,
    },
  })

  // Log invisible producer revenue (BeatStars + Splice)
  const invisibleSpend = fan.beatStoresSales + fan.spliceRoyalties
  if (invisibleSpend > 0) {
    await prisma.fanEvent.create({
      data: {
        fanId: fanRecord.id, eventType: EventType.FIRST_STREAM,
        platform: Platform.TWITTER,
        description: `[INVISIBLE] BeatStores: $${fan.beatStoresSales.toFixed(2)}, Splice: $${fan.spliceRoyalties.toFixed(2)}. Total invisible: $${invisibleSpend.toFixed(2)}. Stan Score: ${scoreResult.totalScore} (${scoreResult.tier})`,
        occurredAt: fan.joinDate,
      },
    })
  }
}

async function createSimProducerFanUser(fan: SimProducerFan): Promise<string> {
  const fanUser = await prisma.fanUser.create({
    data: {
      email: fan.email, displayName: fan.displayName,
      betaCohort: fan.betaCohort as any, acquisitionChannel: 'COLD_SIGNUP' as any,
      betaInviteCode: `SIM-PR-FAN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      betaJoinedAt: fan.joinDate, onboardingCompleted: fan.hasSpotifyVerified,
      spotifyUserId: fan.hasSpotifyVerified ? `spotify_pr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : null,
      createdAt: fan.joinDate,
      updatedAt: fan.retained ? randomDate(subDays(NOW, 14), NOW) : randomDate(subDays(NOW, 90), subDays(NOW, 40)),
    },
  })
  return fanUser.id
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('=== StanVault Producer/Beatmaker ICP Stress Test ===\n')
  console.log('Testing hypothesis: Producers have the HIGHEST revenue visibility')
  console.log('of any non-music-artist segment (~30-50%) because Bandcamp, Ko-fi,')
  console.log('Patreon, and Dasham (for Afro producers) all fire conviction scoring.')
  console.log('BeatStars + Splice remain the invisible gap.\n')

  // Cleanup
  const existing = await prisma.user.count({ where: { email: { endsWith: EMAIL_SUFFIX } } })
  if (existing > 0) {
    console.log(`Cleaning up ${existing} existing Producer simulation users...`)
    const simUsers = await prisma.user.findMany({ where: { email: { endsWith: EMAIL_SUFFIX } }, select: { id: true } })
    const ids = simUsers.map(u => u.id)
    await prisma.fanEvent.deleteMany({ where: { fan: { userId: { in: ids } } } })
    await prisma.fanSnapshot.deleteMany({ where: { fan: { userId: { in: ids } } } })
    await prisma.fanPlatformLink.deleteMany({ where: { fan: { userId: { in: ids } } } })
    await prisma.listeningEvent.deleteMany({ where: { fan: { userId: { in: ids } } } })
    await prisma.dropClaim.deleteMany({ where: { drop: { userId: { in: ids } } } })
    await prisma.drop.deleteMany({ where: { userId: { in: ids } } })
    await prisma.fanUserArtistLink.deleteMany({ where: { artistId: { in: ids } } })
    await prisma.fan.deleteMany({ where: { userId: { in: ids } } })
    await prisma.user.deleteMany({ where: { id: { in: ids } } })
    await prisma.fanUserSession.deleteMany({ where: { fanUser: { email: { endsWith: EMAIL_SUFFIX } } } })
    await prisma.fanUserArtistLink.deleteMany({ where: { fanUser: { email: { endsWith: EMAIL_SUFFIX } } } })
    await prisma.dropClaim.deleteMany({ where: { fanUser: { email: { endsWith: EMAIL_SUFFIX } } } })
    await prisma.fanUser.deleteMany({ where: { email: { endsWith: EMAIL_SUFFIX } } })
    console.log('Cleanup complete.\n')
  }

  const producers = generateProducers()
  console.log(`Generating ${producers.length} producers/beatmakers...\n`)

  const producerRecords: Array<{ id: string; producer: SimProducer }> = []
  const segLabels: Record<string, string> = {
    'CORE_AFROBEATS': 'Afrobeats/Amapiano',
    'INDIE_HIPHOP_RNB': 'Hip-Hop Beatmakers',
    'DIRECT_TO_FAN_INDIE': 'Electronic/EDM',
    'EXPERIMENTAL_NICHE': 'Lo-fi/Ambient',
    'MANAGER': 'Topliner/Session',
    'DIASPORA': 'YouTube Tutorial',
    'PRODUCER_DJ': 'Multi-Genre Indie',
  }
  const cohortStats: Record<string, { total: number; retained: number }> = {}

  for (const s of producers) {
    const id = await createSimProducer(s)
    producerRecords.push({ id, producer: s })
    if (!cohortStats[s.betaCohort]) cohortStats[s.betaCohort] = { total: 0, retained: 0 }
    cohortStats[s.betaCohort].total++
    if (s.retained) cohortStats[s.betaCohort].retained++
  }

  console.log('Producer cohort breakdown:')
  for (const [cohort, stats] of Object.entries(cohortStats)) {
    const rate = stats.total ? Math.round((stats.retained / stats.total) * 100) : 0
    console.log(`  ${(segLabels[cohort] || cohort).padEnd(22)}: ${stats.total} total, ${stats.retained} retained (${rate}%)`)
  }

  // Fans
  console.log('\nGenerating producer fans/customers and platform data...\n')

  const fanAlloc = [
    { cohort: 'DEEP_AFRICAN', count: 25, retentionRate: 20, label: 'Beat Buyers' },
    { cohort: 'DIASPORA_SUPERFAN', count: 20, retentionRate: 25, label: 'Sample Pack Buyers' },
    { cohort: 'BANDCAMP_KOFI_SUPPORTER', count: 20, retentionRate: 15, label: 'Spotify Listeners' },
    { cohort: 'STREET_TEAM_LEADER', count: 20, retentionRate: 12, label: 'YouTube Subscribers' },
    { cohort: 'CASUAL_CURIOUS', count: 20, retentionRate: 10, label: 'Social Followers' },
    { cohort: 'COLD_SIGNUP', count: 15, retentionRate: 30, label: 'Ko-fi/Patreon Supporters' },
  ]

  let totalFans = 0
  const fanUserIds: string[] = []
  let totalInvisibleRevenue = 0
  let totalVisibleRevenue = 0
  const fanCohortStats: Record<string, { total: number; retained: number; verified: number; label: string }> = {}

  for (const alloc of fanAlloc) {
    fanCohortStats[alloc.cohort] = { total: 0, retained: 0, verified: 0, label: alloc.label }

    for (let i = 0; i < alloc.count; i++) {
      const target = pick(producerRecords)
      const fan = generateProducerFan(target.producer, i + 1, alloc.cohort, alloc.retentionRate)

      await createSimProducerFanRecord(target.id, target.producer.location, fan, target.producer)
      totalFans++

      // Revenue tracking
      const invisibleSpend = fan.beatStoresSales + fan.spliceRoyalties
      const visibleSpend = fan.bandcampAmountUsd + fan.kofiAmountUsd
        + (fan.patreonMonths * 10) + fan.merchAmountUsd + fan.dashamTipAmountUsd
      totalInvisibleRevenue += invisibleSpend
      totalVisibleRevenue += visibleSpend

      const fanUserId = await createSimProducerFanUser(fan)
      fanUserIds.push(fanUserId)

      fanCohortStats[alloc.cohort].total++
      if (fan.retained) fanCohortStats[alloc.cohort].retained++
      if (fan.hasSpotifyVerified) fanCohortStats[alloc.cohort].verified++

      await prisma.fanUserArtistLink.create({
        data: {
          fanUserId, artistId: target.id,
          verified: fan.hasSpotifyVerified,
          verifiedAt: fan.hasSpotifyVerified ? randomDate(fan.joinDate, NOW) : null,
          verifiedVia: fan.hasSpotifyVerified ? 'spotify' : null,
          tier: 'CASUAL', stanScore: 0, totalStreams: fan.streams,
          isFollowing: chance(40), firstSeenAt: fan.joinDate,
          lastActiveAt: fan.retained ? randomDate(subDays(NOW, 14), NOW) : randomDate(subDays(NOW, 90), subDays(NOW, 40)),
        },
      })

      if (fan.artistCount > 1) {
        const others = producerRecords.filter(s => s.id !== target.id)
        for (let j = 1; j < fan.artistCount && others.length > 0; j++) {
          const other = pick(others)
          try {
            await prisma.fanUserArtistLink.create({
              data: {
                fanUserId, artistId: other.id,
                verified: chance(25), verifiedAt: chance(25) ? randomDate(fan.joinDate, NOW) : null,
                verifiedVia: chance(25) ? 'spotify' : null,
                tier: 'CASUAL', stanScore: 0, totalStreams: rand(0, 15),
                isFollowing: chance(30), firstSeenAt: fan.joinDate,
                lastActiveAt: fan.retained ? randomDate(subDays(NOW, 14), NOW) : randomDate(subDays(NOW, 90), subDays(NOW, 40)),
              },
            })
          } catch { /* skip dups */ }
        }
      }
    }
  }

  console.log('Fan cohort breakdown:')
  for (const [, stats] of Object.entries(fanCohortStats)) {
    const retRate = stats.total ? Math.round((stats.retained / stats.total) * 100) : 0
    console.log(`  ${stats.label.padEnd(24)}: ${stats.total} total, ${stats.retained} retained (${retRate}%), ${stats.verified} verified`)
  }

  // Drops
  console.log('\nGenerating drops and claims...\n')
  let totalDrops = 0
  let totalClaims = 0

  for (const { id, producer } of producerRecords) {
    if (!producer.retained) continue
    const dropCount = rand(0, 3)
    for (let d = 0; d < dropCount; d++) {
      const drop = await prisma.drop.create({
        data: {
          userId: id,
          slug: `sim-pr-${producer.artistName.replace(/\s+/g, '-').toLowerCase()}-${d + 1}-${Date.now()}`,
          title: pick(['Exclusive Beat Preview', 'Free Sample Pack', 'Stem Download', 'Mixing Tutorial', 'Collab Opportunity', 'Early Album Access']),
          contentType: pick(['DOWNLOAD', 'LINK', 'MESSAGE']),
          minTier: pick(['CASUAL', 'ENGAGED', null]) as FanTier | null,
          isActive: true, createdAt: randomDate(producer.joinDate, NOW),
        },
      })
      totalDrops++
      const cc = rand(0, Math.min(2, fanUserIds.length))
      for (let c = 0; c < cc; c++) {
        try {
          await prisma.dropClaim.create({
            data: {
              dropId: drop.id, fanUserId: pick(fanUserIds),
              tier: pick(['CASUAL', 'ENGAGED']), stanScore: rand(5, 40),
              claimedAt: randomDate(drop.createdAt, NOW),
            },
          })
          totalClaims++
        } catch { /* skip dups */ }
      }
    }
  }

  console.log(`Created ${totalDrops} drops with ${totalClaims} claims\n`)

  // Final summary
  const allFanRecords = await prisma.fan.findMany({
    where: { user: { email: { endsWith: EMAIL_SUFFIX } } },
    select: { stanScore: true, tier: true, convictionScore: true, engagementScore: true, platformScore: true, longevityScore: true, recencyScore: true },
  })

  const tiers = { CASUAL: 0, ENGAGED: 0, DEDICATED: 0, SUPERFAN: 0 }
  let totScore = 0, totConv = 0, totEng = 0, totPlat = 0, withConv = 0
  for (const f of allFanRecords) {
    tiers[f.tier]++
    totScore += f.stanScore; totConv += f.convictionScore
    totEng += f.engagementScore; totPlat += f.platformScore
    if (f.convictionScore > 0) withConv++
  }

  const n = allFanRecords.length || 1
  console.log('=== Producer Simulation Complete ===\n')
  console.log(`  Producers: ${producers.length}`)
  console.log(`  Fans: ${totalFans}`)
  console.log(`  Drops: ${totalDrops}`)
  console.log(`  Claims: ${totalClaims}`)
  console.log(`\n  Score Distribution:`)
  console.log(`    CASUAL:    ${tiers.CASUAL}`)
  console.log(`    ENGAGED:   ${tiers.ENGAGED}`)
  console.log(`    DEDICATED: ${tiers.DEDICATED}`)
  console.log(`    SUPERFAN:  ${tiers.SUPERFAN}`)
  console.log(`    Avg Score: ${(totScore / n).toFixed(1)}`)
  console.log(`    Avg Conviction: ${(totConv / n).toFixed(1)}`)
  console.log(`    Avg Engagement: ${(totEng / n).toFixed(1)}`)
  console.log(`    Avg Platform:   ${(totPlat / n).toFixed(1)}`)
  console.log(`    Conviction > 0: ${withConv}/${allFanRecords.length} (${Math.round((withConv / n) * 100)}%)`)

  console.log(`\n  === REVENUE VISIBILITY GAP ===`)
  console.log(`    Fan spend on BeatStars+Splice (INVISIBLE): $${totalInvisibleRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)
  console.log(`    Fan spend visible to StanVault:             $${totalVisibleRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)
  const totalRev = totalInvisibleRevenue + totalVisibleRevenue
  console.log(`    Revenue visibility: ${totalRev > 0 ? ((totalVisibleRevenue / totalRev) * 100).toFixed(1) : '0.0'}%`)
  console.log(`    (Bandcamp + Ko-fi + Patreon + Merch + Dasham all visible)`)

  console.log(`\n  === FOUR-WAY COMPARISON ===`)
  console.log(`                    Music     OF      Twitch   Producer`)
  console.log(`    Avg Score:      42.8      33.4    26.2     ${(totScore / n).toFixed(1)}`)
  console.log(`    Avg Conviction:  2.7       0.3     0.2     ${(totConv / n).toFixed(1)}`)
  console.log(`    SUPERFAN:       1.8%      0.8%    0.0%     ${((tiers.SUPERFAN / n) * 100).toFixed(1)}%`)
  console.log(`    Rev Visible:    ~80%      0.5%    ~3%      ${totalRev > 0 ? ((totalVisibleRevenue / totalRev) * 100).toFixed(1) : '0.0'}%`)

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
