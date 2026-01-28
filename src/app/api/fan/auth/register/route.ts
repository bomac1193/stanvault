import { NextRequest, NextResponse } from 'next/server'
import { createFanUser, createFanSession, setFanSessionCookie } from '@/lib/fan-auth'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(1, 'Display name is required').max(50),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password, displayName } = parsed.data

    // Create user
    const result = await createFanUser(email, password, displayName)

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
