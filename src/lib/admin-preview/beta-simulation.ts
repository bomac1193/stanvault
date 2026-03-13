type PersonaKind = 'ICP' | 'NON_CUSTOMER' | 'HATER'
type Region = 'Africa' | 'Asia' | 'Europe' | 'America'
type FitBand = 'Core now' | 'Expand next' | 'Selective' | 'Not now'

const BASE_DATE = new Date('2026-03-13T12:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000

interface PersonaInput {
  id: string
  displayName: string
  location: string
  region: Region
  market: string
  kind: PersonaKind
  fitScore: number
  channels: string[]
  thesis: string
  blindspot?: string
}

export interface SimulationPersona {
  id: string
  displayName: string
  email: string
  location: string
  region: Region
  market: string
  kind: PersonaKind
  fitScore: number
  tier: 'CASUAL' | 'ENGAGED' | 'DEDICATED' | 'SUPERFAN'
  fitBand: FitBand
  firstSeenAt: string
  lastActiveAt: string
  platformLinks: Array<{ platform: string }>
  thesis: string
  blindspot?: string
}

export interface SimulationSummary {
  totalParticipants: number
  icpCount: number
  nonCustomerCount: number
  haterCount: number
  coreAudienceCount: number
  expansionCount: number
  thesis: string
  recommendedRollout: string[]
  regionBreakdown: Array<{
    region: Region
    icpCount: number
    avgFit: number
    coreCount: number
    verdict: FitBand
  }>
  apiPriorities: {
    connect: string[]
    reach: string[]
    rails: string[]
  }
  blindspots: string[]
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '')
}

function isoDaysAgo(days: number) {
  return new Date(BASE_DATE.getTime() - days * DAY_MS).toISOString()
}

function tierForFitScore(fitScore: number): SimulationPersona['tier'] {
  if (fitScore >= 85) return 'SUPERFAN'
  if (fitScore >= 70) return 'DEDICATED'
  if (fitScore >= 45) return 'ENGAGED'
  return 'CASUAL'
}

function fitBandForScore(fitScore: number): FitBand {
  if (fitScore >= 82) return 'Core now'
  if (fitScore >= 70) return 'Expand next'
  if (fitScore >= 55) return 'Selective'
  return 'Not now'
}

function createPersona(input: PersonaInput, index: number): SimulationPersona {
  const firstSeenDays =
    input.kind === 'ICP'
      ? input.fitScore >= 85
        ? 84 + index * 2
        : 18 + index
      : input.kind === 'NON_CUSTOMER'
        ? 12 + index
        : 8 + index

  const lastActiveDays =
    input.kind === 'ICP'
      ? Math.max(1, 18 - Math.round(input.fitScore / 7) + (index % 4))
      : input.kind === 'NON_CUSTOMER'
        ? 9 + (index % 10)
        : 18 + (index % 14)

  return {
    id: input.id,
    displayName: input.displayName,
    email: `${slugify(input.displayName)}@imprint-preview.local`,
    location: `${input.location} · ${input.market}`,
    region: input.region,
    market: input.market,
    kind: input.kind,
    fitScore: input.fitScore,
    tier: tierForFitScore(input.fitScore),
    fitBand: fitBandForScore(input.fitScore),
    firstSeenAt: isoDaysAgo(firstSeenDays),
    lastActiveAt: isoDaysAgo(lastActiveDays),
    platformLinks: input.channels.map((platform) => ({ platform })),
    thesis: input.thesis,
    blindspot: input.blindspot,
  }
}

