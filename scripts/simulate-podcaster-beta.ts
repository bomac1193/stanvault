/**
 * Simulate a 200-user beta test with Podcasters as the hypothetical ICP.
 *
 * Run: npx tsx scripts/simulate-podcaster-beta.ts
 *
 * Tests whether podcasters/listeners map to StanVault's scoring system.
 * Uses the REAL calculateStanScore() engine.
 *
 * Creator segments (80 podcasters):
 *   - Top podcasters (100K+ downloads/ep, Patreon, merch, ad deals): 10
 *   - Mid-tier podcasters (10K-50K downloads, some Patreon): 20
 *   - Small/indie podcasters (1K-10K downloads, growing): 15
 *   - Music podcasters (interview artists, review albums, on Spotify): 10
 *   - Video podcasters (YouTube-first, clips on social): 10
 *   - Newsletter podcasters (Substack + podcast, email-heavy): 10
 *   - Esports/competitive reuse slot: 5 (removed, redistributed above)
 *
 * Fan segments (120 listeners):
 *   - Patreon supporters ($5-25/mo, bonus episodes): 20
 *   - Regular listeners (subscribe on Spotify/Apple, listen weekly): 30
 *   - Social-engaged fans (follow on Twitter/IG, comment, share clips): 25
 *   - Newsletter subscribers (open emails, click links): 15
 *   - YouTube viewers (watch video podcast, subscribe): 15
 *   - Casual/cold (heard one episode from a link): 15
 *
 * Hypothesis: Better revenue visibility than OF/Twitch (~15-25%) because
 * Patreon/Ko-fi/Merch IS visible. Music podcasters are the exception
 * (music ecosystem adjacent). Newsletter podcasters also score well
 * because email signals fire in StanVault.
 *
 * Invisible revenue: Apple Podcasts subs, ad revenue (CPM), Spotify podcast
 * revenue (not exposed same way), live show ticket sales.
 */

import { PrismaClient, Platform, FanTier, EventType } from '@prisma/client'
import { subDays } from 'date-fns'

const prisma = new PrismaClient()

const BETA_START = subDays(new Date(), 90)
const NOW = new Date()

const PODCASTER_CITIES = [
  'Los Angeles', 'New York', 'Chicago', 'Austin', 'Nashville',
  'London', 'Toronto', 'Berlin', 'Portland', 'Brooklyn',
  'San Francisco', 'Atlanta', 'Seattle', 'Denver', 'Miami',
]

const PODCAST_GENRES = [
  'True Crime', 'Comedy', 'Business', 'Tech', 'Culture',
  'Music Interviews', 'Politics', 'Health & Wellness', 'Storytelling', 'Education',
  'Sports', 'History', 'Science', 'Pop Culture', 'Self-Help',
]

const EMAIL_SUFFIX = '@podcast-beta.stanvault.test'

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
// Podcaster (Creator) Generation
// ============================================

interface SimPodcaster {
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
  onSpotify: boolean
}

