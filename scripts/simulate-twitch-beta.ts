/**
 * Simulate a 200-user beta test with Twitch streamers as the hypothetical ICP.
 *
 * Run: npx tsx scripts/simulate-twitch-beta.ts
 *
 * Tests whether Twitch streamers/viewers map to StanVault's scoring system.
 * Uses the REAL calculateStanScore() engine.
 *
 * Creator segments (80 streamers):
 *   - Top Twitch streamers (10K+ avg viewers, partner, merch): 10
 *   - Mid-tier streamers (500-5K avg viewers, affiliate): 20
 *   - Small streamers (50-500 avg viewers, grinding): 15
 *   - Music streamers (perform/produce on Twitch, Spotify): 10
 *   - Variety/IRL streamers (travel, cooking, just chatting): 10
 *   - Streamers with strong YouTube (VOD/highlights channel): 10
 *   - Esports/competitive (tournament players): 5
 *
 * Fan segments (120 viewers):
 *   - Tier 3 subs + bit donors (whale viewers): 15
 *   - Tier 1 subs (regular supporters): 30
 *   - Free viewers (follow but don't sub): 30
 *   - YouTube-first fans (watch VODs, rarely on Twitch live): 15
 *   - Discord community members (active in server, variable Twitch): 15
 *   - Lurkers (open tab, rarely interact): 15
 *
 * Hypothesis: Slightly better than OF (more cross-platform signals from YouTube/Discord)
 * but still structurally broken because Twitch sub/bit revenue is invisible.
 * Music streamers are the exception, same as OF+Music.
 */

import { PrismaClient, Platform, FanTier, EventType } from '@prisma/client'
import { subDays } from 'date-fns'

const prisma = new PrismaClient()

const BETA_START = subDays(new Date(), 90)
const NOW = new Date()

const STREAMER_CITIES = [
  'Los Angeles', 'Austin', 'Seattle', 'Toronto', 'London',
  'Berlin', 'Paris', 'Tokyo', 'Seoul', 'Sydney',
  'New York', 'Chicago', 'San Francisco', 'Stockholm', 'Amsterdam',
]

const TWITCH_CATEGORIES = [
  'Just Chatting', 'Fortnite', 'Valorant', 'League of Legends', 'Minecraft',
  'GTA V', 'Music', 'Art', 'IRL', 'Cooking',
  'Apex Legends', 'Call of Duty', 'Chess', 'Retro Gaming', 'VTuber',
]

const EMAIL_SUFFIX = '@twitch-beta.stanvault.test'

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
// Streamer (Creator) Generation
// ============================================

interface SimStreamer {
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
  makesMusic: boolean
}

