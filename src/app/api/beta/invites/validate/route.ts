// Validate a beta invite code — used during registration
// POST /api/beta/invites/validate
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const validateSchema = z.object({
  code: z.string().min(1, 'Invite code is required'),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = validateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const invite = await prisma.betaInvite.findUnique({
    where: { code: parsed.data.code },
  })

  if (!invite) {
    return NextResponse.json({ valid: false, reason: 'Invalid invite code' }, { status: 404 })
  }

  if (!invite.isActive) {
    return NextResponse.json({ valid: false, reason: 'Invite code is no longer active' })
  }

  if (invite.usedCount >= invite.maxUses) {
    return NextResponse.json({ valid: false, reason: 'Invite code has been fully used' })
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, reason: 'Invite code has expired' })
  }

  return NextResponse.json({
    valid: true,
    wave: invite.wave,
    artistCohort: invite.artistCohort,
    fanCohort: invite.fanCohort,
    targetTier: invite.targetTier,
    channel: invite.channel,
  })
}
