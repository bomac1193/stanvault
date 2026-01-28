import { NextResponse } from 'next/server'
import { getFanUser, completeFanOnboarding } from '@/lib/fan-auth'

export async function POST() {
  try {
    const user = await getFanUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await completeFanOnboarding(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Complete onboarding error:', error)
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })
  }
}