function generateStreamers(): SimStreamer[] {
  const streamers: SimStreamer[] = []
  let idx = 0

  const make = (
    cohort: string, tier: string, channel: string, wave: number, retentionRate: number,
    config: {
      categories: string[]; cities: string[]; fanRange: [number, number]
      hasDasham: boolean; hasBandcamp: boolean; hasKofi: boolean; hasPatreon: boolean
      hasMerch: boolean; hasYoutube: boolean; makesMusic: boolean
    }
  ): SimStreamer => {
    idx++
    const waveOffset = (wave - 1) * 14
    const joinDate = randomDate(subDays(BETA_START, -waveOffset), subDays(BETA_START, -(waveOffset + 13)))
    return {
      name: `Streamer ${idx}`,
      email: `twitch.streamer${idx}${EMAIL_SUFFIX}`,
      artistName: `${pick(['xX', 'TTv_', '', 'The', 'Its'])}${pick(['Shadow', 'Pixel', 'Neon', 'Frost', 'Blaze', 'Mystic', 'Viper', 'Echo', 'Nova', 'Rogue'])}${pick(['_', ''])}${pick(['Gaming', 'Live', 'TV', 'Plays', 'Stream', idx.toString()])}`,
      genre: pick(config.categories),
      location: pick(config.cities),
      betaCohort: cohort, pricingTier: tier, acquisitionChannel: channel,
      retained: chance(retentionRate), joinDate, wave,
      fanCount: rand(...config.fanRange),
      hasDasham: config.hasDasham, hasBandcamp: config.hasBandcamp,
      hasKofi: config.hasKofi, hasPatreon: config.hasPatreon,
      hasMerch: config.hasMerch, hasYoutube: config.hasYoutube,
      makesMusic: config.makesMusic,
    }
  }

  // Top Twitch streamers — 10
  // Already have Twitch analytics, StreamElements, etc. StanVault adds little.
  // Retention: ~15% — they have better tools already
  for (let i = 0; i < 10; i++) {
    streamers.push(make('CORE_AFROBEATS', 'STARTER', 'COLD_SIGNUP', 1, 15, {
      categories: ['Just Chatting', 'Fortnite', 'Valorant', 'GTA V'],
      cities: STREAMER_CITIES, fanRange: [10, 30],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(15), hasPatreon: chance(20),
      hasMerch: chance(60), // Top streamers often have merch
      hasYoutube: true, // Almost all top streamers have YouTube
      makesMusic: false,
    }))
  }

  // Mid-tier streamers — 20
  // Some cross-platform presence, looking for growth tools
  // Retention: ~18% — scoring doesn't feel useful for their use case
  for (let i = 0; i < 20; i++) {
    streamers.push(make('DIRECT_TO_FAN_INDIE', 'STARTER', 'COLD_SIGNUP', 1, 18, {
      categories: TWITCH_CATEGORIES,
      cities: STREAMER_CITIES, fanRange: [6, 18],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(20), hasPatreon: chance(15),
      hasMerch: chance(30),
      hasYoutube: chance(70), // Most mid-tier have YouTube
      makesMusic: false,
    }))
  }

  // Small streamers — 15
  // Grinding for affiliate, desperate for any insight
  // Retention: ~20% — might stay hoping it helps, but signals are thin
  for (let i = 0; i < 15; i++) {
    streamers.push(make('EXPERIMENTAL_NICHE', 'STARTER', 'COLD_SIGNUP', 2, 20, {
      categories: TWITCH_CATEGORIES,
      cities: STREAMER_CITIES, fanRange: [3, 10],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(10), hasPatreon: chance(8),
      hasMerch: chance(10),
      hasYoutube: chance(40),
      makesMusic: false,
    }))
  }

  // Music streamers — 10
  // THE EXCEPTION: Perform/produce on Twitch, release on Spotify/Bandcamp
  // Retention: ~55% — scoring actually works for their music output
  for (let i = 0; i < 10; i++) {
    streamers.push(make('DIASPORA', 'STARTER', 'MUSIC_TWITTER', 2, 55, {
      categories: ['Music'],
      cities: ['Los Angeles', 'London', 'Berlin', 'New York', 'Atlanta', 'Nashville'],
      fanRange: [8, 25],
      hasDasham: false,
      hasBandcamp: chance(60), // Music streamers often sell on Bandcamp
      hasKofi: chance(40),
      hasPatreon: chance(50), // Many have Patreon for stems/samples
      hasMerch: chance(45),
      hasYoutube: chance(80),
      makesMusic: true,
    }))
  }

  // Variety/IRL streamers — 10
  // Travel, cooking, just chatting. Strong social but no music signals.
  // Retention: ~12% — scoring misses their value entirely
  for (let i = 0; i < 10; i++) {
    streamers.push(make('INDIE_HIPHOP_RNB', 'STARTER', 'COLD_SIGNUP', 3, 12, {
      categories: ['IRL', 'Cooking', 'Just Chatting', 'Art'],
      cities: STREAMER_CITIES, fanRange: [5, 15],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(25), hasPatreon: chance(20),
      hasMerch: chance(20),
      hasYoutube: chance(60),
      makesMusic: false,
    }))
  }

  // Streamers with strong YouTube presence — 10
  // YouTube highlights/VODs are their main growth channel
  // Retention: ~22% — YouTube engagement signals fire, slightly better
  for (let i = 0; i < 10; i++) {
    streamers.push(make('MANAGER', 'STARTER', 'COLD_SIGNUP', 2, 22, {
      categories: TWITCH_CATEGORIES,
      cities: STREAMER_CITIES, fanRange: [6, 20],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(15), hasPatreon: chance(15),
      hasMerch: chance(35),
      hasYoutube: true, // Always have YouTube — that's their thing
      makesMusic: false,
    }))
  }

  // Esports/competitive — 5
  // Tournament players, team-affiliated. Fans care about gameplay, not personal connection.
  // Retention: ~8% — StanVault's "superfan relationship" model doesn't fit esports
  for (let i = 0; i < 5; i++) {
    streamers.push(make('PRODUCER_DJ', 'STARTER', 'COLD_SIGNUP', 3, 8, {
      categories: ['Valorant', 'League of Legends', 'Apex Legends', 'Call of Duty'],
      cities: STREAMER_CITIES, fanRange: [5, 15],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(5), hasPatreon: chance(5),
      hasMerch: chance(20), // Team merch mostly
      hasYoutube: chance(50),
      makesMusic: false,
    }))
  }

  return streamers
}

