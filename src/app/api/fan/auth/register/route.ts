import { NextRequest, NextResponse } from 'next/server'
import { createFanUser, createFanSession, setFanSessionCookie } from '@/lib/fan-auth'
import { prisma } from '@/lib/prisma'
import { FanBetaCohort, AcquisitionChannel } from '@prisma/client'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(1, 'Display name is required').max(50),
  inviteCode: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, displayName, inviteCode } = parsed.data

    // Validate invite code if provided
    let betaData: {
      betaCohort?: FanBetaCohort
      acquisitionChannel?: AcquisitionChannel
      betaInviteCode?: string
    } | undefined

    if (inviteCode) {
      const invite = await prisma.betaInvite.findUnique({
        where: { code: inviteCode },
      })

      if (!invite) {
        return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
      }
      if (!invite.isActive) {
        return NextResponse.json({ error: 'Invite code is no longer active' }, { status: 400 })
      }
      if (invite.usedCount >= invite.maxUses) {
        return NextResponse.json({ error: 'Invite code has been fully used' }, { status: 400 })
      }
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Invite code has expired' }, { status: 400 })
      }
      if (!invite.fanCohort) {
        return NextResponse.json({ error: 'This invite code is for artist registration' }, { status: 400 })
      }

      // Increment usage
      await prisma.betaInvite.update({
        where: { id: invite.id },
        data: { usedCount: { increment: 1 } },
      })

      betaData = {
        betaCohort: invite.fanCohort,
        acquisitionChannel: invite.channel,
        betaInviteCode: inviteCode,
      }
    }

    // Create user
    const result = await createFanUser(email, password, displayName, betaData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Create session
    const signedToken = await createFanSession(result.userId!)
    await setFanSessionCookie(signedToken)

    return NextResponse.json({
      success: true,
      redirectTo: '/fan/onboarding',
    })
  } catch (error) {
    console.error('Fan registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