function generatePodcasters(): SimPodcaster[] {
  const podcasters: SimPodcaster[] = []
  let idx = 0

  const make = (
    cohort: string, tier: string, channel: string, wave: number, retentionRate: number,
    config: {
      genres: string[]; cities: string[]; fanRange: [number, number]
      hasDasham: boolean; hasBandcamp: boolean; hasKofi: boolean; hasPatreon: boolean
      hasMerch: boolean; hasYoutube: boolean; makesMusic: boolean; onSpotify: boolean
    }
  ): SimPodcaster => {
    idx++
    const waveOffset = (wave - 1) * 14
    const joinDate = randomDate(subDays(BETA_START, -waveOffset), subDays(BETA_START, -(waveOffset + 13)))
    return {
      name: `Podcaster ${idx}`,
      email: `podcast.creator${idx}${EMAIL_SUFFIX}`,
      artistName: `${pick(['The', '', 'Daily', 'Weekly', 'Deep'])} ${pick(['Dive', 'Talk', 'Hour', 'Show', 'Cast', 'Pod', 'Session', 'Corner', 'Room', 'Mic'])} ${pick(['with', 'by', 'ft.', '&', '|'])} ${pick(['Alex', 'Jordan', 'Sam', 'Morgan', 'Riley', 'Casey', 'Quinn', 'Avery', 'Taylor', 'Drew'])}${idx}`,
      genre: pick(config.genres),
      location: pick(config.cities),
      betaCohort: cohort, pricingTier: tier, acquisitionChannel: channel,
      retained: chance(retentionRate), joinDate, wave,
      fanCount: rand(...config.fanRange),
      hasDasham: config.hasDasham, hasBandcamp: config.hasBandcamp,
      hasKofi: config.hasKofi, hasPatreon: config.hasPatreon,
      hasMerch: config.hasMerch, hasYoutube: config.hasYoutube,
      makesMusic: config.makesMusic, onSpotify: config.onSpotify,
    }
  }

  // Top podcasters — 10
  // 100K+ downloads per episode. Patreon, merch, ad deals (CPM).
  // Already have Chartable, Spotify for Podcasters, Apple Podcasts analytics.
  // Retention: ~20% — they have better analytics tools already
  for (let i = 0; i < 10; i++) {
    podcasters.push(make('CORE_AFROBEATS', 'STARTER', 'COLD_SIGNUP', 1, 20, {
      genres: ['True Crime', 'Comedy', 'Business', 'Culture', 'Politics'],
      cities: PODCASTER_CITIES, fanRange: [10, 30],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(10), // Top pods rarely use Ko-fi
      hasPatreon: chance(70), // Most top podcasters have Patreon
      hasMerch: chance(65), // Mugs, shirts, stickers
      hasYoutube: chance(60), // Many top pods also on YouTube
      makesMusic: false,
      onSpotify: true, // All top podcasters are on Spotify
    }))
  }

  // Mid-tier podcasters — 20
  // 10K-50K downloads, some Patreon, growing audience
  // More cross-platform, might see value in understanding superfans
  // Retention: ~25% — higher than top because they're still growth-hungry
  for (let i = 0; i < 20; i++) {
    podcasters.push(make('DIRECT_TO_FAN_INDIE', 'STARTER', 'COLD_SIGNUP', 1, 25, {
      genres: PODCAST_GENRES,
      cities: PODCASTER_CITIES, fanRange: [6, 18],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(20), // Some use Ko-fi for one-off support
      hasPatreon: chance(45), // About half have Patreon
      hasMerch: chance(30), // Less common at this tier
      hasYoutube: chance(50),
      makesMusic: false,
      onSpotify: chance(90), // Most are on Spotify
    }))
  }

  // Small/indie podcasters — 15
  // 1K-10K downloads, growing, looking for any edge
  // Retention: ~22% — hungry for insight but signals are thin
  for (let i = 0; i < 15; i++) {
    podcasters.push(make('EXPERIMENTAL_NICHE', 'STARTER', 'COLD_SIGNUP', 2, 22, {
      genres: PODCAST_GENRES,
      cities: PODCASTER_CITIES, fanRange: [3, 10],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(25), // Indie podcasters love Ko-fi
      hasPatreon: chance(20), // Some early Patreon
      hasMerch: chance(10), // Rare at this level
      hasYoutube: chance(30),
      makesMusic: false,
      onSpotify: chance(80),
    }))
  }

  // Music podcasters — 10
  // THE EXCEPTION: Interview artists, review albums, playlist-adjacent.
  // On Spotify as both podcast AND music curators. Music ecosystem adjacent.
  // Retention: ~50% — scoring actually works because music signals fire
  for (let i = 0; i < 10; i++) {
    podcasters.push(make('DIASPORA', 'STARTER', 'MUSIC_TWITTER', 2, 50, {
      genres: ['Music Interviews', 'Culture', 'Pop Culture'],
      cities: ['Los Angeles', 'London', 'New York', 'Atlanta', 'Nashville', 'Berlin'],
      fanRange: [8, 25],
      hasDasham: false,
      hasBandcamp: chance(30), // Some sell curated playlists/zines
      hasKofi: chance(35),
      hasPatreon: chance(55), // Many have Patreon for bonus interviews
      hasMerch: chance(40),
      hasYoutube: chance(70), // Video interviews
      makesMusic: true, // Key: they're in the music ecosystem
      onSpotify: true, // Always on Spotify
    }))
  }

  // Video podcasters — 10
  // YouTube-first, clips on TikTok/IG Reels. Video is primary format.
  // Retention: ~18% — YouTube engagement fires but podcast signals don't
  for (let i = 0; i < 10; i++) {
    podcasters.push(make('INDIE_HIPHOP_RNB', 'STARTER', 'COLD_SIGNUP', 3, 18, {
      genres: PODCAST_GENRES,
      cities: PODCASTER_CITIES, fanRange: [5, 15],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(15),
      hasPatreon: chance(25),
      hasMerch: chance(25),
      hasYoutube: true, // Always have YouTube — that's their primary
      makesMusic: false,
      onSpotify: chance(75), // Most also distribute audio to Spotify
    }))
  }

  // Newsletter podcasters — 10
  // Substack + podcast combo. Email is their core medium.
  // Retention: ~30% — email signals fire well in StanVault
  for (let i = 0; i < 10; i++) {
    podcasters.push(make('MANAGER', 'STARTER', 'COLD_SIGNUP', 2, 30, {
      genres: ['Business', 'Tech', 'Culture', 'Politics', 'Education'],
      cities: PODCASTER_CITIES, fanRange: [6, 20],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(20),
      hasPatreon: chance(40), // Substack paid subs substitute for some
      hasMerch: chance(15),
      hasYoutube: chance(35),
      makesMusic: false,
      onSpotify: chance(85),
    }))
  }

  // Note: 5 fewer than Twitch's 80 (no esports slot). Total = 75.
  // Adding 5 more to mid-tier to hit 80.
  for (let i = 0; i < 5; i++) {
    podcasters.push(make('PRODUCER_DJ', 'STARTER', 'COLD_SIGNUP', 3, 22, {
      genres: PODCAST_GENRES,
      cities: PODCASTER_CITIES, fanRange: [4, 12],
      hasDasham: false, hasBandcamp: false,
      hasKofi: chance(20),
      hasPatreon: chance(30),
      hasMerch: chance(15),
      hasYoutube: chance(40),
      makesMusic: false,
      onSpotify: chance(80),
    }))
  }

  return podcasters
}