const PERSONA_INPUTS: PersonaInput[] = [
  {
    id: 'icp-af-01',
    displayName: 'Lagos Afrohouse Collective',
    location: 'Lagos, Nigeria',
    region: 'Africa',
    market: 'Afrohouse collective',
    kind: 'ICP',
    fitScore: 94,
    channels: ['YOUTUBE', 'SPOTIFY', 'EMAIL', 'WHATSAPP', 'ORYX'],
    thesis: 'Already owns community attention through WhatsApp and live moments.',
    blindspot: 'Needs SMS fallback for campaign reminders.',
  },
  {
    id: 'icp-af-02',
    displayName: 'Johannesburg Amapiano Crew',
    location: 'Johannesburg, South Africa',
    region: 'Africa',
    market: 'Amapiano live crew',
    kind: 'ICP',
    fitScore: 92,
    channels: ['YOUTUBE', 'SPOTIFY', 'WHATSAPP', 'SMS', 'ORYX'],
    thesis: 'High fit because direct fan messaging and conviction already exist.',
  },
  {
    id: 'icp-af-03',
    displayName: 'Accra Afro-Fusion Manager',
    location: 'Accra, Ghana',
    region: 'Africa',
    market: 'Manager with active roster',
    kind: 'ICP',
    fitScore: 90,
    channels: ['SPOTIFY', 'YOUTUBE', 'EMAIL', 'WHATSAPP', 'ORYX'],
    thesis: 'Multi-artist workflow makes audience ownership immediately valuable.',
  },
  {
    id: 'icp-af-04',
    displayName: 'Nairobi Club Circuit DJ Producer',
    location: 'Nairobi, Kenya',
    region: 'Africa',
    market: 'DJ producer with club reach',
    kind: 'ICP',
    fitScore: 88,
    channels: ['YOUTUBE', 'SPOTIFY', 'SMS', 'EMAIL', 'ORYX'],
    thesis: 'Phone-first campaigns and payment proof make this a strong beachhead.',
  },
  {
    id: 'icp-af-05',
    displayName: 'Kampala Afro-Pop Artist Circle',
    location: 'Kampala, Uganda',
    region: 'Africa',
    market: 'Artist collective',
    kind: 'ICP',
    fitScore: 86,
    channels: ['YOUTUBE', 'EMAIL', 'WHATSAPP', 'SMS', 'ORYX'],
    thesis: 'Best fit when drops and messages route through direct channels.',
  },
  {
    id: 'icp-af-06',
    displayName: 'Dar Singeli Label Pod',
    location: 'Dar es Salaam, Tanzania',
    region: 'Africa',
    market: 'Fast-growth label pod',
    kind: 'ICP',
    fitScore: 84,
    channels: ['YOUTUBE', 'EMAIL', 'WHATSAPP', 'SPOTIFY'],
    thesis: 'Fits if direct list capture beats dependence on platform algorithms.',
    blindspot: 'Needs a non-Spotify story for local discovery.',
  },
  {
    id: 'icp-af-07',
    displayName: 'Kigali Afro-Electronic Promoter',
    location: 'Kigali, Rwanda',
    region: 'Africa',
    market: 'Promoter label hybrid',
    kind: 'ICP',
    fitScore: 82,
    channels: ['YOUTUBE', 'EMAIL', 'DISCORD', 'WHATSAPP'],
    thesis: 'Good expansion fit once community and CRM workflows are unified.',
  },
  {
    id: 'icp-af-08',
    displayName: 'Lagos Gospel Alt Manager',
    location: 'Lagos, Nigeria',
    region: 'Africa',
    market: 'Manager with direct church and diaspora list',
    kind: 'ICP',
    fitScore: 89,
    channels: ['YOUTUBE', 'EMAIL', 'WHATSAPP', 'SMS', 'ORYX'],
    thesis: 'Strong ownership fit because fan touchpoints already exist off-platform.',
  },
  {
    id: 'icp-af-09',
    displayName: 'Joburg Afrohouse Residency Team',
    location: 'Johannesburg, South Africa',
    region: 'Africa',
    market: 'Residency team',
    kind: 'ICP',
    fitScore: 91,
    channels: ['YOUTUBE', 'SPOTIFY', 'WHATSAPP', 'SMS', 'ORYX'],
    thesis: 'High-fit operator because live conviction can flow into campaigns fast.',
  },
  {
    id: 'icp-af-10',
    displayName: 'Accra Amapiano Export Manager',
    location: 'Accra, Ghana',
    region: 'Africa',
    market: 'Export-focused manager',
    kind: 'ICP',
    fitScore: 87,
    channels: ['SPOTIFY', 'YOUTUBE', 'EMAIL', 'WHATSAPP', 'ORYX'],
    thesis: 'Oryx plus owned messaging unlocks cross-market fan tracking.',
  },
  {
    id: 'icp-af-11',
    displayName: 'Nairobi Afrohouse Community Radio DJ',
    location: 'Nairobi, Kenya',
    region: 'Africa',
    market: 'Community DJ and curator',
    kind: 'ICP',
    fitScore: 80,
    channels: ['YOUTUBE', 'EMAIL', 'WHATSAPP', 'DISCORD'],
    thesis: 'Useful expansion fit when community and release campaigns are combined.',
  },
  {
    id: 'icp-af-12',
    displayName: 'Abuja Emerging Artist Collective',
    location: 'Abuja, Nigeria',
    region: 'Africa',
    market: 'Emerging collective',
    kind: 'ICP',
    fitScore: 83,
    channels: ['YOUTUBE', 'EMAIL', 'WHATSAPP', 'SMS'],
    thesis: 'Promising because phone-first fan capture can outpace algorithm spend.',
  },
  {
    id: 'icp-eu-01',
    displayName: 'London Diaspora Afrobeats Manager',
    location: 'London, United Kingdom',
    region: 'Europe',
    market: 'Diaspora artist manager',
    kind: 'ICP',
    fitScore: 84,
    channels: ['SPOTIFY', 'YOUTUBE', 'EMAIL', 'WHATSAPP', 'DISCORD'],
    thesis: 'Best European fit because diaspora managers already own some direct reach.',
  },
  {
    id: 'icp-eu-02',
    displayName: 'Paris Afrohouse Promoter DJ',
    location: 'Paris, France',
    region: 'Europe',
    market: 'Promoter DJ hybrid',
    kind: 'ICP',
    fitScore: 80,
    channels: ['YOUTUBE', 'EMAIL', 'DISCORD', 'INSTAGRAM'],
    thesis: 'Expansion fit if community journeys beat one-off event promotion.',
  },
  {
    id: 'icp-eu-03',
    displayName: 'Berlin Afro-Electronic Label',
    location: 'Berlin, Germany',
    region: 'Europe',
    market: 'Label with niche community',
    kind: 'ICP',
    fitScore: 76,
    channels: ['SPOTIFY', 'YOUTUBE', 'EMAIL', 'DISCORD'],
    thesis: 'Works when the product is framed as fan CRM, not analytics alone.',
  },
  {
    id: 'icp-eu-04',
    displayName: 'Amsterdam Diaspora R&B Artist',
    location: 'Amsterdam, Netherlands',
    region: 'Europe',
    market: 'Diaspora artist',
    kind: 'ICP',
    fitScore: 78,
    channels: ['SPOTIFY', 'YOUTUBE', 'EMAIL', 'WHATSAPP'],
    thesis: 'Good expansion fit if owned list growth is clearly measurable.',
  },
  {
    id: 'icp-eu-05',
    displayName: 'Manchester Afro-Fusion Fan Club Lead',
    location: 'Manchester, United Kingdom',
    region: 'Europe',
    market: 'Fan club operator',
    kind: 'ICP',
    fitScore: 79,
    channels: ['YOUTUBE', 'EMAIL', 'DISCORD', 'WHATSAPP'],
    thesis: 'Community operator fit is strong when campaigns feel like membership.',
  },
  {
    id: 'icp-eu-06',
    displayName: 'Lisbon Lusophone Dance Crew',
    location: 'Lisbon, Portugal',
    region: 'Europe',
    market: 'Lusophone dance crew',
    kind: 'ICP',
    fitScore: 77,
    channels: ['YOUTUBE', 'SPOTIFY', 'EMAIL', 'INSTAGRAM'],
    thesis: 'Useful secondary fit around releases, touring, and direct list capture.',
  },
  {
    id: 'icp-eu-07',
    displayName: 'Brussels Diaspora Pop Strategist',
    location: 'Brussels, Belgium',
    region: 'Europe',
    market: 'Strategist for diaspora pop acts',
    kind: 'ICP',
    fitScore: 75,
    channels: ['SPOTIFY', 'EMAIL', 'DISCORD', 'INSTAGRAM'],
    thesis: 'Expansion fit if cross-platform identity is clean and campaign proof exists.',
  },
  {
    id: 'icp-us-01',
    displayName: 'Atlanta Afrobeats Artist Manager',
    location: 'Atlanta, United States',
    region: 'America',
    market: 'Artist-manager hybrid',
    kind: 'ICP',
    fitScore: 82,
    channels: ['SPOTIFY', 'YOUTUBE', 'EMAIL', 'WHATSAPP', 'DISCORD'],
    thesis: 'Best American fit because diaspora artists already need owned outreach.',
  },
  {
    id: 'icp-us-02',
    displayName: 'NYC Afro-R&B Collective',
    location: 'New York, United States',
    region: 'America',
    market: 'Afro-R&B collective',
    kind: 'ICP',
    fitScore: 79,
    channels: ['SPOTIFY', 'YOUTUBE', 'EMAIL', 'DISCORD'],
    thesis: 'Solid expansion fit for list growth, drops, and campaign automation.',
  },
  {
    id: 'icp-us-03',
    displayName: 'Toronto Diaspora Label Pod',
    location: 'Toronto, Canada',
    region: 'America',
    market: 'Diaspora label pod',
    kind: 'ICP',
    fitScore: 80,
    channels: ['SPOTIFY', 'YOUTUBE', 'EMAIL', 'WHATSAPP'],
    thesis: 'Canada fits as part of the diaspora manager expansion lane.',
  },
  {
    id: 'icp-us-04',
    displayName: 'LA Dance Pop Creator House',
    location: 'Los Angeles, United States',
    region: 'America',
    market: 'Creator house',
    kind: 'ICP',
    fitScore: 72,
    channels: ['YOUTUBE', 'DISCORD', 'INSTAGRAM', 'TIKTOK'],
    thesis: 'Selective fit only if direct fan ownership outcompetes pure growth hacking.',
    blindspot: 'Too platform-dependent without email or phone capture.',
  },
  {
    id: 'icp-us-05',
    displayName: 'Houston Gospel Afrobeats Team',
    location: 'Houston, United States',
    region: 'America',
    market: 'Faith-driven music team',
    kind: 'ICP',
    fitScore: 77,
    channels: ['YOUTUBE', 'EMAIL', 'WHATSAPP', 'SMS'],
    thesis: 'Useful expansion fit because trusted community lists already exist.',
  },
  {
    id: 'icp-us-06',
    displayName: 'Miami Amapiano Night Series',
    location: 'Miami, United States',
    region: 'America',
    market: 'Night series operator',
    kind: 'ICP',
    fitScore: 74,
    channels: ['YOUTUBE', 'EMAIL', 'DISCORD', 'INSTAGRAM'],
    thesis: 'Selective expansion fit if event traffic turns into owned fan journeys.',
  },
  {
    id: 'icp-as-01',
    displayName: 'Seoul K-Pop Micro Label',
    location: 'Seoul, South Korea',
    region: 'Asia',
    market: 'K-pop micro label',
    kind: 'ICP',
    fitScore: 73,
    channels: ['YOUTUBE', 'EMAIL', 'DISCORD', 'KAKAO'],
    thesis: 'Interesting but only if fan-club identity and Kakao flows land.',
    blindspot: 'Needs Kakao-native ownership mechanics before scale.',
  },
  {
    id: 'icp-as-02',
    displayName: 'Manila P-Pop Street Team',
    location: 'Manila, Philippines',
    region: 'Asia',
    market: 'Street team operator',
    kind: 'ICP',
    fitScore: 71,
    channels: ['YOUTUBE', 'EMAIL', 'DISCORD', 'SMS'],
    thesis: 'Selective fit where fan clubs already behave like volunteer CRM teams.',
  },
  {
    id: 'icp-as-03',
    displayName: 'Jakarta Dance Pop Collective',
    location: 'Jakarta, Indonesia',
    region: 'Asia',
    market: 'Dance-pop collective',
    kind: 'ICP',
    fitScore: 70,
    channels: ['YOUTUBE', 'EMAIL', 'LINE', 'INSTAGRAM'],
    thesis: 'Selective fit with LINE-style messaging and simple list ownership.',
    blindspot: 'Needs LINE before broad campaign adoption.',
  },
  {
    id: 'icp-as-04',
    displayName: 'Tokyo Alt Pop Fan Club Lead',
    location: 'Tokyo, Japan',
    region: 'Asia',
    market: 'Fan club lead',
    kind: 'ICP',
    fitScore: 68,
    channels: ['YOUTUBE', 'EMAIL', 'LINE', 'DISCORD'],
    thesis: 'Watchlist only until membership and private fan-club flows are stronger.',
  },
  {
    id: 'icp-as-05',
    displayName: 'Bangkok Afro-Fusion Festival Team',
    location: 'Bangkok, Thailand',
    region: 'Asia',
    market: 'Festival team',
    kind: 'ICP',
    fitScore: 66,
    channels: ['YOUTUBE', 'EMAIL', 'INSTAGRAM', 'LINE'],
    thesis: 'Useful later once regional messaging and ticket-to-fan identity are stronger.',
  },
  {
    id: 'non-01',
    displayName: 'London Major Label Catalog Team',
    location: 'London, United Kingdom',
    region: 'Europe',
    market: 'Major label catalog team',
    kind: 'NON_CUSTOMER',
    fitScore: 34,
    channels: ['SPOTIFY', 'YOUTUBE'],
    thesis: 'Low fit because the label, not the artist, owns the audience relationship.',
  },
  {
    id: 'non-02',
    displayName: 'Barcelona Festival Booker',
    location: 'Barcelona, Spain',
    region: 'Europe',
    market: 'Festival buyer',
    kind: 'NON_CUSTOMER',
    fitScore: 28,
    channels: ['INSTAGRAM', 'EMAIL'],
    thesis: 'Not a customer because fan ownership is not the primary job to be done.',
  },
  {
    id: 'non-03',
    displayName: 'LA Sync Composer Circle',
    location: 'Los Angeles, United States',
    region: 'America',
    market: 'Sync-only composer collective',
    kind: 'NON_CUSTOMER',
    fitScore: 36,
    channels: ['YOUTUBE', 'EMAIL'],
    thesis: 'Low fit because customer value comes from buyers, not audience community.',
  },
  {
    id: 'non-04',
    displayName: 'NYC Growth Agency Shop',
    location: 'New York, United States',
    region: 'America',
    market: 'Agency services shop',
    kind: 'NON_CUSTOMER',
    fitScore: 32,
    channels: ['EMAIL', 'INSTAGRAM', 'TIKTOK'],
    thesis: 'Would use the product tactically, but not become the core retained customer.',
  },
  {
    id: 'non-05',
    displayName: 'Lagos Playlist Broker',
    location: 'Lagos, Nigeria',
    region: 'Africa',
    market: 'Vanity metric operator',
    kind: 'NON_CUSTOMER',
    fitScore: 18,
    channels: ['SPOTIFY', 'YOUTUBE', 'TIKTOK'],
    thesis: 'Bad fit because the business is vanity amplification, not owned relationships.',
  },
  {
    id: 'non-06',
    displayName: 'Singapore Creator Tooling Consultant',
    location: 'Singapore',
    region: 'Asia',
    market: 'Consultant',
    kind: 'NON_CUSTOMER',
    fitScore: 40,
    channels: ['EMAIL', 'YOUTUBE', 'DISCORD'],
    thesis: 'Useful influencer, not a primary retained customer.',
  },
  {
    id: 'non-07',
    displayName: 'Accra Worship Ministry Admin',
    location: 'Accra, Ghana',
    region: 'Africa',
    market: 'Ministry admin',
    kind: 'NON_CUSTOMER',
    fitScore: 44,
    channels: ['EMAIL', 'WHATSAPP', 'YOUTUBE'],
    thesis: 'Adjacent fit, but too different from the artist CRM job right now.',
  },
  {
    id: 'non-08',
    displayName: 'Berlin Ticketing Promoter',
    location: 'Berlin, Germany',
    region: 'Europe',
    market: 'Ticketing-only promoter',
    kind: 'NON_CUSTOMER',
    fitScore: 30,
    channels: ['EMAIL', 'INSTAGRAM'],
    thesis: 'Owns transactions, not deep fan relationships across releases.',
  },
  {
    id: 'non-09',
    displayName: 'Toronto Merch Ops Partner',
    location: 'Toronto, Canada',
    region: 'America',
    market: 'Merch fulfillment operator',
    kind: 'NON_CUSTOMER',
    fitScore: 38,
    channels: ['EMAIL', 'SHOPIFY'],
    thesis: 'Can feed data in, but is not the relationship owner.',
  },
  {
    id: 'non-10',
    displayName: 'Tokyo Campus Media Club',
    location: 'Tokyo, Japan',
    region: 'Asia',
    market: 'Campus media club',
    kind: 'NON_CUSTOMER',
    fitScore: 42,
    channels: ['YOUTUBE', 'LINE', 'INSTAGRAM'],
    thesis: 'Interesting community, but not paying for artist-side CRM at the center.',
  },
  {
    id: 'hat-01',
    displayName: 'Atlanta Algorithm Maximalist Coach',
    location: 'Atlanta, United States',
    region: 'America',
    market: 'Growth coach',
    kind: 'HATER',
    fitScore: 22,
    channels: ['TIKTOK', 'INSTAGRAM', 'YOUTUBE'],
    thesis: 'Dismisses ownership because short-term reach looks easier.',
    blindspot: 'Needs proof that retention beats spikes.',
  },
  {
    id: 'hat-02',
    displayName: 'Seoul Privacy Skeptic Fan Lead',
    location: 'Seoul, South Korea',
    region: 'Asia',
    market: 'Privacy-first fan lead',
    kind: 'HATER',
    fitScore: 24,
    channels: ['KAKAO', 'DISCORD'],
    thesis: 'Pushes back on data capture without a clear consent and trust story.',
    blindspot: 'Consent UX must feel respectful and explicit.',
  },
  {
    id: 'hat-03',
    displayName: 'Paris Label Gatekeeper',
    location: 'Paris, France',
    region: 'Europe',
    market: 'Label gatekeeper',
    kind: 'HATER',
    fitScore: 20,
    channels: ['SPOTIFY', 'EMAIL'],
    thesis: 'Rejects the thesis because labels do not want artists to own the graph.',
  },
  {
    id: 'hat-04',
    displayName: 'Berlin Anti CRM Underground DJ',
    location: 'Berlin, Germany',
    region: 'Europe',
    market: 'Underground DJ',
    kind: 'HATER',
    fitScore: 16,
    channels: ['SOUNDCLOUD', 'INSTAGRAM'],
    thesis: 'Thinks CRM language kills mystique and community culture.',
    blindspot: 'Need a relationship-first, not sales-first, framing.',
  },
  {
    id: 'hat-05',
    displayName: 'Lagos Burned By SaaS Manager',
    location: 'Lagos, Nigeria',
    region: 'Africa',
    market: 'Manager burned by tooling',
    kind: 'HATER',
    fitScore: 26,
    channels: ['WHATSAPP', 'EMAIL', 'SPOTIFY'],
    thesis: 'Will resist until setup time and ROI are brutally clear.',
    blindspot: 'Onboarding must prove value fast.',
  },
  {
    id: 'hat-06',
    displayName: 'NYC Discord Purist Admin',
    location: 'New York, United States',
    region: 'America',
    market: 'Discord-first admin',
    kind: 'HATER',
    fitScore: 25,
    channels: ['DISCORD', 'YOUTUBE'],
    thesis: 'Believes the whole relationship can live inside one community app.',
    blindspot: 'Need to show why platform risk matters.',
  },
  {
    id: 'hat-07',
    displayName: 'Accra Boomplay Loyalist Strategist',
    location: 'Accra, Ghana',
    region: 'Africa',
    market: 'Regional DSP loyalist',
    kind: 'HATER',
    fitScore: 30,
    channels: ['BOOMPLAY', 'YOUTUBE', 'WHATSAPP'],
    thesis: 'Pushes back because the product feels too Spotify-centric.',
    blindspot: 'Regional DSP import is a trust gap.',
  },
  {
    id: 'hat-08',
    displayName: 'Tokyo Superfan Union Skeptic',
    location: 'Tokyo, Japan',
    region: 'Asia',
    market: 'Fan union skeptic',
    kind: 'HATER',
    fitScore: 18,
    channels: ['LINE', 'DISCORD'],
    thesis: 'Fears data ownership tools will exploit fandom rather than respect it.',
    blindspot: 'Need clearer reciprocity and consent language.',
  },
  {
    id: 'hat-09',
    displayName: 'Miami Cynical Tour Manager',
    location: 'Miami, United States',
    region: 'America',
    market: 'Tour manager',
    kind: 'HATER',
    fitScore: 21,
    channels: ['INSTAGRAM', 'EMAIL'],
    thesis: 'Views fan CRM as admin overhead unless it clearly drives revenue.',
  },
  {
    id: 'hat-10',
    displayName: 'Abuja Data Minimalist Collective',
    location: 'Abuja, Nigeria',
    region: 'Africa',
    market: 'Minimalist collective',
    kind: 'HATER',
    fitScore: 27,
    channels: ['WHATSAPP', 'YOUTUBE'],
    thesis: 'Wants intimacy without any system that feels extractive.',
    blindspot: 'Need a softer framing than analytics or growth.',
  },
]

