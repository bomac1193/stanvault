/**
 * Simulate a 200-user beta test with YouTube creators as the hypothetical ICP.
 *
 * Run: npx tsx scripts/simulate-youtube-beta.ts
 *
 * YouTube creators are interesting because YouTube engagement IS in the scoring
 * (videoViews, subscribed), many have Patreon/Ko-fi + merch, and their fans
 * are more cross-platform than Twitch. But YouTube Studio already provides
 * excellent analytics — is StanVault additive?
 *
 * Creator segments (80 YouTubers):
 *   - Top YouTubers (500K+ subs, merch empire, Patreon): 10
 *   - Mid-tier (50K-200K subs, some merch/Patreon): 20
 *   - Small YouTubers (5K-50K subs, growing): 15
 *   - Music YouTubers (covers, original music, on Spotify): 10
 *   - Educational/tutorial (courses, Ko-fi, Patreon): 10
 *   - Vloggers/lifestyle (IG-heavy, brand deals): 10
 *   - Short-form first (Shorts/TikTok → YouTube): 5
 */

import { PrismaClient, Platform, FanTier, EventType } from '@prisma/client'
import { subDays } from 'date-fns'

const prisma = new PrismaClient()

const BETA_START = subDays(new Date(), 90)
const NOW = new Date()

const YT_CITIES = [
  'Los Angeles', 'London', 'New York', 'Toronto', 'Sydney',
  'Mumbai', 'Seoul', 'Tokyo', 'Berlin', 'Dubai',
  'Lagos', 'Nairobi', 'Sao Paulo', 'Mexico City', 'Stockholm',
]

const YT_CATEGORIES = [
  'Gaming', 'Vlogs', 'Tech', 'Cooking', 'Fitness', 'Education',
  'Music', 'Comedy', 'Beauty', 'Travel', 'Science', 'DIY',
  'Finance', 'Fashion', 'Animation',
]

const EMAIL_SUFFIX = '@youtube-beta.stanvault.test'

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
// YouTuber Generation
// ============================================

interface SimYouTuber {
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
  makesMusic: boolean
  hasEmail: boolean
}