// ============================================
// Podcast Fan/Listener Generation
// ============================================

interface SimPodcastFan {
  displayName: string
  email: string
  city: string
  betaCohort: string
  retained: boolean
  joinDate: Date
  // Spotify (podcast listens counted as "streams")
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
  // Podcast-specific (INVISIBLE to StanVault)
  podcastDownloadsPerEp: number
  applePodcastSub: boolean // Apple Podcasts paid subscription
  hasSpotifyVerified: boolean
  artistCount: number
}

function generatePodcastFan(
  podcaster: SimPodcaster, fanIdx: number, fanCohort: string, retentionRate: number
): SimPodcastFan {
  const isPatreonSupporter = fanCohort === 'DEEP_AFRICAN'
  const isRegularListener = fanCohort === 'DIASPORA_SUPERFAN'
  const isSocialEngaged = fanCohort === 'BANDCAMP_KOFI_SUPPORTER'
  const isNewsletterSub = fanCohort === 'STREET_TEAM_LEADER'
  const isYoutubeViewer = fanCohort === 'CASUAL_CURIOUS'
  const isCasualCold = fanCohort === 'COLD_SIGNUP'

  const retained = chance(retentionRate)
  const joinDate = randomDate(podcaster.joinDate, subDays(NOW, 30))

  // Podcast-specific (INVISIBLE)
  let podcastDownloadsPerEp = 0
  let applePodcastSub = false

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

  if (isPatreonSupporter) {
    // PATREON SUPPORTER: $5-25/mo, bonus episodes, loyal listener
    // Patreon is BIG for podcasters — this is their main direct revenue
    podcastDownloadsPerEp = rand(800, 5000) // Dedicated listeners
    applePodcastSub = chance(30) // Some also pay on Apple
    // Patreon (VISIBLE to StanVault)
    hasPatreonSub = true
    patreonMonths = rand(1, 24) // 1 month to 2 years of support
    // Spotify podcast listens (VISIBLE if podcaster is on Spotify)
    if (podcaster.onSpotify) streams = rand(30, 200) // Regular listener on Spotify
    // Cross-platform visible signals — Patreon supporters are invested
    twitterFollows = chance(70)
    twitterLikes = rand(5, 25)
    twitterComments = rand(2, 10)
    instagramFollows = chance(45)
    instagramLikes = rand(3, 12)
    instagramComments = rand(0, 5)
    youtubeSubscribed = podcaster.hasYoutube ? chance(60) : false
    youtubeViews = youtubeSubscribed ? rand(10, 60) : 0
    hasKofiPurchase = podcaster.hasKofi ? chance(25) : false
    if (hasKofiPurchase) kofiAmountUsd = rand(5, 25)
    hasMerchPurchase = podcaster.hasMerch ? chance(35) : false
    if (hasMerchPurchase) merchAmountUsd = rand(15, 60)
    emailOpens = rand(5, 20) // Patreon fans read emails
    emailClicks = rand(2, 8)
  } else if (isRegularListener) {
    // REGULAR LISTENER: Subscribe on Spotify/Apple, listen weekly, low interaction
    podcastDownloadsPerEp = rand(200, 2000)
    applePodcastSub = chance(15)
    // Spotify listens (VISIBLE)
    if (podcaster.onSpotify) streams = rand(10, 80)
    // Social — follows but doesn't engage much
    twitterFollows = chance(40)
    twitterLikes = rand(1, 8)
    instagramFollows = chance(25)
    instagramLikes = rand(0, 5)
    youtubeSubscribed = podcaster.hasYoutube ? chance(35) : false
    youtubeViews = youtubeSubscribed ? rand(3, 20) : 0
    hasPatreonSub = podcaster.hasPatreon ? chance(8) : false
    if (hasPatreonSub) patreonMonths = rand(1, 6)
    emailOpens = chance(40) ? rand(1, 5) : 0
    emailClicks = emailOpens > 0 ? rand(0, 2) : 0
  } else if (isSocialEngaged) {
    // SOCIAL-ENGAGED FAN: Follow on Twitter/IG, comment, share clips
    // They amplify the podcast but don't always listen consistently
    podcastDownloadsPerEp = rand(100, 800)
    applePodcastSub = false
    if (podcaster.onSpotify) streams = rand(5, 50)
    // Strong social (VISIBLE to StanVault)
    twitterFollows = true
    twitterLikes = rand(8, 30)
    twitterComments = rand(3, 12)
    instagramFollows = chance(65)
    instagramLikes = rand(5, 20)
    instagramComments = rand(1, 8)
    youtubeSubscribed = podcaster.hasYoutube ? chance(45) : false
    youtubeViews = youtubeSubscribed ? rand(5, 30) : 0
    hasKofiPurchase = podcaster.hasKofi ? chance(15) : false
    if (hasKofiPurchase) kofiAmountUsd = rand(3, 15)
    hasMerchPurchase = podcaster.hasMerch ? chance(20) : false
    if (hasMerchPurchase) merchAmountUsd = rand(10, 40)
    emailOpens = chance(30) ? rand(1, 4) : 0
    emailClicks = emailOpens > 0 ? rand(0, 2) : 0
  } else if (isNewsletterSub) {
    // NEWSLETTER SUBSCRIBER: Open emails, click show notes links
    // Email engagement is HIGH — many podcast fans are email-first
    podcastDownloadsPerEp = rand(300, 1500)
    applePodcastSub = chance(10)
    if (podcaster.onSpotify) streams = rand(15, 100)
    // Email (VISIBLE — and this is where podcast fans shine in StanVault)
    emailOpens = rand(8, 30) // High open rates for podcast newsletters
    emailClicks = rand(3, 12) // Click show notes, episode links
    // Some social too
    twitterFollows = chance(55)
    twitterLikes = rand(2, 10)
    twitterComments = rand(0, 5)
    instagramFollows = chance(30)
    instagramLikes = rand(1, 6)
    youtubeSubscribed = podcaster.hasYoutube ? chance(30) : false
    youtubeViews = youtubeSubscribed ? rand(3, 15) : 0
    hasPatreonSub = podcaster.hasPatreon ? chance(12) : false
    if (hasPatreonSub) patreonMonths = rand(1, 8)
    hasKofiPurchase = podcaster.hasKofi ? chance(10) : false
    if (hasKofiPurchase) kofiAmountUsd = rand(3, 10)
  } else if (isYoutubeViewer) {
    // YOUTUBE VIEWER: Watch video podcast, subscribe on YouTube
    // YouTube engagement IS visible to StanVault
    podcastDownloadsPerEp = rand(50, 500) // Light audio listener
    applePodcastSub = false
    if (podcaster.onSpotify) streams = rand(3, 30)
    // Strong YouTube (VISIBLE)
    youtubeSubscribed = true
    youtubeViews = rand(15, 80) // Heavy video watcher
    twitterFollows = chance(45)
    twitterLikes = rand(2, 10)
    instagramFollows = chance(35)
    instagramLikes = rand(1, 8)
    emailOpens = chance(20) ? rand(1, 3) : 0
    emailClicks = emailOpens > 0 ? rand(0, 1) : 0
  } else if (isCasualCold) {
    // CASUAL/COLD: Heard one episode from a link, barely engaged
    podcastDownloadsPerEp = rand(1, 50)
    applePodcastSub = false
    if (podcaster.onSpotify) streams = chance(30) ? rand(1, 10) : 0
    twitterFollows = chance(10)
    instagramFollows = chance(8)
    youtubeSubscribed = chance(5)
  }

  return {
    displayName: `Podcast Fan ${fanCohort.slice(0, 4)}-${fanIdx}`,
    email: `podcast.fan.${fanCohort.toLowerCase().replace(/_/g, '')}.${fanIdx}${EMAIL_SUFFIX}`,
    city: pick(PODCASTER_CITIES),
    betaCohort: fanCohort,
    retained, joinDate, streams,
    hasKofiPurchase, hasPatreonSub, hasMerchPurchase,
    kofiAmountUsd, patreonMonths, merchAmountUsd,
    instagramFollows, instagramLikes, instagramComments,
    twitterFollows, twitterLikes, twitterComments,
    youtubeSubscribed, youtubeViews,
    emailOpens, emailClicks,
    podcastDownloadsPerEp, applePodcastSub,
    hasSpotifyVerified: podcaster.onSpotify ? chance(40) : chance(5),
    artistCount: isPatreonSupporter ? rand(2, 5) : isNewsletterSub ? rand(1, 3) : 1,
  }
}

