// Beta invite management — admin only
// GET: list all invites (filterable by wave, cohort, channel)
// POST: create new invite codes (batch or single)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

function isAdmin(email?: string | null): boolean {
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
  if (!email) return false
  return admins.includes(email.toLowerCase())
}

// GET /api/beta/invites — list invites
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const wave = searchParams.get('wave')
  const cohort = searchParams.get('cohort')
  const channel = searchParams.get('channel')
  const active = searchParams.get('active')

  const where: Record<string, unknown> = {}
  if (wave) where.wave = parseInt(wave)
  if (cohort) {
    // Could be artist or fan cohort
    where.OR = [{ artistCohort: cohort }, { fanCohort: cohort }]
  }
  if (channel) where.channel = channel
  if (active !== null) where.isActive = active !== 'false'

  const invites = await prisma.betaInvite.findMany({
    where,
    orderBy: [{ wave: 'asc' }, { createdAt: 'desc' }],
  })

  const summary = {
    total: invites.length,
    used: invites.reduce((sum, i) => sum + i.usedCount, 0),
    available: invites.filter((i) => i.isActive && i.usedCount < i.maxUses).length,
    byWave: {
      1: invites.filter((i) => i.wave === 1).length,
      2: invites.filter((i) => i.wave === 2).length,
      3: invites.filter((i) => i.wave === 3).length,
    },
  }

  return NextResponse.json({ invites, summary })
}

// POST /api/beta/invites — create invite codes
const createSchema = z.object({
  // Generate a batch of codes
  count: z.number().int().min(1).max(100).default(1),
  prefix: z.string().min(1).max(10).default('SV'),

  // Targeting
  artistCohort: z
    .enum([
      'CORE_AFROBEATS',
      'DIASPORA',
      'MANAGER',
      'DIRECT_TO_FAN_INDIE',
      'EXPERIMENTAL_NICHE',
      'PRODUCER_DJ',
      'INDIE_HIPHOP_RNB',
    ])
    .optional(),
  fanCohort: z
    .enum([
      'DEEP_AFRICAN',
      'DIASPORA_SUPERFAN',
      'BANDCAMP_KOFI_SUPPORTER',
      'STREET_TEAM_LEADER',
      'CASUAL_CURIOUS',
      'COLD_SIGNUP',
    ])
    .optional(),
  targetTier: z.enum(['STARTER', 'PRIVATE_CIRCLE', 'PATRON_GROWTH', 'SOVEREIGN']).optional(),
  channel: z.enum([
    'ORYX_PALMLION',
    'MUSIC_TWITTER',
    'BANDCAMP_OUTREACH',
    'MANAGER_NETWORK',
    'DISCORD_COMMUNITY',
    'PERSONAL_NETWORK',
    'COLD_SIGNUP',
  ]),

  // Config
  maxUses: z.number().int().min(1).max(1000).default(1),
  wave: z.number().int().min(1).max(3).default(1),
  description: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { count, prefix, artistCohort, fanCohort, targetTier, channel, maxUses, wave, description, expiresAt } =
    parsed.data

  // Must specify either artist or fan cohort (not both)
  if (artistCohort && fanCohort) {
    return NextResponse.json({ error: 'Specify artistCohort or fanCohort, not both' }, { status: 400 })
  }
  if (!artistCohort && !fanCohort) {
    return NextResponse.json({ error: 'Must specify artistCohort or fanCohort' }, { status: 400 })
  }

  // Generate codes
  const cohortTag = (artistCohort || fanCohort || '').slice(0, 6).toUpperCase()
  const codes: Array<Record<string, unknown>> = []

  for (let i = 0; i < count; i++) {
    const suffix = String(i + 1).padStart(3, '0')
    const random = Math.random().toString(36).slice(2, 6).toUpperCase()
    const code = `${prefix}-${cohortTag}-${suffix}-${random}`

    codes.push({
      code,
      description: description ?? undefined,
      artistCohort: artistCohort ?? undefined,
      fanCohort: fanCohort ?? undefined,
      targetTier: targetTier ?? undefined,
      channel,
      maxUses,
      wave,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    })
  }

  const created = await prisma.betaInvite.createMany({ data: codes as any })

  return NextResponse.json({
    created: created.count,
    codes: codes.map((c) => c.code),
    wave,
    cohort: artistCohort || fanCohort,
    channel,
  })
}