const PERSONAS = PERSONA_INPUTS.map((input, index) => createPersona(input, index))

function round(value: number) {
  return Math.round(value * 10) / 10
}

function verdictForAverage(avgFit: number): FitBand {
  if (avgFit >= 85) return 'Core now'
  if (avgFit >= 76) return 'Expand next'
  if (avgFit >= 66) return 'Selective'
  return 'Not now'
}

export function getSimulationPersonas() {
  return PERSONAS
}

export function getSimulationSummary(): SimulationSummary {
  const icps = PERSONAS.filter((persona) => persona.kind === 'ICP')
  const coreAudience = icps.filter((persona) => persona.fitScore >= 82)
  const expansion = icps.filter((persona) => persona.fitScore >= 70 && persona.fitScore < 82)

  const regionBreakdown = (['Africa', 'Europe', 'America', 'Asia'] as const).map((region) => {
    const regionIcps = icps.filter((persona) => persona.region === region)
    const avgFit = round(
      regionIcps.reduce((sum, persona) => sum + persona.fitScore, 0) / Math.max(regionIcps.length, 1)
    )

    return {
      region,
      icpCount: regionIcps.length,
      avgFit,
      coreCount: regionIcps.filter((persona) => persona.fitScore >= 82).length,
      verdict: verdictForAverage(avgFit),
    }
  })

  return {
    totalParticipants: PERSONAS.length,
    icpCount: icps.length,
    nonCustomerCount: PERSONAS.filter((persona) => persona.kind === 'NON_CUSTOMER').length,
    haterCount: PERSONAS.filter((persona) => persona.kind === 'HATER').length,
    coreAudienceCount: coreAudience.length,
    expansionCount: expansion.length,
    thesis:
      'The beachhead is African music operators with direct community channels and conviction rails. Europe and America expand through diaspora managers. Asia is promising but only after fan-club messaging primitives land.',
    recommendedRollout: [
      'Africa first: Afrohouse, Amapiano, Afrobeats managers, and artist collectives.',
      'Europe next: diaspora artist-managers and community-led collectives.',
      'America after that: diaspora teams with owned list habits already in place.',
      'Asia selectively: only after Kakao or LINE and fan-club identity are live.',
    ],
    regionBreakdown,
    apiPriorities: {
      connect: ['YouTube', 'Spotify', 'Email List', 'Discord', 'Instagram/TikTok later'],
      reach: ['WhatsApp', 'SMS', 'LINE', 'Kakao'],
      rails: ['Oryx', 'Paystack', 'Flutterwave', 'M-Pesa', 'MTN MoMo'],
    },
    blindspots: [
      'Phone-first ownership is still underpowered without WhatsApp and SMS consent capture.',
      'Regional DSP trust gap remains until Boomplay and Audiomack are handled via partner or import paths.',
      'Asia needs fan-club identity, LINE, and Kakao before the market broadens cleanly.',
      'Haters cluster around privacy, label control, and anti-spam fear, so consent and proof must be obvious.',
    ],
  }
}

