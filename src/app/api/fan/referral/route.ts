import { NextRequest, NextResponse } from 'next/server'
import { getFanUser } from '@/lib/fan-auth'
import { createReferralLink, trackReferralClick, trackReferralConversion } from '@/lib/referrals/tracking'

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// POST - Generate or track referral
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'generate': {
        const user = await getFanUser()
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { artistId } = body
        if (!artistId) {
          return NextResponse.json({ error: 'artistId required' }, { status: 400 })
        }

        const code = await createReferralLink(user.id, artistId)
        const referralUrl = `${BASE_URL}/r/${code}`

        return NextResponse.json({
          code,
          url: referralUrl,
          shareText: `Check out this artist on Stanvault! ${referralUrl}`,
        })
      }

      case 'click': {
        const { code } = body
        if (!code) {
          return NextResponse.json({ error: 'code required' }, { status: 400 })
        }

        const result = await trackReferralClick(code)
        return NextResponse.json(result)
      }

      case 'convert': {
        const user = await getFanUser()
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { code: convCode } = body
        if (!convCode) {
          return NextResponse.json({ error: 'code required' }, { status: 400 })
        }

        const success = await trackReferralConversion(convCode, user.id)
        return NextResponse.json({ success })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Referral error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
