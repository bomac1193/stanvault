/**
 * Seed beta invite codes for the 200-user beta program.
 *
 * Run: npx tsx scripts/seed-beta-invites.ts
 *
 * Generates invite codes for all cohort segments per the beta plan:
 *   Wave 1 (Weeks 1-2): 30 Core Afrobeats artists + 20 Deep African fans = 50 users
 *   Wave 2 (Weeks 3-4): 15 Diaspora + 10 Managers + 25 fans = 50 users
 *   Wave 3 (Weeks 5-6): Remaining 100 (Starter artists + remaining fan segments)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function generateCode(prefix: string, cohortTag: string, index: number): string {
  const suffix = String(index).padStart(3, '0')
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${cohortTag}-${suffix}-${random}`
}

interface InviteBatch {
  cohortTag: string
  count: number
  artistCohort?: string
  fanCohort?: string
  targetTier?: string
  channel: string
  wave: number
  description: string
}

const batches: InviteBatch[] = [
  // =============================================
  // WAVE 1: Weeks 1-2 — First 50 users
  // =============================================

  // 30 Core Afrobeats/Amapiano artists
  {
    cohortTag: 'AFRO',
    count: 20,
    artistCohort: 'CORE_AFROBEATS',
    targetTier: 'PRIVATE_CIRCLE',
    channel: 'ORYX_PALMLION',
    wave: 1,
    description: 'Wave 1: Core Afrobeats via Oryx/Palmlion ecosystem',
  },
  {
    cohortTag: 'AFRO',
    count: 10,
    artistCohort: 'CORE_AFROBEATS',
    targetTier: 'PRIVATE_CIRCLE',
    channel: 'MUSIC_TWITTER',
    wave: 1,
    description: 'Wave 1: Core Afrobeats via Music Twitter/X outreach',
  },

  // 20 Deep African fans
  {
    cohortTag: 'DEEPFN',
    count: 20,
    fanCohort: 'DEEP_AFRICAN',
    channel: 'ORYX_PALMLION',
    wave: 1,
    description: 'Wave 1: Deep African fans via ecosystem referral',
  },

  // =============================================
  // WAVE 2: Weeks 3-4 — Next 50 users
  // =============================================

  // 15 Diaspora African artists
  {
    cohortTag: 'DIASP',
    count: 15,
    artistCohort: 'DIASPORA',
    targetTier: 'PRIVATE_CIRCLE',
    channel: 'MUSIC_TWITTER',
    wave: 2,
    description: 'Wave 2: Diaspora African artists via Music Twitter/X',
  },

  // 10 Managers
  {
    cohortTag: 'MNGR',
    count: 10,
    artistCohort: 'MANAGER',
    targetTier: 'PATRON_GROWTH',
    channel: 'MANAGER_NETWORK',
    wave: 2,
    description: 'Wave 2: Managers via personal network intros',
  },

  // 25 Diaspora superfans
  {
    cohortTag: 'DSFAN',
    count: 25,
    fanCohort: 'DIASPORA_SUPERFAN',
    channel: 'ORYX_PALMLION',
    wave: 2,
    description: 'Wave 2: Diaspora superfans via ecosystem + artist referral',
  },

  // =============================================
  // WAVE 3: Weeks 5-6 — Remaining 100 users
  // =============================================

  // 10 Direct-to-fan indie artists
  {
    cohortTag: 'D2F',
    count: 10,
    artistCohort: 'DIRECT_TO_FAN_INDIE',
    targetTier: 'STARTER',
    channel: 'BANDCAMP_OUTREACH',
    wave: 3,
    description: 'Wave 3: Direct-to-fan indie via Bandcamp outreach',
  },

  // 5 Experimental/niche artists
  {
    cohortTag: 'EXPER',
    count: 5,
    artistCohort: 'EXPERIMENTAL_NICHE',
    targetTier: 'STARTER',
    channel: 'PERSONAL_NETWORK',
    wave: 3,
    description: 'Wave 3: Experimental/niche from creative circles',
  },

  // 5 Producer-DJs
  {
    cohortTag: 'PRODJ',
    count: 5,
    artistCohort: 'PRODUCER_DJ',
    targetTier: 'STARTER',
    channel: 'DISCORD_COMMUNITY',
    wave: 3,
    description: 'Wave 3: Producer-DJs via Discord music communities',
  },

  // 5 Indie Hip-Hop/R&B (US)
  {
    cohortTag: 'HIPHP',
    count: 5,
    artistCohort: 'INDIE_HIPHOP_RNB',
    targetTier: 'STARTER',
    channel: 'MUSIC_TWITTER',
    wave: 3,
    description: 'Wave 3: Indie Hip-Hop/R&B via Music Twitter/X',
  },

  // 20 Bandcamp/Ko-fi supporters
  {
    cohortTag: 'BCFAN',
    count: 20,
    fanCohort: 'BANDCAMP_KOFI_SUPPORTER',
    channel: 'BANDCAMP_OUTREACH',
    wave: 3,
    description: 'Wave 3: Bandcamp/Ko-fi fans via artist referral',
  },

  // 15 Street team / fan club leaders
  {
    cohortTag: 'STRTM',
    count: 15,
    fanCohort: 'STREET_TEAM_LEADER',
    channel: 'DISCORD_COMMUNITY',
    wave: 3,
    description: 'Wave 3: Street team leaders via Discord communities',
  },

  // 15 Casual-but-curious
  {
    cohortTag: 'CASUL',
    count: 15,
    fanCohort: 'CASUAL_CURIOUS',
    channel: 'COLD_SIGNUP',
    wave: 3,
    description: 'Wave 3: Casual-but-curious from drop links + social',
  },

  // 15 Deep African fans (remaining from wave 1 allocation)
  {
    cohortTag: 'DEEPFN',
    count: 15,
    fanCohort: 'DEEP_AFRICAN',
    channel: 'ORYX_PALMLION',
    wave: 3,
    description: 'Wave 3: Remaining Deep African fans',
  },

  // 10 Skeptics / cold signups
  {
    cohortTag: 'COLD',
    count: 10,
    fanCohort: 'COLD_SIGNUP',
    channel: 'COLD_SIGNUP',
    wave: 3,
    description: 'Wave 3: Cold signups from marketing page',
  },
]

async function main() {
  console.log('Seeding beta invite codes...\n')

  let totalCreated = 0
  const summary: Record<number, { artists: number; fans: number }> = {
    1: { artists: 0, fans: 0 },
    2: { artists: 0, fans: 0 },
    3: { artists: 0, fans: 0 },
  }

  for (const batch of batches) {
    const codes = []
    for (let i = 1; i <= batch.count; i++) {
      codes.push({
        code: generateCode('SV', batch.cohortTag, i),
        description: batch.description,
        artistCohort: batch.artistCohort ?? undefined,
        fanCohort: batch.fanCohort ?? undefined,
        targetTier: batch.targetTier ?? undefined,
        channel: batch.channel,
        maxUses: 1,
        wave: batch.wave,
      })
    }

    const created = await prisma.betaInvite.createMany({
      data: codes as any,
    })

    totalCreated += created.count

    if (batch.artistCohort) {
      summary[batch.wave].artists += created.count
    } else {
      summary[batch.wave].fans += created.count
    }

    console.log(
      `  [Wave ${batch.wave}] ${batch.cohortTag}: ${created.count} codes (${batch.artistCohort ? 'artist' : 'fan'})`
    )
  }

  console.log('\n--- Summary ---')
  for (const [wave, counts] of Object.entries(summary)) {
    console.log(`  Wave ${wave}: ${counts.artists} artist codes + ${counts.fans} fan codes = ${counts.artists + counts.fans} total`)
  }
  console.log(`\n  Total codes created: ${totalCreated}`)

  // Print sample codes for quick reference
  const sampleCodes = await prisma.betaInvite.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { code: true, artistCohort: true, fanCohort: true, wave: true },
  })

  console.log('\n--- Sample codes ---')
  for (const code of sampleCodes) {
    console.log(`  ${code.code} → ${code.artistCohort || code.fanCohort} (wave ${code.wave})`)
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