// ============================================
// Database Operations
// ============================================

async function createSimPodcaster(s: SimPodcaster): Promise<string> {
  const user = await prisma.user.create({
    data: {
      email: s.email, name: s.name, artistName: s.artistName,
      genre: s.genre, location: s.location,
      pricingTier: s.pricingTier as any,
      betaCohort: s.betaCohort as any,
      acquisitionChannel: s.acquisitionChannel as any,
      betaInviteCode: `SIM-PD-${s.betaCohort.slice(0, 4)}-${Date.now()}`,
      betaJoinedAt: s.joinDate, onboardingCompleted: true,
      createdAt: s.joinDate,
      updatedAt: s.retained ? randomDate(subDays(NOW, 7), NOW) : randomDate(subDays(NOW, 90), subDays(NOW, 35)),
    },
  })
  return user.id
}

async function createSimPodcastFanRecord(
  podcasterId: string, podcasterCity: string, fan: SimPodcastFan, podcaster: SimPodcaster
): Promise<void> {
  const lastActive = fan.retained
    ? randomDate(subDays(NOW, 14), NOW)
    : randomDate(subDays(NOW, 90), subDays(NOW, 40))

  const fanRecord = await prisma.fan.create({
    data: {
      userId: podcasterId, displayName: fan.displayName,
      email: fan.email, city: fan.city,
      stanScore: 0, tier: 'CASUAL',
      firstSeenAt: fan.joinDate, lastActiveAt: lastActive, createdAt: fan.joinDate,
    },
  })

  // Platform links — what StanVault CAN see
  // Note: No PODCAST platform enum. Podcast downloads are invisible.
  // But Spotify podcast listens DO count as "streams" on Spotify.

  // Spotify (podcast listens as streams — only if podcaster is on Spotify)
  if (fan.streams > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.SPOTIFY,
        streams: fan.streams, playlistAdds: rand(0, Math.floor(fan.streams / 40)),
        saves: rand(0, Math.floor(fan.streams / 25)), follows: chance(30),
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

  // Twitter (podcasters are very Twitter-active — clips, threads, episode promos)
  if (fan.twitterFollows || fan.twitterLikes > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.TWITTER,
        follows: fan.twitterFollows, likes: fan.twitterLikes,
        comments: fan.twitterComments, shares: rand(0, 4),
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // YouTube — video podcasters have strong YouTube signals
  if (fan.youtubeSubscribed || fan.youtubeViews > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.YOUTUBE,
        subscribed: fan.youtubeSubscribed, videoViews: fan.youtubeViews,
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // Email — this is where podcast fans diverge from Twitch/OF fans
  // Podcast listeners have HIGH email engagement (show notes, newsletters)
  if (fan.emailOpens > 0) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.EMAIL,
        emailOpens: fan.emailOpens, emailClicks: fan.emailClicks,
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // Ko-fi (used by some indie podcasters)
  if (fan.hasKofiPurchase) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.KOFI,
        purchaseCount: rand(1, 3), purchaseAmountUsd: fan.kofiAmountUsd,
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // Patreon — THE big one for podcasters. More common than OF or Twitch subs.
  if (fan.hasPatreonSub) {
    await prisma.fanPlatformLink.create({
      data: {
        fanId: fanRecord.id, platform: Platform.PATREON,
        subscriptionMonths: fan.patreonMonths,
        purchaseCount: fan.patreonMonths,
        purchaseAmountUsd: fan.patreonMonths * rand(5, 25), // $5-25/mo tiers
        firstSeenAt: fan.joinDate, lastActiveAt: lastActive,
      },
    })
  }

  // Merch (mugs, shirts, stickers for bigger podcasters)
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
    firstSeenAt: fan.joinDate, lastActiveAt: lastActive, artistCity: podcasterCity,
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

  // Log invisible podcast revenue
  // Apple Podcasts sub ~$4.99/mo, ad revenue ~$20-50 CPM (fans don't pay),
  // Spotify podcast revenue (not exposed), live show tickets $15-50
  const appleSubSpend = fan.applePodcastSub ? rand(3, 12) * 4.99 : 0 // 3-12 months
  const estimatedAdValue = fan.podcastDownloadsPerEp * 0.025 // ~$25 CPM, per ep over time
  const invisibleSpend = appleSubSpend + estimatedAdValue

  if (invisibleSpend > 0 || fan.podcastDownloadsPerEp > 0) {
    await prisma.fanEvent.create({
      data: {
        fanId: fanRecord.id, eventType: EventType.FIRST_STREAM,
        platform: Platform.TWITTER,
        description: `[INVISIBLE] Podcast: ${fan.podcastDownloadsPerEp} downloads/ep, Apple sub: ${fan.applePodcastSub ? 'YES' : 'NO'}, Ad value: ~$${estimatedAdValue.toFixed(2)}, Apple spend: $${appleSubSpend.toFixed(2)}. Stan Score: ${scoreResult.totalScore} (${scoreResult.tier})`,
        occurredAt: fan.joinDate,
      },
    })
  }
}

async function createSimPodcastFanUser(fan: SimPodcastFan): Promise<string> {
  const fanUser = await prisma.fanUser.create({
    data: {
      email: fan.email, displayName: fan.displayName,
      betaCohort: fan.betaCohort as any, acquisitionChannel: 'COLD_SIGNUP' as any,
      betaInviteCode: `SIM-PD-FAN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      betaJoinedAt: fan.joinDate, onboardingCompleted: fan.hasSpotifyVerified,
      spotifyUserId: fan.hasSpotifyVerified ? `spotify_pd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : null,
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
  console.log('=== StanVault Podcaster ICP Stress Test ===\n')
  console.log('Testing hypothesis: Podcasters have BETTER revenue visibility than OF/Twitch')
  console.log('because Patreon/Ko-fi/Merch IS visible. Music podcasters are the exception.')
  console.log('Newsletter podcasters score well because email signals fire.\n')

  // Cleanup
  const existing = await prisma.user.count({ where: { email: { endsWith: EMAIL_SUFFIX } } })
  if (existing > 0) {
    console.log(`Cleaning up ${existing} existing Podcast simulation users...`)
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

  const podcasters = generatePodcasters()
  console.log(`Generating ${podcasters.length} podcasters...\n`)

  const podcasterRecords: Array<{ id: string; podcaster: SimPodcaster }> = []
  const segLabels: Record<string, string> = {
    'CORE_AFROBEATS': 'Top Podcasters',
    'DIRECT_TO_FAN_INDIE': 'Mid-Tier Podcasters',
    'EXPERIMENTAL_NICHE': 'Small/Indie Podcasters',
    'DIASPORA': 'Music Podcasters',
    'INDIE_HIPHOP_RNB': 'Video Podcasters',
    'MANAGER': 'Newsletter Podcasters',
    'PRODUCER_DJ': 'Mid-Tier (Extra)',
  }
  const cohortStats: Record<string, { total: number; retained: number }> = {}

  for (const s of podcasters) {
    const id = await createSimPodcaster(s)
    podcasterRecords.push({ id, podcaster: s })
    if (!cohortStats[s.betaCohort]) cohortStats[s.betaCohort] = { total: 0, retained: 0 }
    cohortStats[s.betaCohort].total++
    if (s.retained) cohortStats[s.betaCohort].retained++
  }

  console.log('Podcaster cohort breakdown:')
  for (const [cohort, stats] of Object.entries(cohortStats)) {
    const rate = stats.total ? Math.round((stats.retained / stats.total) * 100) : 0
    console.log(`  ${(segLabels[cohort] || cohort).padEnd(24)}: ${stats.total} total, ${stats.retained} retained (${rate}%)`)
  }

  // Fans
  console.log('\nGenerating podcast listeners and platform data...\n')

  const fanAlloc = [
    { cohort: 'DEEP_AFRICAN', count: 20, retentionRate: 25, label: 'Patreon Supporters' },
    { cohort: 'DIASPORA_SUPERFAN', count: 30, retentionRate: 12, label: 'Regular Listeners' },
    { cohort: 'BANDCAMP_KOFI_SUPPORTER', count: 25, retentionRate: 15, label: 'Social-Engaged Fans' },
    { cohort: 'STREET_TEAM_LEADER', count: 15, retentionRate: 20, label: 'Newsletter Subscribers' },
    { cohort: 'CASUAL_CURIOUS', count: 15, retentionRate: 10, label: 'YouTube Viewers' },
    { cohort: 'COLD_SIGNUP', count: 15, retentionRate: 5, label: 'Casual/Cold' },
  ]

  let totalFans = 0
  const fanUserIds: string[] = []
  let totalInvisibleRevenue = 0
  let totalVisibleRevenue = 0
  const fanCohortStats: Record<string, { total: number; retained: number; verified: number; label: string }> = {}

  for (const alloc of fanAlloc) {
    fanCohortStats[alloc.cohort] = { total: 0, retained: 0, verified: 0, label: alloc.label }

    for (let i = 0; i < alloc.count; i++) {
      const target = pick(podcasterRecords)
      const fan = generatePodcastFan(target.podcaster, i + 1, alloc.cohort, alloc.retentionRate)

      await createSimPodcastFanRecord(target.id, target.podcaster.location, fan, target.podcaster)
      totalFans++

      // Revenue tracking
      // Invisible: Apple Podcasts sub, ad revenue (CPM-based), Spotify podcast rev, live tickets
      const appleSubSpend = fan.applePodcastSub ? rand(3, 12) * 4.99 : 0
      const estimatedAdValue = fan.podcastDownloadsPerEp * 0.025 // ~$25 CPM
      const invisibleSpend = appleSubSpend + estimatedAdValue

      // Visible: Patreon, Ko-fi, Merch (all tracked by StanVault)
      const visibleSpend = fan.kofiAmountUsd + (fan.patreonMonths * 15) + fan.merchAmountUsd
      totalInvisibleRevenue += invisibleSpend
      totalVisibleRevenue += visibleSpend

      const fanUserId = await createSimPodcastFanUser(fan)
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
        const others = podcasterRecords.filter(s => s.id !== target.id)
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

  for (const { id, podcaster } of podcasterRecords) {
    if (!podcaster.retained) continue
    const dropCount = rand(0, 3)
    for (let d = 0; d < dropCount; d++) {
      const drop = await prisma.drop.create({
        data: {
          userId: id,
          slug: `sim-pd-${podcaster.artistName.replace(/\s+/g, '-').toLowerCase()}-${d + 1}-${Date.now()}`,
          title: pick(['Bonus Episode', 'Early Access Episode', 'Behind-the-Scenes', 'Exclusive Interview', 'Merch Discount Code', 'Live Show Presale']),
          contentType: pick(['DOWNLOAD', 'LINK', 'MESSAGE']),
          minTier: pick(['CASUAL', 'ENGAGED', null]) as FanTier | null,
          isActive: true, createdAt: randomDate(podcaster.joinDate, NOW),
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
  console.log('=== Podcast Simulation Complete ===\n')
  console.log(`  Podcasters: ${podcasters.length}`)
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
  console.log(`    Fan spend invisible to StanVault: $${totalInvisibleRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)
  console.log(`    Fan spend visible to StanVault:   $${totalVisibleRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)
  const totalRev = totalInvisibleRevenue + totalVisibleRevenue
  console.log(`    Revenue visibility: ${totalRev > 0 ? ((totalVisibleRevenue / totalRev) * 100).toFixed(1) : '0.0'}%`)

  console.log(`\n  === FOUR-WAY COMPARISON ===`)
  console.log(`                    Music     OF      Twitch   Podcast`)
  console.log(`    Avg Score:      42.8      33.4    26.2     ${(totScore / n).toFixed(1)}`)
  console.log(`    Avg Conviction:  2.7       0.3     0.2     ${(totConv / n).toFixed(1)}`)
  console.log(`    SUPERFAN:       1.8%      0.8%    0.5%     ${((tiers.SUPERFAN / n) * 100).toFixed(1)}%`)
  console.log(`    Rev Visible:    ~80%      0.5%    3.2%     ${totalRev > 0 ? ((totalVisibleRevenue / totalRev) * 100).toFixed(1) : '0.0'}%`)

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
