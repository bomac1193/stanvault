import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/verification/token'

/**
 * Public endpoint for third parties to verify fan tokens
 * No authentication required - tokens are self-verifying
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    const result = await verifyToken(token)

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        expired: result.expired,
        revoked: result.revoked,
        error: result.error,
      })
    }

    // Return verified data (safe to expose)
    return NextResponse.json({
      valid: true,
      artistId: result.data?.artistId,
      artistName: result.data?.artistName,
      tier: result.data?.tier,
      stanScore: result.data?.stanScore,
      relationshipMonths: result.data?.relationshipMonths,
      issuedAt: result.data?.issuedAt,
      expiresAt: result.data?.expiresAt,
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { valid: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for simple verification via query param
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { valid: false, error: 'Token query parameter is required' },
      { status: 400 }
    )
  }

  const result = await verifyToken(token)

  if (!result.valid) {
    return NextResponse.json({
      valid: false,
      expired: result.expired,
      revoked: result.revoked,
      error: result.error,
    })
  }

  return NextResponse.json({
    valid: true,
    artistId: result.data?.artistId,
    artistName: result.data?.artistName,
    tier: result.data?.tier,
    stanScore: result.data?.stanScore,
    relationshipMonths: result.data?.relationshipMonths,
    issuedAt: result.data?.issuedAt,
    expiresAt: result.data?.expiresAt,
  })
}