function generateYouTubers(): SimYouTuber[] {
  const yters: SimYouTuber[] = []
  let idx = 0

  const make = (
    cohort: string, tier: string, channel: string, wave: number, retentionRate: number,
    config: {
      categories: string[]; cities: string[]; fanRange: [number, number]
      hasDasham: boolean; hasBandcamp: boolean; hasKofi: boolean; hasPatreon: boolean
      hasMerch: boolean; makesMusic: boolean; hasEmail: boolean
    }
  ): SimYouTuber => {
    idx++
    const waveOffset = (wave - 1) * 14
    const joinDate = randomDate(subDays(BETA_START, -waveOffset), subDays(BETA_START, -(waveOffset + 13)))
    return {
      name: `YouTuber ${idx}`,
      email: `yt.creator${idx}${EMAIL_SUFFIX}`,
      artistName: `${pick(['', 'The', 'Mr', 'Simply'])} ${pick(['Tech', 'Creative', 'Daily', 'Real', 'Pro', 'Ultra', 'Super', 'Mega'])}${pick(['Nick', 'Alex', 'Sam', 'Jay', 'Max', 'Kai', 'Zoe', 'Luna'])} ${idx}`,
      genre: pick(config.categories),
      location: pick(config.cities),
      betaCohort: cohort, pricingTier: tier, acquisitionChannel: channel,
      retained: chance(retentionRate), joinDate, wave,
      fanCount: rand(...config.fanRange),
      hasDasham: config.hasDasham, hasBandcamp: config.hasBandcamp,
      hasKofi: config.hasKofi, hasPatreon: config.hasPatreon,
      hasMerch: config.hasMerch, makesMusic: config.makesMusic,
      hasEmail: config.hasEmail,
    }
  }

  // Top YouTubers — 10
  // YouTube Studio is excellent. They have managers, MCNs. StanVault is redundant.
  // Retention: ~12% — already have better analytics
  for (let i = 0; i < 10; i++) {
    yters.push(make('CORE_AFROBEATS', 'STARTER', 'COLD_SIGNUP', 1, 12, {
      categories: ['Gaming', 'Vlogs', 'Tech', 'Comedy'],
      cities: YT_CITIES, fanRange: [10, 30],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(10), hasPatreon: chance(30),
      hasMerch: chance(70), // Top YouTubers almost always have merch
      makesMusic: false, hasEmail: chance(40),
    }))
  }

  // Mid-tier — 20
  // More cross-platform. Some might get value from audience unification.
  // Retention: ~22%
  for (let i = 0; i < 20; i++) {
    yters.push(make('DIRECT_TO_FAN_INDIE', 'STARTER', 'COLD_SIGNUP', 1, 22, {
      categories: YT_CATEGORIES,
      cities: YT_CITIES, fanRange: [6, 20],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(20), hasPatreon: chance(25),
      hasMerch: chance(40),
      makesMusic: false, hasEmail: chance(30),
    }))
  }

  // Small YouTubers — 15
  // Growing, looking for any edge. Cross-platform spread is thin.
  // Retention: ~18%
  for (let i = 0; i < 15; i++) {
    yters.push(make('EXPERIMENTAL_NICHE', 'STARTER', 'COLD_SIGNUP', 2, 18, {
      categories: YT_CATEGORIES,
      cities: YT_CITIES, fanRange: [3, 12],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(15), hasPatreon: chance(10),
      hasMerch: chance(15),
      makesMusic: false, hasEmail: chance(20),
    }))
  }

  // Music YouTubers — 10
  // THE EXCEPTION: Covers, original music, on Spotify AND YouTube
  // Retention: ~55% — scoring works for their music output
  for (let i = 0; i < 10; i++) {
    yters.push(make('DIASPORA', 'STARTER', 'MUSIC_TWITTER', 2, 55, {
      categories: ['Music'],
      cities: ['Los Angeles', 'London', 'Lagos', 'Seoul', 'New York', 'Nashville', 'Atlanta'],
      fanRange: [8, 25],
      hasDasham: false,
      hasBandcamp: chance(50), // Music YouTubers often sell on Bandcamp
      hasKofi: chance(35),
      hasPatreon: chance(45),
      hasMerch: chance(50),
      makesMusic: true, hasEmail: chance(40),
    }))
  }

  // Educational/tutorial — 10
  // Courses, Ko-fi, Patreon. Their fans pay for value.
  // Retention: ~28% — Ko-fi/Patreon signals fire, email engagement helps
  for (let i = 0; i < 10; i++) {
    yters.push(make('INDIE_HIPHOP_RNB', 'STARTER', 'COLD_SIGNUP', 2, 28, {
      categories: ['Education', 'Tech', 'Science', 'Finance'],
      cities: YT_CITIES, fanRange: [5, 18],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(40), // Edu creators often have Ko-fi
      hasPatreon: chance(50), // And Patreon
      hasMerch: chance(20),
      makesMusic: false, hasEmail: chance(60), // Email newsletters are big
    }))
  }

  // Vloggers/lifestyle — 10
  // IG-heavy, brand deal focused. Social engagement is their lane.
  // Retention: ~15%
  for (let i = 0; i < 10; i++) {
    yters.push(make('MANAGER', 'STARTER', 'COLD_SIGNUP', 3, 15, {
      categories: ['Vlogs', 'Beauty', 'Fashion', 'Travel', 'Lifestyle'],
      cities: YT_CITIES, fanRange: [5, 15],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(10), hasPatreon: chance(15),
      hasMerch: chance(35),
      makesMusic: false, hasEmail: chance(20),
    }))
  }

  // Short-form first (Shorts/TikTok) — 5
  // TikTok is primary, YouTube Shorts is secondary. Very surface engagement.
  // Retention: ~8%
  for (let i = 0; i < 5; i++) {
    yters.push(make('PRODUCER_DJ', 'STARTER', 'COLD_SIGNUP', 3, 8, {
      categories: ['Comedy', 'Dance', 'Lifestyle'],
      cities: YT_CITIES, fanRange: [3, 10],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(5), hasPatreon: chance(5),
      hasMerch: chance(10),
      makesMusic: false, hasEmail: false,
    }))
  }

  return yters
}

// ============================================
// YouTube Fan Generation
// ============================================

