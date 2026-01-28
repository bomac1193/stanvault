import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateFanUser,
  createFanSession,
  setFanSessionCookie,
  FAN_AUTH_CONFIG,
} from '@/lib/fan-auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    // Authenticate user
    const result = await authenticateFanUser(email, password)

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      )
    }

    // Create session
    const signedToken = await createFanSession(result.user.id)
    await setFanSessionCookie(signedToken)

    // Determine redirect based on onboarding status
    const redirectTo = result.user.onboardingCompleted
      ? FAN_AUTH_CONFIG.dashboardPage
      : FAN_AUTH_CONFIG.onboardingPage

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        onboardingCompleted: result.user.onboardingCompleted,
      },
      redirectTo,
    })
  } catch (error) {
    console.error('Fan login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
