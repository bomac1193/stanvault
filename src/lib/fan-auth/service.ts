import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { FAN_AUTH_CONFIG } from './config'
import bcrypt from 'bcryptjs'
import { randomBytes, createHmac } from 'crypto'

const SESSION_SECRET = process.env.AUTH_SECRET || 'fan-session-secret'

interface FanUserSession {
  id: string
  email: string
  displayName: string
  avatarUrl?: string | null
  spotifyUserId?: string | null
  onboardingCompleted: boolean
}

/**
 * Create a new fan user
 */
export async function createFanUser(
  email: string,
  password: string,
  displayName: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Check if email already exists
    const existing = await prisma.fanUser.findUnique({
      where: { email },
    })

    if (existing) {
      return { success: false, error: 'Email already registered' }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.fanUser.create({
      data: {
        email,
        password: hashedPassword,
        displayName,
      },
    })

    return { success: true, userId: user.id }
  } catch (error) {
    console.error('Create fan user error:', error)
    return { success: false, error: 'Failed to create account' }
  }
}

/**
 * Authenticate a fan user
 */
export async function authenticateFanUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: FanUserSession; error?: string }> {
  try {
    const user = await prisma.fanUser.findUnique({
      where: { email },
    })

    if (!user || !user.password) {
      return { success: false, error: 'Invalid email or password' }
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return { success: false, error: 'Invalid email or password' }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        spotifyUserId: user.spotifyUserId,
        onboardingCompleted: user.onboardingCompleted,
      },
    }
  } catch (error) {
    console.error('Authenticate fan user error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Create a session for a fan user
 */
export async function createFanSession(userId: string): Promise<string> {
  const sessionToken = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + FAN_AUTH_CONFIG.sessionMaxAge * 1000)

  await prisma.fanUserSession.create({
    data: {
      sessionToken,
      fanUserId: userId,
      expires,
    },
  })

  // Sign the token for cookie
  const signature = createHmac('sha256', SESSION_SECRET)
    .update(sessionToken)
    .digest('hex')

  return `${sessionToken}.${signature}`
}

/**
 * Set session cookie
 */
export async function setFanSessionCookie(signedToken: string) {
  const cookieStore = await cookies()
  cookieStore.set(FAN_AUTH_CONFIG.sessionCookieName, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: FAN_AUTH_CONFIG.sessionMaxAge,
    path: '/',
  })
}

/**
 * Get current fan user from session
 */
export async function getFanUser(): Promise<FanUserSession | null> {
  try {
    const cookieStore = await cookies()
    const signedToken = cookieStore.get(FAN_AUTH_CONFIG.sessionCookieName)?.value

    if (!signedToken) {
      return null
    }

    // Verify signature
    const [token, signature] = signedToken.split('.')
    const expectedSignature = createHmac('sha256', SESSION_SECRET)
      .update(token)
      .digest('hex')

    if (signature !== expectedSignature) {
      return null
    }

    // Get session
    const session = await prisma.fanUserSession.findUnique({
      where: { sessionToken: token },
      include: { fanUser: true },
    })

    if (!session || session.expires < new Date()) {
      // Clean up expired session
      if (session) {
        await prisma.fanUserSession.delete({
          where: { id: session.id },
        })
      }
      return null
    }

    return {
      id: session.fanUser.id,
      email: session.fanUser.email,
      displayName: session.fanUser.displayName,
      avatarUrl: session.fanUser.avatarUrl,
      spotifyUserId: session.fanUser.spotifyUserId,
      onboardingCompleted: session.fanUser.onboardingCompleted,
    }
  } catch (error) {
    console.error('Get fan user error:', error)
    return null
  }
}

/**
 * Logout fan user
 */
export async function logoutFanUser() {
  try {
    const cookieStore = await cookies()
    const signedToken = cookieStore.get(FAN_AUTH_CONFIG.sessionCookieName)?.value

    if (signedToken) {
      const [token] = signedToken.split('.')

      // Delete session from database
      await prisma.fanUserSession.deleteMany({
        where: { sessionToken: token },
      })
    }

    // Clear cookie
    cookieStore.delete(FAN_AUTH_CONFIG.sessionCookieName)
  } catch (error) {
    console.error('Logout error:', error)
  }
}

/**
 * Update fan user Spotify connection
 */
export async function updateFanUserSpotify(
  fanUserId: string,
  spotifyData: {
    spotifyUserId: string
    accessToken: string
    refreshToken: string
    expiresAt: Date
  }
) {
  await prisma.fanUser.update({
    where: { id: fanUserId },
    data: {
      spotifyUserId: spotifyData.spotifyUserId,
      spotifyAccessToken: spotifyData.accessToken,
      spotifyRefreshToken: spotifyData.refreshToken,
      spotifyTokenExpiresAt: spotifyData.expiresAt,
    },
  })
}

/**
 * Complete fan onboarding
 */
export async function completeFanOnboarding(fanUserId: string) {
  await prisma.fanUser.update({
    where: { id: fanUserId },
    data: {
      onboardingCompleted: true,
    },
  })
}
