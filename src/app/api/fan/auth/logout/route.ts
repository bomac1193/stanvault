import { NextResponse } from 'next/server'
import { logoutFanUser, FAN_AUTH_CONFIG } from '@/lib/fan-auth'

export async function POST() {
  try {
    await logoutFanUser()

    return NextResponse.json({
      success: true,
      redirectTo: FAN_AUTH_CONFIG.loginPage,
    })
  } catch (error) {
    console.error('Fan logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}