// ============================================
// Twitch Fan/Viewer Generation
// ============================================

interface SimTwitchFan {
  displayName: string
  email: string
  city: string
  betaCohort: string
  retained: boolean
  joinDate: Date
  // Spotify (only if streamer makes music)
  streams: number
  // Financial signals visible to StanVault
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
  twitterComments: number
  youtubeSubscribed: boolean
  youtubeViews: number
  emailOpens: number
  emailClicks: number
  // Twitch-specific (INVISIBLE to StanVault)
  twitchSubTier: number // 0=free, 1=$4.99, 2=$9.99, 3=$24.99
  twitchSubMonths: number
  twitchBitsDonated: number
  twitchGiftSubs: number
  twitchChatMessages: number // per month avg
  twitchWatchHours: number // per month avg
  hasSpotifyVerified: boolean
  artistCount: number
}

function generateTwitchFan(
  streamer: SimStreamer, fanIdx: number, fanCohort: string, retentionRate: number
): SimTwitchFan {
  const isWhale = fanCohort === 'DEEP_AFRICAN' // Tier 3 subs + bit whales
  const isTier1 = fanCohort === 'DIASPORA_SUPERFAN' // Regular tier 1 subs
  const isFreeViewer = fanCohort === 'BANDCAMP_KOFI_SUPPORTER' // Follow but don't sub
  const isYoutubeFirst = fanCohort === 'STREET_TEAM_LEADER' // Watch VODs primarily
  const isDiscordMember = fanCohort === 'CASUAL_CURIOUS' // Active in Discord
  const isLurker = fanCohort === 'COLD_SIGNUP' // Open tab, rarely interact

  const retained = chance(retentionRate)
  const joinDate = randomDate(streamer.joinDate, subDays(NOW, 30))

  // Twitch-specific (INVISIBLE)
  let twitchSubTier = 0
  let twitchSubMonths = 0
  let twitchBitsDonated = 0
  let twitchGiftSubs = 0
  let twitchChatMessages = 0
  let twitchWatchHours = 0

  // Visible signals
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
  let twitterComments = 0
  let youtubeSubscribed = false
  let youtubeViews = 0
  let emailOpens = 0
  let emailClicks = 0

  if (isWhale) {
    // WHALE: Tier 3 sub, donates thousands of bits, gifts subs
    twitchSubTier = 3
    twitchSubMonths = rand(6, 36)
    twitchBitsDonated = rand(5000, 50000) // $50-500 in bits
    twitchGiftSubs = rand(5, 50)
    twitchChatMessages = rand(100, 500)
    twitchWatchHours = rand(40, 150)
    // Cross-platform visible signals — whales are vocal
    twitterFollows = true
    twitterLikes = rand(10, 40)
    twitterComments = rand(3, 15)
    instagramFollows = chance(60)
    instagramLikes = rand(5, 20)
    youtubeSubscribed = streamer.hasYoutube ? true : chance(30)
    youtubeViews = youtubeSubscribed ? rand(20, 100) : 0
    hasKofiPurchase = streamer.hasKofi ? chance(20) : false
    if (hasKofiPurchase) kofiAmountUsd = rand(5, 30)
    hasMerchPurchase = streamer.hasMerch ? chance(40) : false
    if (hasMerchPurchase) merchAmountUsd = rand(20, 80)
    hasPatreonSub = streamer.hasPatreon ? chance(25) : false
    if (hasPatreonSub) patreonMonths = rand(3, 12)
    emailOpens = chance(30) ? rand(2, 8) : 0
    emailClicks = emailOpens > 0 ? rand(1, 3) : 0
    if (streamer.makesMusic) streams = rand(30, 150)
  } else if (isTier1) {
    // TIER 1 SUB: $4.99/mo, moderate chat, follows on Twitter
    twitchSubTier = 1
    twitchSubMonths = rand(1, 18)
    twitchBitsDonated = rand(0, 500)
    twitchGiftSubs = rand(0, 3)
    twitchChatMessages = rand(20, 150)
    twitchWatchHours = rand(10, 60)
    twitterFollows = chance(70)
    twitterLikes = rand(3, 15)
    instagramFollows = chance(40)
    instagramLikes = rand(0, 10)
    youtubeSubscribed = streamer.hasYoutube ? chance(60) : false
    youtubeViews = youtubeSubscribed ? rand(5, 40) : 0
    hasKofiPurchase = streamer.hasKofi ? chance(10) : false
    if (hasKofiPurchase) kofiAmountUsd = rand(3, 10)
    hasMerchPurchase = streamer.hasMerch ? chance(15) : false
    if (hasMerchPurchase) merchAmountUsd = rand(15, 50)
    if (streamer.makesMusic) streams = rand(10, 60)
  } else if (isFreeViewer) {
    // FREE VIEWER: Follows on Twitch, watches regularly, doesn't pay
    twitchSubTier = 0
    twitchSubMonths = 0
    twitchChatMessages = rand(5, 50)
    twitchWatchHours = rand(5, 30)
    twitterFollows = chance(50)
    twitterLikes = rand(1, 8)
    instagramFollows = chance(30)
    youtubeSubscribed = streamer.hasYoutube ? chance(40) : false
    youtubeViews = youtubeSubscribed ? rand(3, 20) : 0
    if (streamer.makesMusic) streams = rand(5, 30)
  } else if (isYoutubeFirst) {
    // YOUTUBE-FIRST: Watches highlights/VODs, rarely on live Twitch
    twitchSubTier = 0
    twitchWatchHours = rand(1, 5)
    twitchChatMessages = rand(0, 5)
    // Strong YouTube engagement (THIS is visible to StanVault)
    youtubeSubscribed = true
    youtubeViews = rand(20, 100) // Heavy VOD watcher
    twitterFollows = chance(60)
    twitterLikes = rand(3, 12)
    instagramFollows = chance(40)
    instagramLikes = rand(2, 10)
    if (streamer.makesMusic) streams = rand(15, 70)
  } else if (isDiscordMember) {
    // DISCORD MEMBER: Very active in community, variable Twitch presence
    // Discord engagement is INVISIBLE to StanVault (no Discord platform)
    twitchSubTier = chance(30) ? 1 : 0
    twitchSubMonths = twitchSubTier > 0 ? rand(1, 6) : 0
    twitchChatMessages = rand(10, 80)
    twitchWatchHours = rand(5, 25)
    // Social visible signals
    twitterFollows = chance(60)
    twitterLikes = rand(2, 10)
    instagramFollows = chance(30)
    youtubeSubscribed = streamer.hasYoutube ? chance(50) : false
    youtubeViews = youtubeSubscribed ? rand(5, 30) : 0
    hasKofiPurchase = streamer.hasKofi ? chance(15) : false
    if (hasKofiPurchase) kofiAmountUsd = rand(3, 10)
    if (streamer.makesMusic) streams = rand(5, 40)
  } else if (isLurker) {
    // LURKER: Has tab open, maybe follows, almost no interaction
    twitchSubTier = 0
    twitchWatchHours = rand(1, 10) // AFK watching
    twitchChatMessages = rand(0, 2)
    twitterFollows = chance(15)
    instagramFollows = chance(10)
    youtubeSubscribed = chance(10)
    if (streamer.makesMusic) streams = rand(0, 10)
  }

  return {
    displayName: `Twitch Fan ${fanCohort.slice(0, 4)}-${fanIdx}`,
    email: `twitch.fan.${fanCohort.toLowerCase().replace(/_/g, '')}.${fanIdx}${EMAIL_SUFFIX}`,
    city: pick(STREAMER_CITIES),
    betaCohort: fanCohort,
    retained, joinDate, streams,
    hasKofiPurchase, hasPatreonSub, hasMerchPurchase,
    kofiAmountUsd, patreonMonths, merchAmountUsd,
    instagramFollows, instagramLikes, instagramComments,
    twitterFollows, twitterLikes, twitterComments,
    youtubeSubscribed, youtubeViews,
    emailOpens, emailClicks,
    twitchSubTier, twitchSubMonths, twitchBitsDonated,
    twitchGiftSubs, twitchChatMessages, twitchWatchHours,
    hasSpotifyVerified: streamer.makesMusic ? chance(45) : chance(8),
    artistCount: isWhale ? rand(2, 4) : isYoutubeFirst ? rand(1, 2) : 1,
  }
}

