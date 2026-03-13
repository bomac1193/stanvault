import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { FAN_AUTH_CONFIG } from './config'
import { FanBetaCohort, AcquisitionChannel, ConnectionStatus, Platform } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes, createHmac } from 'crypto'

const SESSION_SECRET = process.env.AUTH_SECRET || 'fan-session-secret'

interface FanUserSession {
  id: string
  email: string
  displayName: string
  avatarUrl?: string | null
  spotifyUserId?: string | null
  spotifyConnected: boolean
  connectedPlatforms: Platform[]
  onboardingCompleted: boolean
}

type SessionPlatformConnection = {
  platform: Platform
  platformUserId: string | null
  status: ConnectionStatus
}

type FanSessionSource = {
  id: string
  email: string
  displayName: string
  avatarUrl?: string | null
  spotifyUserId?: string | null
  onboardingCompleted: boolean
  platformConnections?: SessionPlatformConnection[]
}

interface FanPlatformConnectionInput {
  platformUserId?: string | null
  accessToken?: string | null
  refreshToken?: string | null
  expiresAt?: Date | null
  scope?: string | null
  status?: ConnectionStatus
  lastSyncAt?: Date | null
  syncError?: string | null
}

interface FanPlatformCredentials {
  platform: Platform
  platformUserId: string | null
  accessToken: string | null
  refreshToken: string | null
  tokenExpiresAt: Date | null
  platformScope: string | null
  status: ConnectionStatus
  lastSyncAt: Date | null
  syncError: string | null
}

function getConnectedPlatforms(
  platformConnections: SessionPlatformConnection[] = [],
  legacySpotifyUserId?: string | null
): Platform[] {
  const connected = new Set<Platform>()

  for (const connection of platformConnections) {
    if (connection.status === ConnectionStatus.CONNECTED) {
      connected.add(connection.platform)
    }
  }

  if (legacySpotifyUserId) {
    connected.add(Platform.SPOTIFY)
  }

  return Array.from(connected)
}

function getSpotifyPlatformUserId(
  platformConnections: SessionPlatformConnection[] = [],
  legacySpotifyUserId?: string | null
): string | null {
  const spotifyConnection = platformConnections.find(
    (connection) =>
      connection.platform === Platform.SPOTIFY &&
      connection.status === ConnectionStatus.CONNECTED &&
      connection.platformUserId
  )

  return spotifyConnection?.platformUserId || legacySpotifyUserId || null
}

function buildFanUserSession(user: FanSessionSource): FanUserSession {
  const connectedPlatforms = getConnectedPlatforms(user.platformConnections, user.spotifyUserId)
  const spotifyUserId = getSpotifyPlatformUserId(user.platformConnections, user.spotifyUserId)

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    spotifyUserId,
    spotifyConnected: connectedPlatforms.includes(Platform.SPOTIFY),
    connectedPlatforms,
    onboardingCompleted: user.onboardingCompleted,
  }
}

/**
 * Create a new fan user
 */
export async function createFanUser(
  email: string,
  password: string,
  displayName: string,
  betaData?: {
    betaCohort?: FanBetaCohort
    acquisitionChannel?: AcquisitionChannel
    betaInviteCode?: string
  }
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
        ...(betaData?.betaCohort ? { betaCohort: betaData.betaCohort } : {}),
        ...(betaData?.acquisitionChannel ? { acquisitionChannel: betaData.acquisitionChannel } : {}),
        ...(betaData?.betaInviteCode ? { betaInviteCode: betaData.betaInviteCode } : {}),
        ...(betaData?.betaCohort ? { betaJoinedAt: new Date() } : {}),
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
      include: {
        platformConnections: {
          select: {
            platform: true,
            platformUserId: true,
            status: true,
          },
        },
      },
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
      user: buildFanUserSession(user),
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
      include: {
        fanUser: {
          include: {
            platformConnections: {
              select: {
                platform: true,
                platformUserId: true,
                status: true,
              },
            },
          },
        },
      },
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

    return buildFanUserSession(session.fanUser)
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

export async function upsertFanPlatformConnection(
  fanUserId: string,
  platform: Platform,
  connection: FanPlatformConnectionInput
) {
  const connectionData = {
    accessToken: connection.accessToken ?? null,
    refreshToken: connection.refreshToken ?? null,
    tokenExpiresAt: connection.expiresAt ?? null,
    platformUserId: connection.platformUserId ?? null,
    platformScope: connection.scope ?? null,
    status: connection.status ?? ConnectionStatus.CONNECTED,
    lastSyncAt: connection.lastSyncAt ?? new Date(),
    syncError: connection.syncError ?? null,
  }

  return prisma.$transaction(async (tx) => {
    const platformConnection = await tx.fanPlatformConnection.upsert({
      where: {
        fanUserId_platform: {
          fanUserId,
          platform,
        },
      },
      update: connectionData,
      create: {
        fanUserId,
        platform,
        ...connectionData,
      },
    })

    if (platform === Platform.SPOTIFY) {
      await tx.fanUser.update({
        where: { id: fanUserId },
        data: {
          spotifyUserId: connectionData.platformUserId,
          spotifyAccessToken: connectionData.accessToken,
          spotifyRefreshToken: connectionData.refreshToken,
          spotifyTokenExpiresAt: connectionData.tokenExpiresAt,
        },
      })
    }

    return platformConnection
  })
}

export async function getFanPlatformConnection(
  fanUserId: string,
  platform: Platform
): Promise<FanPlatformCredentials | null> {
  const connection = await prisma.fanPlatformConnection.findUnique({
    where: {
      fanUserId_platform: {
        fanUserId,
        platform,
      },
    },
  })

  if (connection) {
    return {
      platform: connection.platform,
      platformUserId: connection.platformUserId,
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
      tokenExpiresAt: connection.tokenExpiresAt,
      platformScope: connection.platformScope,
      status: connection.status,
      lastSyncAt: connection.lastSyncAt,
      syncError: connection.syncError,
    }
  }

  if (platform !== Platform.SPOTIFY) {
    return null
  }

  const legacySpotifyConnection = await prisma.fanUser.findUnique({
    where: { id: fanUserId },
    select: {
      spotifyUserId: true,
      spotifyAccessToken: true,
      spotifyRefreshToken: true,
      spotifyTokenExpiresAt: true,
    },
  })

  if (!legacySpotifyConnection) {
    return null
  }

  const hasLegacySpotifyData =
    !!legacySpotifyConnection.spotifyUserId || !!legacySpotifyConnection.spotifyAccessToken

  if (!hasLegacySpotifyData) {
    return null
  }

  return {
    platform,
    platformUserId: legacySpotifyConnection.spotifyUserId,
    accessToken: legacySpotifyConnection.spotifyAccessToken,
    refreshToken: legacySpotifyConnection.spotifyRefreshToken,
    tokenExpiresAt: legacySpotifyConnection.spotifyTokenExpiresAt,
    platformScope: null,
    status: ConnectionStatus.CONNECTED,
    lastSyncAt: null,
    syncError: null,
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
  await upsertFanPlatformConnection(fanUserId, Platform.SPOTIFY, {
    platformUserId: spotifyData.spotifyUserId,
    accessToken: spotifyData.accessToken,
    refreshToken: spotifyData.refreshToken,
    expiresAt: spotifyData.expiresAt,
    status: ConnectionStatus.CONNECTED,
    lastSyncAt: new Date(),
    syncError: null,
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
