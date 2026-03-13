import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ConnectionStatus, Platform } from '@prisma/client'
import {
  getDiscordAccountProfile,
  getDiscordGuilds,
  getValidDiscordAccessToken,
  summarizeDiscordGuilds,
} from '@/lib/discord'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = await getValidDiscordAccessToken(session.user.id)
    if (!accessToken) {
      return NextResponse.json({ error: 'Discord not connected' }, { status: 400 })
    }

    const profile = await getDiscordAccountProfile(accessToken)
    const guilds = await getDiscordGuilds(accessToken)
    const guildSummary = summarizeDiscordGuilds(guilds)

    await prisma.platformConnection.update({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: Platform.DISCORD,
        },
      },
      data: {
        platformUserId: profile.id,
        fanCount: guildSummary.managedMembers,
        lastSyncAt: new Date(),
        status: ConnectionStatus.CONNECTED,
        syncError: null,
      },
    })

    return NextResponse.json({
      success: true,
      platform: Platform.DISCORD,
      fanCount: guildSummary.managedMembers,
      accountName: profile.displayName,
      stats: guildSummary,
      guilds: guilds.slice(0, 20).map((guild) => ({
        id: guild.id,
        name: guild.name,
        owner: Boolean(guild.owner),
        approximateMemberCount: guild.approximate_member_count || 0,
      })),
    })
  } catch (error) {
    console.error('Discord sync error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Discord sync failed'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