interface SimYTFan {
  displayName: string
  email: string
  city: string
  betaCohort: string
  retained: boolean
  joinDate: Date
  streams: number
  hasKofiPurchase: boolean
  hasPatreonSub: boolean
  hasMerchPurchase: boolean
  kofiAmountUsd: number
  patreonMonths: number
  merchAmountUsd: number
  instagramFollows: boolean
  instagramLikes: number
  instagramComments: number
  twitterFollows: boolean
  twitterLikes: number
  twitterComments: number
  youtubeSubscribed: boolean
  youtubeViews: number
  tiktokFollows: boolean
  tiktokLikes: number
  emailOpens: number
  emailClicks: number
  // YouTube-specific (partially visible via YouTube platform link)
  ytMembershipTier: number // 0=free, 1=$4.99, 2=$9.99, 3=$24.99 — INVISIBLE
  ytMembershipMonths: number // INVISIBLE
  ytSuperChats: number // Dollar amount — INVISIBLE
  ytWatchHoursPerMonth: number // INVISIBLE (only videoViews counted)
  hasSpotifyVerified: boolean
  artistCount: number
}

function generateYTFan(
  creator: SimYouTuber, fanIdx: number, fanCohort: string, retentionRate: number
): SimYTFan {
  const isPatreonSupporter = fanCohort === 'DEEP_AFRICAN'
  const isSubscriber = fanCohort === 'DIASPORA_SUPERFAN' // YouTube member/active viewer
  const isSocialFan = fanCohort === 'BANDCAMP_KOFI_SUPPORTER'
  const isEmailSub = fanCohort === 'STREET_TEAM_LEADER'
  const isTikTokFirst = fanCohort === 'CASUAL_CURIOUS'
  const isLurker = fanCohort === 'COLD_SIGNUP'

  const retained = chance(retentionRate)
  const joinDate = randomDate(creator.joinDate, subDays(NOW, 30))

  // Invisible YouTube revenue
  let ytMembershipTier = 0
  let ytMembershipMonths = 0
  let ytSuperChats = 0
  let ytWatchHoursPerMonth = 0

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
  let tiktokFollows = false
  let tiktokLikes = 0
  let emailOpens = 0
  let emailClicks = 0

  if (isPatreonSupporter) {
    // PATREON SUPPORTER: Pays on Patreon, active on YouTube, cross-platform
    // Patreon is VISIBLE — this is where YouTube fans score best
    hasPatreonSub = true
    patreonMonths = rand(2, 18)
    youtubeSubscribed = true
    youtubeViews = rand(30, 120)
    ytMembershipTier = chance(30) ? rand(1, 2) : 0
    ytMembershipMonths = ytMembershipTier > 0 ? rand(1, 12) : 0
    ytSuperChats = chance(20) ? rand(5, 50) : 0
    ytWatchHoursPerMonth = rand(5, 30)
    twitterFollows = chance(70)
    twitterLikes = rand(5, 20)
    twitterComments = rand(1, 8)
    instagramFollows = chance(50)
    instagramLikes = rand(3, 15)
    hasMerchPurchase = creator.hasMerch ? chance(30) : false
    if (hasMerchPurchase) merchAmountUsd = rand(15, 60)
    hasKofiPurchase = creator.hasKofi ? chance(20) : false
    if (hasKofiPurchase) kofiAmountUsd = rand(5, 20)
    emailOpens = creator.hasEmail ? rand(3, 12) : 0
    emailClicks = emailOpens > 0 ? rand(1, 5) : 0
    if (creator.makesMusic) streams = rand(30, 150)
  } else if (isSubscriber) {
    // ACTIVE SUBSCRIBER: Watches regularly, might be member
    youtubeSubscribed = true
    youtubeViews = rand(15, 80)
    ytMembershipTier = chance(15) ? 1 : 0
    ytMembershipMonths = ytMembershipTier > 0 ? rand(1, 8) : 0
    ytSuperChats = chance(10) ? rand(2, 20) : 0
    ytWatchHoursPerMonth = rand(3, 20)
    twitterFollows = chance(50)
    twitterLikes = rand(2, 10)
    instagramFollows = chance(35)
    instagramLikes = rand(1, 8)
    hasPatreonSub = creator.hasPatreon ? chance(10) : false
    if (hasPatreonSub) patreonMonths = rand(1, 6)
    hasMerchPurchase = creator.hasMerch ? chance(10) : false
    if (hasMerchPurchase) merchAmountUsd = rand(15, 40)
    emailOpens = creator.hasEmail ? rand(1, 5) : 0
    emailClicks = emailOpens > 0 ? rand(0, 2) : 0
    if (creator.makesMusic) streams = rand(10, 60)
  } else if (isSocialFan) {
    // SOCIAL FAN: IG/Twitter-first, watches some YouTube
    youtubeSubscribed = chance(60)
    youtubeViews = rand(3, 25)
    ytWatchHoursPerMonth = rand(1, 5)
    instagramFollows = true
    instagramLikes = rand(10, 40)
    instagramComments = rand(2, 10)
    twitterFollows = chance(70)
    twitterLikes = rand(5, 20)
    twitterComments = rand(1, 5)
    tiktokFollows = chance(40)
    tiktokLikes = rand(3, 15)
    if (creator.makesMusic) streams = rand(5, 30)
  } else if (isEmailSub) {
    // EMAIL SUBSCRIBER: Opens newsletters, clicks links
    youtubeSubscribed = chance(70)
    youtubeViews = rand(5, 30)
    ytWatchHoursPerMonth = rand(2, 10)
    emailOpens = rand(5, 20) // Heavy email engagement
    emailClicks = rand(2, 8)
    twitterFollows = chance(40)
    twitterLikes = rand(1, 8)
    hasPatreonSub = creator.hasPatreon ? chance(15) : false
    if (hasPatreonSub) patreonMonths = rand(1, 6)
    hasKofiPurchase = creator.hasKofi ? chance(15) : false
    if (hasKofiPurchase) kofiAmountUsd = rand(3, 10)
    if (creator.makesMusic) streams = rand(10, 40)
  } else if (isTikTokFirst) {
    // TIKTOK-FIRST: Follows on TikTok, some YouTube Shorts
    youtubeSubscribed = chance(30)
    youtubeViews = rand(1, 10) // Mostly Shorts
    ytWatchHoursPerMonth = rand(0, 2)
    tiktokFollows = true
    tiktokLikes = rand(5, 30)
    instagramFollows = chance(40)
    instagramLikes = rand(2, 10)
    twitterFollows = chance(20)
    if (creator.makesMusic) streams = rand(2, 15)
  } else if (isLurker) {
    // LURKER: Watched one video, maybe subscribed
    youtubeSubscribed = chance(20)
    youtubeViews = rand(1, 5)
    ytWatchHoursPerMonth = rand(0, 1)
    twitterFollows = chance(10)
    instagramFollows = chance(10)
    if (creator.makesMusic) streams = rand(0, 5)
  }

  return {
    displayName: `YT Fan ${fanCohort.slice(0, 4)}-${fanIdx}`,
    email: `yt.fan.${fanCohort.toLowerCase().replace(/_/g, '')}.${fanIdx}${EMAIL_SUFFIX}`,
    city: pick(YT_CITIES),
    betaCohort: fanCohort, retained, joinDate, streams,
    hasKofiPurchase, hasPatreonSub, hasMerchPurchase,
    kofiAmountUsd, patreonMonths, merchAmountUsd,
    instagramFollows, instagramLikes, instagramComments,
    twitterFollows, twitterLikes, twitterComments,
    youtubeSubscribed, youtubeViews,
    tiktokFollows, tiktokLikes,
    emailOpens, emailClicks,
    ytMembershipTier, ytMembershipMonths, ytSuperChats, ytWatchHoursPerMonth,
    hasSpotifyVerified: creator.makesMusic ? chance(45) : chance(8),
    artistCount: isPatreonSupporter ? rand(1, 3) : 1,
  }
}

