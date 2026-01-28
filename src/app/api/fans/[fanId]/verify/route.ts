import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  generateVerificationToken,
  getFanTokens,
  revokeToken,
} from '@/lib/verification/token'

/**
 * Generate a verification token for a fan
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fanId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fanId } = await params

    // Verify the fan belongs to this artist
    const fan = await prisma.fan.findUnique({
      where: { id: fanId },
    })

    if (!fan || fan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Fan not found' }, { status: 404 })
    }

    // Parse request body for optional parameters
    const body = await request.json().catch(() => ({}))
    const { expiryDays, issuedFor } = body

    // Generate token
    const { token, expiresAt } = await generateVerificationToken({
      fanId,
      artistUserId: session.user.id,
      expiryDays: expiryDays || 30,
      issuedFor,
    })

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      fan: {
        id: fan.id,
        displayName: fan.displayName,
        tier: fan.tier,
        stanScore: fan.stanScore,
      },
    })
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate token' },
      { status: 500 }
    )
  }
}

/**
 * Get all active tokens for a fan
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fanId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fanId } = await params

    // Verify the fan belongs to this artist
    const fan = await prisma.fan.findUnique({
      where: { id: fanId },
    })

    if (!fan || fan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Fan not found' }, { status: 404 })
    }

    const tokens = await getFanTokens(fanId)

    return NextResponse.json({
      tokens: tokens.map(t => ({
        id: t.id,
        tier: t.tier,
        stanScore: t.stanScore,
        relationshipMonths: t.relationshipMonths,
        issuedAt: t.issuedAt,
        expiresAt: t.expiresAt,
        usageCount: t.usageCount,
        lastUsedAt: t.lastUsedAt,
        issuedFor: t.issuedFor,
      })),
    })
  } catch (error) {
    console.error('Get tokens error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Revoke a verification token
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fanId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fanId } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Verify the fan belongs to this artist
    const fan = await prisma.fan.findUnique({
      where: { id: fanId },
    })

    if (!fan || fan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Fan not found' }, { status: 404 })
    }

    const success = await revokeToken(token, fanId)

    if (!success) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Revoke token error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