// ============================================
// Database Operations
// ============================================

async function createSimStreamer(s: SimStreamer): Promise<string> {
  const user = await prisma.user.create({
    data: {
      email: s.email, name: s.name, artistName: s.artistName,
      genre: s.genre, location: s.location,
      pricingTier: s.pricingTier as any,
      betaCohort: s.betaCohort as any,
      acquisitionChannel: s.acquisitionChannel as any,
      betaInviteCode: `SIM-TW-${s.betaCohort.slice(0, 4)}-${Date.now()}`,
      betaJoinedAt: s.joinDate, onboardingCompleted: true,
      createdAt: s.joinDate,
      updatedAt: s.retained ? randomDate(subDays(NOW, 7), NOW) : randomDate(subDays(NOW, 90), subDays(NOW, 35)),
    },
  })
  return user.id
}

async function createSimTwitchFanRecord(
  streamerId: string, streamerCity: string, fan: SimTwitchFan, streamer: SimStreamer
): Promise<void> {
  const lastActive = fan.retained
    ? randomDate(subDays(NOW, 14), NOW)
    : randomDate(subDays(NOW, 90), subDays(NOW, 40))

  const fanRecord = await prisma.fan.create({
    data: {
      userId: streamerId, displayName: fan.displayName,
      email: fan.email, city: fan.city,
      stanScore: 0, tier: 'CASUAL',
      firstSeenAt: fan.joinDate, lastActiveAt: lastActive, createdAt: fan.joinDate,
    },
  })

  // Platform links — what StanVault CAN see
  // Note: No TWITCH platform enum. Twitch engagement is invisible.

  // Spotify (only if streamer makes music)
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

  // Twitter (streamers are very Twitter-active)
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

  // YouTube — this is where Twitch fans diverge from OF fans
  // Twitch viewers often watch YouTube highlights/VODs
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

  // Ko-fi
  if (fan.hasKofiPurchase) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.KOFI,
        purchaseCount: rand(1, 3), purchaseAmountUsd: fan.kofiAmountUsd,
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
        purchaseCount: rand(1, 3), purchaseAmountUsd: fan.merchAmountUsd,
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
    firstSeenAt: fan.joinDate, lastActiveAt: lastActive, artistCity: streamerCity,
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

  // Log invisible Twitch revenue
  const twitchSpend = (fan.twitchSubTier === 3 ? 24.99 : fan.twitchSubTier === 2 ? 9.99 : fan.twitchSubTier === 1 ? 4.99 : 0) * fan.twitchSubMonths
    + fan.twitchBitsDonated * 0.01 // 100 bits = $1
    + fan.twitchGiftSubs * 4.99

  if (twitchSpend > 0) {
    await prisma.fanEvent.create({
      data: {
        fanId: fanRecord.id, eventType: EventType.FIRST_STREAM,
        platform: Platform.TWITTER,
        description: `[INVISIBLE] Twitch: T${fan.twitchSubTier} sub x${fan.twitchSubMonths}mo, ${fan.twitchBitsDonated} bits, ${fan.twitchGiftSubs} gift subs. Spend: $${twitchSpend.toFixed(2)}. Chat: ${fan.twitchChatMessages}/mo, Watch: ${fan.twitchWatchHours}hrs/mo. Stan Score: ${scoreResult.totalScore} (${scoreResult.tier})`,
        occurredAt: fan.joinDate,
      },
    })
  }
}

