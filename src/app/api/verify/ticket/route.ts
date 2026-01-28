import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac } from 'crypto'

const TOKEN_SECRET = process.env.VERIFICATION_TOKEN_SECRET || process.env.AUTH_SECRET || 'default-secret'

interface TicketVerificationRequest {
  token: string
  artistId: string
  eventId?: string
  tierRequired?: 'CASUAL' | 'ENGAGED' | 'DEDICATED' | 'SUPERFAN'
  minScore?: number
  minMonths?: number
}

interface TicketVerificationResponse {
  valid: boolean
  eligible: boolean
  reason?: string
  fan?: {
    tier: string
    score: number
    relationshipMonths: number
    verified: boolean
  }
  eventAccess?: {
    presaleEligible: boolean
    priorityLevel: number // 1-4, higher = better access
    maxTickets: number
  }
}

// POST - Verify a fan token for ticket purchase eligibility
export async function POST(request: NextRequest) {
  try {
    const body: TicketVerificationRequest = await request.json()
    const { token, artistId, tierRequired, minScore, minMonths } = body

    if (!token || !artistId) {
      return NextResponse.json(
        { valid: false, eligible: false, reason: 'Missing token or artistId' },
        { status: 400 }
      )
    }

    // Parse and verify token
    const [payloadB64, signatureB64] = token.split('.')
    if (!payloadB64 || !signatureB64) {
      return NextResponse.json(
        { valid: false, eligible: false, reason: 'Invalid token format' },
        { status: 400 }
      )
    }

    // Verify signature
    const expectedSignature = createHmac('sha256', TOKEN_SECRET)
      .update(payloadB64)
      .digest('base64url')

    // Also check if it's a full payload signature (for backward compatibility)
    let payload: {
      type: string
      tokenId: string
      fanUserId: string
      artistId: string
      tier: string
      stanScore: number
      relationshipMonths: number
      issuedAt: number
      expiresAt: number
    }

    try {
      payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
    } catch {
      return NextResponse.json(
        { valid: false, eligible: false, reason: 'Invalid token payload' },
        { status: 400 }
      )
    }

    // Verify signature against JSON stringified payload
    const payloadSignature = createHmac('sha256', TOKEN_SECRET)
      .update(JSON.stringify(payload))
      .digest('base64url')

    if (signatureB64 !== expectedSignature && signatureB64 !== payloadSignature) {
      return NextResponse.json(
        { valid: false, eligible: false, reason: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Check expiration
    if (payload.expiresAt < Date.now()) {
      return NextResponse.json(
        { valid: false, eligible: false, reason: 'Token expired' },
        { status: 400 }
      )
    }

    // Check artist match
    if (payload.artistId !== artistId) {
      return NextResponse.json(
        { valid: false, eligible: false, reason: 'Token not valid for this artist' },
        { status: 400 }
      )
    }

    // Check if token is revoked
    const storedToken = await prisma.fanUserVerificationToken.findFirst({
      where: {
        token,
        revokedAt: null,
      },
    })

    if (!storedToken) {
      return NextResponse.json(
        { valid: false, eligible: false, reason: 'Token revoked or not found' },
        { status: 400 }
      )
    }

    // Update usage count
    await prisma.fanUserVerificationToken.update({
      where: { id: storedToken.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    })

    // Check eligibility based on requirements
    const tierRank: Record<string, number> = {
      CASUAL: 1,
      ENGAGED: 2,
      DEDICATED: 3,
      SUPERFAN: 4,
    }

    const fanTierRank = tierRank[payload.tier] || 0
    const requiredTierRank = tierRequired ? tierRank[tierRequired] || 0 : 0

    let eligible = true
    let reason: string | undefined

    if (tierRequired && fanTierRank < requiredTierRank) {
      eligible = false
      reason = `Requires ${tierRequired} tier or higher`
    }

    if (minScore && payload.stanScore < minScore) {
      eligible = false
      reason = `Requires minimum score of ${minScore}`
    }

    if (minMonths && payload.relationshipMonths < minMonths) {
      eligible = false
      reason = `Requires ${minMonths}+ months as a fan`
    }

    // Calculate priority level and ticket allocation
    const priorityLevel = fanTierRank
    const maxTickets = Math.min(2 + fanTierRank, 6) // 3-6 tickets based on tier

    const response: TicketVerificationResponse = {
      valid: true,
      eligible,
      reason,
      fan: {
        tier: payload.tier,
        score: payload.stanScore,
        relationshipMonths: payload.relationshipMonths,
        verified: true,
      },
      eventAccess: {
        presaleEligible: eligible && fanTierRank >= 2, // ENGAGED+ get presale
        priorityLevel,
        maxTickets,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Ticket verification error:', error)
    return NextResponse.json(
      { valid: false, eligible: false, reason: 'Verification failed' },
      { status: 500 }
    )
  }
}

// GET - Check verification endpoint status (for integration testing)
export async function GET() {
  return NextResponse.json({
    service: 'Stanvault Anti-Scalper Verification',
    version: '1.0',
    status: 'operational',
    documentation: 'https://stanvault.io/docs/ticket-verification',
    endpoints: {
      verify: {
        method: 'POST',
        body: {
          token: 'string (required)',
          artistId: 'string (required)',
          tierRequired: 'CASUAL | ENGAGED | DEDICATED | SUPERFAN (optional)',
          minScore: 'number (optional)',
          minMonths: 'number (optional)',
        },
      },
    },
  })
}
