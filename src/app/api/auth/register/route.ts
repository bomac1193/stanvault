import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BetaCohort, AcquisitionChannel, PricingTier } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  inviteCode: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, name, inviteCode } = parsed.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Validate invite code if provided
    let betaFields: {
      betaCohort?: BetaCohort
      acquisitionChannel?: AcquisitionChannel
      betaInviteCode?: string
      betaJoinedAt?: Date
      pricingTier?: PricingTier
    } = {}

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
      if (!invite.artistCohort) {
        return NextResponse.json({ error: 'This invite code is for fan registration' }, { status: 400 })
      }

      // Increment usage
      await prisma.betaInvite.update({
        where: { id: invite.id },
        data: { usedCount: { increment: 1 } },
      })

      betaFields = {
        betaCohort: invite.artistCohort,
        acquisitionChannel: invite.channel,
        betaInviteCode: inviteCode,
        betaJoinedAt: new Date(),
        ...(invite.targetTier ? { pricingTier: invite.targetTier } : {}),
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        onboardingStep: 1,
        onboardingCompleted: false,
        ...betaFields,
      },
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      betaCohort: user.betaCohort,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