async function createSimTwitchFanUser(fan: SimTwitchFan): Promise<string> {
  const fanUser = await prisma.fanUser.create({
    data: {
      email: fan.email, displayName: fan.displayName,
      betaCohort: fan.betaCohort as any, acquisitionChannel: 'COLD_SIGNUP' as any,
      betaInviteCode: `SIM-TW-FAN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      betaJoinedAt: fan.joinDate, onboardingCompleted: fan.hasSpotifyVerified,
      spotifyUserId: fan.hasSpotifyVerified ? `spotify_tw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : null,
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
  console.log('=== StanVault Twitch Streamer ICP Stress Test ===\n')
  console.log('Testing hypothesis: Twitch streamers are structurally excluded,')
  console.log('slightly better than OF due to YouTube/social breadth.\n')

  // Cleanup
  const existing = await prisma.user.count({ where: { email: { endsWith: EMAIL_SUFFIX } } })
  if (existing > 0) {
    console.log(`Cleaning up ${existing} existing Twitch simulation users...`)
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

  const streamers = generateStreamers()
  console.log(`Generating ${streamers.length} Twitch streamers...\n`)

  const streamerRecords: Array<{ id: string; streamer: SimStreamer }> = []
  const segLabels: Record<string, string> = {
    'CORE_AFROBEATS': 'Top Streamers',
    'DIRECT_TO_FAN_INDIE': 'Mid-Tier Streamers',
    'EXPERIMENTAL_NICHE': 'Small Streamers',
    'DIASPORA': 'Music Streamers',
    'INDIE_HIPHOP_RNB': 'Variety/IRL',
    'MANAGER': 'YouTube-Heavy',
    'PRODUCER_DJ': 'Esports/Competitive',
  }
  const cohortStats: Record<string, { total: number; retained: number }> = {}

  for (const s of streamers) {
    const id = await createSimStreamer(s)
    streamerRecords.push({ id, streamer: s })
    if (!cohortStats[s.betaCohort]) cohortStats[s.betaCohort] = { total: 0, retained: 0 }
    cohortStats[s.betaCohort].total++
    if (s.retained) cohortStats[s.betaCohort].retained++
  }

  console.log('Streamer cohort breakdown:')
  for (const [cohort, stats] of Object.entries(cohortStats)) {
    const rate = stats.total ? Math.round((stats.retained / stats.total) * 100) : 0
    console.log(`  ${(segLabels[cohort] || cohort).padEnd(22)}: ${stats.total} total, ${stats.retained} retained (${rate}%)`)
  }

  // Fans
  console.log('\nGenerating Twitch viewers and platform data...\n')

  const fanAlloc = [
    { cohort: 'DEEP_AFRICAN', count: 15, retentionRate: 20, label: 'Whale Subs (T3 + Bits)' },
    { cohort: 'DIASPORA_SUPERFAN', count: 30, retentionRate: 12, label: 'Tier 1 Subs' },
    { cohort: 'BANDCAMP_KOFI_SUPPORTER', count: 30, retentionRate: 8, label: 'Free Viewers' },
    { cohort: 'STREET_TEAM_LEADER', count: 15, retentionRate: 18, label: 'YouTube-First Fans' },
    { cohort: 'CASUAL_CURIOUS', count: 15, retentionRate: 15, label: 'Discord Members' },
    { cohort: 'COLD_SIGNUP', count: 15, retentionRate: 3, label: 'Lurkers' },
  ]

  let totalFans = 0
  const fanUserIds: string[] = []
  let totalInvisibleRevenue = 0
  let totalVisibleRevenue = 0
  const fanCohortStats: Record<string, { total: number; retained: number; verified: number; label: string }> = {}

  for (const alloc of fanAlloc) {
    fanCohortStats[alloc.cohort] = { total: 0, retained: 0, verified: 0, label: alloc.label }

    for (let i = 0; i < alloc.count; i++) {
      const target = pick(streamerRecords)
      const fan = generateTwitchFan(target.streamer, i + 1, alloc.cohort, alloc.retentionRate)

      await createSimTwitchFanRecord(target.id, target.streamer.location, fan, target.streamer)
      totalFans++

      // Revenue tracking
      const twitchSpend = (fan.twitchSubTier === 3 ? 24.99 : fan.twitchSubTier === 2 ? 9.99 : fan.twitchSubTier === 1 ? 4.99 : 0) * fan.twitchSubMonths
        + fan.twitchBitsDonated * 0.01 + fan.twitchGiftSubs * 4.99
      const visibleSpend = fan.kofiAmountUsd + (fan.patreonMonths * 10) + fan.merchAmountUsd
      totalInvisibleRevenue += twitchSpend
      totalVisibleRevenue += visibleSpend

      const fanUserId = await createSimTwitchFanUser(fan)
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
        const others = streamerRecords.filter(s => s.id !== target.id)
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

  for (const { id, streamer } of streamerRecords) {
    if (!streamer.retained) continue
    const dropCount = rand(0, 3)
    for (let d = 0; d < dropCount; d++) {
      const drop = await prisma.drop.create({
        data: {
          userId: id,
          slug: `sim-tw-${streamer.artistName.replace(/\s+/g, '-').toLowerCase()}-${d + 1}-${Date.now()}`,
          title: pick(['Stream Highlight Reel', 'Emote Access', 'Discord VIP Role', 'Gaming Session Invite', 'Exclusive VOD', 'Merch Discount']),
          contentType: pick(['DOWNLOAD', 'LINK', 'MESSAGE']),
          minTier: pick(['CASUAL', 'ENGAGED', null]) as FanTier | null,
          isActive: true, createdAt: randomDate(streamer.joinDate, NOW),
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
  console.log('=== Twitch Simulation Complete ===\n')
  console.log(`  Streamers: ${streamers.length}`)
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
  console.log(`    Fan spend on Twitch (INVISIBLE): $${totalInvisibleRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)
  console.log(`    Fan spend visible to StanVault:  $${totalVisibleRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)
  const totalRev = totalInvisibleRevenue + totalVisibleRevenue
  console.log(`    Revenue visibility: ${totalRev > 0 ? ((totalVisibleRevenue / totalRev) * 100).toFixed(1) : '0.0'}%`)

  console.log(`\n  === THREE-WAY COMPARISON ===`)
  console.log(`                    Music     OF      Twitch`)
  console.log(`    Avg Score:      42.8      33.4    ${(totScore / n).toFixed(1)}`)
  console.log(`    Avg Conviction:  2.7       0.3    ${(totConv / n).toFixed(1)}`)
  console.log(`    SUPERFAN:       1.8%      0.8%    ${((tiers.SUPERFAN / n) * 100).toFixed(1)}%`)
  console.log(`    Rev Visible:    ~80%      0.5%    ${totalRev > 0 ? ((totalVisibleRevenue / totalRev) * 100).toFixed(1) : '0.0'}%`)

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
