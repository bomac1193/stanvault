import { prisma } from '@/lib/prisma'
import { FanTier } from '@prisma/client'
import { createHmac, randomBytes } from 'crypto'
import { addDays, differenceInMonths } from 'date-fns'

const TOKEN_SECRET = process.env.VERIFICATION_TOKEN_SECRET || process.env.AUTH_SECRET || 'default-secret'
const DEFAULT_TOKEN_EXPIRY_DAYS = 30

export interface VerificationTokenData {
  fanId: string
  artistId: string
  artistName: string
  tier: FanTier
  stanScore: number
  relationshipMonths: number
  issuedAt: Date
  expiresAt: Date
}

export interface GenerateTokenOptions {
  fanId: string
  artistUserId: string
  expiryDays?: number
  issuedFor?: string // Purpose/recipient
}

export interface VerificationResult {
  valid: boolean
  expired?: boolean
  revoked?: boolean
  data?: VerificationTokenData & { artistName: string }
  error?: string
}

/**
 * Generate a verification token for a fan
 */
export async function generateVerificationToken(
  options: GenerateTokenOptions
): Promise<{ token: string; expiresAt: Date }> {
  const { fanId, artistUserId, expiryDays = DEFAULT_TOKEN_EXPIRY_DAYS, issuedFor } = options

  // Get fan data
  const fan = await prisma.fan.findUnique({
    where: { id: fanId },
    include: {
      user: {
        select: {
          id: true,
          artistName: true,
        },
      },
    },
  })

  if (!fan) {
    throw new Error('Fan not found')
  }

  if (fan.userId !== artistUserId) {
    throw new Error('Fan does not belong to this artist')
  }

  // Calculate relationship duration
  const relationshipMonths = differenceInMonths(new Date(), fan.firstSeenAt)

  // Generate token
  const tokenId = randomBytes(16).toString('hex')
  const expiresAt = addDays(new Date(), expiryDays)

  // Create token payload
  const payload = {
    tokenId,
    fanId,
    artistId: artistUserId,
    tier: fan.tier,
    stanScore: fan.stanScore,
    relationshipMonths,
    issuedAt: Date.now(),
    expiresAt: expiresAt.getTime(),
  }

  // Sign the payload
  const signature = signPayload(payload)
  const token = `${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${signature}`

  // Store in database
  await prisma.fanVerificationToken.create({
    data: {
      fanId,
      artistId: artistUserId,
      token,
      tier: fan.tier,
      stanScore: fan.stanScore,
      relationshipMonths,
      expiresAt,
      issuedFor,
    },
  })

  return { token, expiresAt }
}

/**
 * Verify a token and return fan data
 */
export async function verifyToken(token: string): Promise<VerificationResult> {
  try {
    // Parse token
    const [payloadBase64, signature] = token.split('.')

    if (!payloadBase64 || !signature) {
      return { valid: false, error: 'Invalid token format' }
    }

    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString())

    // Verify signature
    const expectedSignature = signPayload(payload)
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' }
    }

    // Check expiration
    if (payload.expiresAt < Date.now()) {
      return { valid: false, expired: true, error: 'Token expired' }
    }

    // Check if revoked in database
    const storedToken = await prisma.fanVerificationToken.findUnique({
      where: { token },
    })

    if (!storedToken) {
      return { valid: false, error: 'Token not found' }
    }

    if (storedToken.revokedAt) {
      return { valid: false, revoked: true, error: 'Token revoked' }
    }

    // Get artist name
    const artist = await prisma.user.findUnique({
      where: { id: payload.artistId },
      select: { artistName: true },
    })

    // Update usage stats
    await prisma.fanVerificationToken.update({
      where: { token },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    })

    return {
      valid: true,
      data: {
        fanId: payload.fanId,
        artistId: payload.artistId,
        artistName: artist?.artistName || 'Unknown Artist',
        tier: payload.tier,
        stanScore: payload.stanScore,
        relationshipMonths: payload.relationshipMonths,
        issuedAt: new Date(payload.issuedAt),
        expiresAt: new Date(payload.expiresAt),
      },
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    }
  }
}

/**
 * Revoke a verification token
 */
export async function revokeToken(token: string, fanId: string): Promise<boolean> {
  try {
    const storedToken = await prisma.fanVerificationToken.findUnique({
      where: { token },
    })

    if (!storedToken || storedToken.fanId !== fanId) {
      return false
    }

    await prisma.fanVerificationToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    })

    return true
  } catch {
    return false
  }
}

/**
 * Get all active tokens for a fan
 */
export async function getFanTokens(fanId: string) {
  return prisma.fanVerificationToken.findMany({
    where: {
      fanId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Clean up expired tokens (for cron job)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.fanVerificationToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null } },
      ],
    },
  })

  return result.count
}

/**
 * Sign a payload with HMAC
 */
function signPayload(payload: object): string {
  const hmac = createHmac('sha256', TOKEN_SECRET)
  hmac.update(JSON.stringify(payload))
  return hmac.digest('base64url')
}