// ============================================
// Database Operations
// ============================================

async function createSimYouTuber(yt: SimYouTuber): Promise<string> {
  const user = await prisma.user.create({
    data: {
      email: yt.email, name: yt.name, artistName: yt.artistName,
      genre: yt.genre, location: yt.location,
      pricingTier: yt.pricingTier as any,
      betaCohort: yt.betaCohort as any,
      acquisitionChannel: yt.acquisitionChannel as any,
      betaInviteCode: `SIM-YT-${yt.betaCohort.slice(0, 4)}-${Date.now()}`,
      betaJoinedAt: yt.joinDate, onboardingCompleted: true,
      createdAt: yt.joinDate,
      updatedAt: yt.retained ? randomDate(subDays(NOW, 7), NOW) : randomDate(subDays(NOW, 90), subDays(NOW, 35)),
    },
  })
  return user.id
}

async function createSimYTFanRecord(
  creatorId: string, creatorCity: string, fan: SimYTFan, creator: SimYouTuber
): Promise<void> {
  const lastActive = fan.retained
    ? randomDate(subDays(NOW, 14), NOW)
    : randomDate(subDays(NOW, 90), subDays(NOW, 40))

  const fanRecord = await prisma.fan.create({
    data: {
      userId: creatorId, displayName: fan.displayName,
      email: fan.email, city: fan.city,
      stanScore: 0, tier: 'CASUAL',
      firstSeenAt: fan.joinDate, lastActiveAt: lastActive, createdAt: fan.joinDate,
    },
  })

  // Spotify — only music YouTubers
  if (fan.streams > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.SPOTIFY,
        streams: fan.streams, playlistAdds: rand(0, Math.floor(fan.streams / 25)),
        saves: rand(0, Math.floor(fan.streams / 15)), follows: chance(35),
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // YouTube — THIS is visible and where YT fans should score better
  if (fan.youtubeSubscribed || fan.youtubeViews > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.YOUTUBE,
        subscribed: fan.youtubeSubscribed,
        videoViews: fan.youtubeViews,
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

  // TikTok
  if (fan.tiktokFollows || fan.tiktokLikes > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.TIKTOK,
        follows: fan.tiktokFollows, likes: fan.tiktokLikes,
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
        purchaseAmountUsd: fan.patreonMonths * rand(5, 20),
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

  // Score with real engine
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
    firstSeenAt: fan.joinDate, lastActiveAt: lastActive, artistCity: creatorCity,
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

  // Log invisible YT revenue
  const ytSpend = (fan.ytMembershipTier === 3 ? 24.99 : fan.ytMembershipTier === 2 ? 9.99 : fan.ytMembershipTier === 1 ? 4.99 : 0) * fan.ytMembershipMonths + fan.ytSuperChats
  if (ytSpend > 0) {
    await prisma.fanEvent.create({
      data: {
        fanId: fanRecord.id, eventType: EventType.FIRST_STREAM,
        platform: Platform.YOUTUBE,
        description: `[INVISIBLE] YT: Membership T${fan.ytMembershipTier} x${fan.ytMembershipMonths}mo, SuperChats $${fan.ytSuperChats}. Spend: $${ytSpend.toFixed(2)}. Watch: ${fan.ytWatchHoursPerMonth}hrs/mo. Score: ${scoreResult.totalScore} (${scoreResult.tier})`,
        occurredAt: fan.joinDate,
      },
    })
  }
}

async function createSimYTFanUser(fan: SimYTFan): Promise<string> {
  const fanUser = await prisma.fanUser.create({
    data: {
      email: fan.email, displayName: fan.displayName,
      betaCohort: fan.betaCohort as any, acquisitionChannel: 'COLD_SIGNUP' as any,
      betaInviteCode: `SIM-YT-FAN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      betaJoinedAt: fan.joinDate, onboardingCompleted: fan.hasSpotifyVerified,
      spotifyUserId: fan.hasSpotifyVerified ? `spotify_yt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : null,
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
  console.log('=== StanVault YouTube Creator ICP Stress Test ===\n')
  console.log('Testing: YouTube engagement IS scored (videoViews, subscribed).')
  console.log('Hypothesis: Better than Twitch/OF, but YouTube Studio is already excellent.\n')

  // Cleanup
  const existing = await prisma.user.count({ where: { email: { endsWith: EMAIL_SUFFIX } } })
  if (existing > 0) {
    console.log(`Cleaning up ${existing} existing YouTube simulation users...`)
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

  const creators = generateYouTubers()
  console.log(`Generating ${creators.length} YouTube creators...\n`)

  const creatorRecords: Array<{ id: string; creator: SimYouTuber }> = []
  const segLabels: Record<string, string> = {
    'CORE_AFROBEATS': 'Top YouTubers',
    'DIRECT_TO_FAN_INDIE': 'Mid-Tier',
    'EXPERIMENTAL_NICHE': 'Small YouTubers',
    'DIASPORA': 'Music YouTubers',
    'INDIE_HIPHOP_RNB': 'Edu/Tutorial',
    'MANAGER': 'Vloggers/Lifestyle',
    'PRODUCER_DJ': 'Short-Form First',
  }
  const cohortStats: Record<string, { total: number; retained: number }> = {}

  for (const c of creators) {
    const id = await createSimYouTuber(c)
    creatorRecords.push({ id, creator: c })
    if (!cohortStats[c.betaCohort]) cohortStats[c.betaCohort] = { total: 0, retained: 0 }
    cohortStats[c.betaCohort].total++
    if (c.retained) cohortStats[c.betaCohort].retained++
  }

  console.log('Creator cohort breakdown:')
  for (const [cohort, stats] of Object.entries(cohortStats)) {
    const rate = stats.total ? Math.round((stats.retained / stats.total) * 100) : 0
    console.log(`  ${(segLabels[cohort] || cohort).padEnd(22)}: ${stats.total} total, ${stats.retained} retained (${rate}%)`)
  }

  // Fans
  console.log('\nGenerating YouTube fans and platform data...\n')

  const fanAlloc = [
    { cohort: 'DEEP_AFRICAN', count: 20, retentionRate: 25, label: 'Patreon Supporters' },
    { cohort: 'DIASPORA_SUPERFAN', count: 25, retentionRate: 15, label: 'Active Subscribers' },
    { cohort: 'BANDCAMP_KOFI_SUPPORTER', count: 25, retentionRate: 12, label: 'Social Fans' },
    { cohort: 'STREET_TEAM_LEADER', count: 15, retentionRate: 20, label: 'Email Subscribers' },
    { cohort: 'CASUAL_CURIOUS', count: 15, retentionRate: 8, label: 'TikTok-First' },
    { cohort: 'COLD_SIGNUP', count: 20, retentionRate: 3, label: 'Lurkers' },
  ]

  let totalFans = 0
  const fanUserIds: string[] = []
  let totalInvisibleRevenue = 0
  let totalVisibleRevenue = 0
  const fanCohortStats: Record<string, { total: number; retained: number; verified: number; label: string }> = {}

  for (const alloc of fanAlloc) {
    fanCohortStats[alloc.cohort] = { total: 0, retained: 0, verified: 0, label: alloc.label }

    for (let i = 0; i < alloc.count; i++) {
      const target = pick(creatorRecords)
      const fan = generateYTFan(target.creator, i + 1, alloc.cohort, alloc.retentionRate)

      await createSimYTFanRecord(target.id, target.creator.location, fan, target.creator)
      totalFans++

      const ytSpend = (fan.ytMembershipTier === 3 ? 24.99 : fan.ytMembershipTier === 2 ? 9.99 : fan.ytMembershipTier === 1 ? 4.99 : 0) * fan.ytMembershipMonths + fan.ytSuperChats
      const visibleSpend = fan.kofiAmountUsd + (fan.patreonMonths * 10) + fan.merchAmountUsd
      totalInvisibleRevenue += ytSpend
      totalVisibleRevenue += visibleSpend

      const fanUserId = await createSimYTFanUser(fan)
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
        const others = creatorRecords.filter(c => c.id !== target.id)
        for (let j = 1; j < fan.artistCount && others.length > 0; j++) {
          const other = pick(others)
          try {
            await prisma.fanUserArtistLink.create({
              data: {
                fanUserId, artistId: other.id,
                verified: chance(20), verifiedAt: chance(20) ? randomDate(fan.joinDate, NOW) : null,
                verifiedVia: chance(20) ? 'spotify' : null,
                tier: 'CASUAL', stanScore: 0, totalStreams: rand(0, 10),
                isFollowing: chance(25), firstSeenAt: fan.joinDate,
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
    console.log(`  ${stats.label.padEnd(22)}: ${stats.total} total, ${stats.retained} retained (${retRate}%), ${stats.verified} verified`)
  }

  // Drops
  console.log('\nGenerating drops and claims...\n')
  let totalDrops = 0, totalClaims = 0

  for (const { id, creator } of creatorRecords) {
    if (!creator.retained) continue
    const dropCount = rand(0, 3)
    for (let d = 0; d < dropCount; d++) {
      const drop = await prisma.drop.create({
        data: {
          userId: id,
          slug: `sim-yt-${creator.artistName.replace(/\s+/g, '-').toLowerCase()}-${d + 1}-${Date.now()}`,
          title: pick(['Exclusive BTS Video', 'Early Access Upload', 'Patreon Sneak Peek', 'Merch Discount', 'Community Shoutout', 'Bonus Tutorial']),
          contentType: pick(['DOWNLOAD', 'LINK', 'MESSAGE']),
          minTier: pick(['CASUAL', 'ENGAGED', null]) as FanTier | null,
          isActive: true, createdAt: randomDate(creator.joinDate, NOW),
        },
      })
      totalDrops++
      const cc = rand(0, Math.min(2, fanUserIds.length))
      for (let c = 0; c < cc; c++) {
        try {
          await prisma.dropClaim.create({
            data: {
              dropId: drop.id, fanUserId: pick(fanUserIds),
              tier: pick(['CASUAL', 'ENGAGED', 'DEDICATED']), stanScore: rand(10, 50),
              claimedAt: randomDate(drop.createdAt, NOW),
            },
          })
          totalClaims++
        } catch { /* skip */ }
      }
    }
  }

  console.log(`Created ${totalDrops} drops with ${totalClaims} claims\n`)

  // Summary
  const allFanRecords = await prisma.fan.findMany({
    where: { user: { email: { endsWith: EMAIL_SUFFIX } } },
    select: { stanScore: true, tier: true, convictionScore: true, engagementScore: true, platformScore: true, longevityScore: true, recencyScore: true },
  })

  const tiers = { CASUAL: 0, ENGAGED: 0, DEDICATED: 0, SUPERFAN: 0 }
  let totS = 0, totC = 0, totE = 0, totP = 0, wC = 0
  for (const f of allFanRecords) {
    tiers[f.tier]++; totS += f.stanScore; totC += f.convictionScore
    totE += f.engagementScore; totP += f.platformScore
    if (f.convictionScore > 0) wC++
  }

  const n = allFanRecords.length || 1
  console.log('=== YouTube Simulation Complete ===\n')
  console.log(`  Creators: ${creators.length}`)
  console.log(`  Fans: ${totalFans}`)
  console.log(`  Drops: ${totalDrops}, Claims: ${totalClaims}`)
  console.log(`\n  Score Distribution:`)
  console.log(`    CASUAL:    ${tiers.CASUAL}`)
  console.log(`    ENGAGED:   ${tiers.ENGAGED}`)
  console.log(`    DEDICATED: ${tiers.DEDICATED}`)
  console.log(`    SUPERFAN:  ${tiers.SUPERFAN}`)
  console.log(`    Avg Score: ${(totS / n).toFixed(1)}`)
  console.log(`    Avg Conviction: ${(totC / n).toFixed(1)}`)
  console.log(`    Avg Engagement: ${(totE / n).toFixed(1)}`)
  console.log(`    Avg Platform:   ${(totP / n).toFixed(1)}`)
  console.log(`    Conviction > 0: ${wC}/${allFanRecords.length} (${Math.round((wC / n) * 100)}%)`)

  const totalRev = totalInvisibleRevenue + totalVisibleRevenue
  console.log(`\n  === REVENUE VISIBILITY GAP ===`)
  console.log(`    Fan spend on YouTube (INVISIBLE):    $${totalInvisibleRevenue.toFixed(0)}`)
  console.log(`    Fan spend visible to StanVault:      $${totalVisibleRevenue.toFixed(0)}`)
  console.log(`    Revenue visibility: ${totalRev > 0 ? ((totalVisibleRevenue / totalRev) * 100).toFixed(1) : '0.0'}%`)

  console.log(`\n  === FOUR-WAY COMPARISON ===`)
  console.log(`                    Music     OF      Twitch   YouTube`)
  console.log(`    Avg Score:      42.8      33.4    26.2     ${(totS / n).toFixed(1)}`)
  console.log(`    Avg Conviction:  2.7       0.3     0.6     ${(totC / n).toFixed(1)}`)
  console.log(`    SUPERFAN:       1.8%      0.8%    0.0%     ${((tiers.SUPERFAN / n) * 100).toFixed(1)}%`)
  console.log(`    Rev Visible:    ~80%      0.5%    1.7%     ${totalRev > 0 ? ((totalVisibleRevenue / totalRev) * 100).toFixed(1) : '0.0'}%`)

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