export function buildSimulationMoments() {
  const byId = new Map(PERSONAS.map((persona) => [persona.id, persona]))
  const featured = [
    {
      id: 'icp-af-01',
      type: 'BECAME_SUPERFAN',
      reason: 'WhatsApp + Oryx + YouTube already line up, so this is the clearest beachhead profile.',
    },
    {
      id: 'icp-eu-01',
      type: 'TIER_UPGRADE',
      reason: 'Europe works when diaspora managers already own some direct fan touchpoints.',
    },
    {
      id: 'icp-us-01',
      type: 'MILESTONE_ENGAGEMENT',
      reason: 'America is strongest through diaspora teams, not generic creator-market growth playbooks.',
    },
    {
      id: 'icp-as-01',
      type: 'MILESTONE_STREAMS',
      reason: 'Asia is promising, but Kakao and fan-club identity are prerequisites, not nice-to-haves.',
    },
    {
      id: 'hat-07',
      type: 'TIER_UPGRADE',
      reason: 'Boomplay pushback exposes a real trust gap in regional DSP coverage.',
    },
    {
      id: 'hat-02',
      type: 'TIER_UPGRADE',
      reason: 'Privacy objections mean consent and reciprocity have to be part of the product story.',
    },
  ]

  return featured
    .map((item) => {
      const persona = byId.get(item.id)
      if (!persona) return null

      return {
        id: `simulation-moment-${persona.id}`,
        type: item.type,
        description: persona.thesis,
        reason: item.reason,
        platform: persona.platformLinks[0]?.platform || null,
        occurredAt: persona.lastActiveAt,
        fan: {
          id: persona.id,
          name: persona.displayName,
          avatar: undefined,
          tier: persona.tier,
          score: persona.fitScore,
        },
        ackStatus: null,
        ackSentAt: null,
      }
    })
    .filter(
      (
        item
      ): item is {
        id: string
        type: string
        description: string
        reason: string
        platform: string | null
        occurredAt: string
        fan: {
          id: string
          name: string
          avatar: undefined
          tier: SimulationPersona['tier']
          score: number
        }
        ackStatus: null
        ackSentAt: null
      } => item !== null
    )
}
