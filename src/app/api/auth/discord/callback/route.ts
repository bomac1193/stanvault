import { NextRequest, NextResponse } from 'next/server'
import {
  exchangeDiscordCodeForTokens,
  getDiscordAccountProfile,
  getDiscordGuilds,
  storeDiscordConnection,
  summarizeDiscordGuilds,
} from '@/lib/discord'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/connections?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/connections?error=missing_params', request.url)
      )
    }

    let stateData: { userId: string; nonce: string; timestamp: number }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    } catch {
      return NextResponse.redirect(
        new URL('/connections?error=invalid_state', request.url)
      )
    }

    const maxAge = 15 * 60 * 1000
    if (Date.now() - stateData.timestamp > maxAge) {
      return NextResponse.redirect(
        new URL('/connections?error=state_expired', request.url)
      )
    }

    const tokens = await exchangeDiscordCodeForTokens(code, 'artist')
    const profile = await getDiscordAccountProfile(tokens.access_token)
    const guilds = await getDiscordGuilds(tokens.access_token)
    const guildSummary = summarizeDiscordGuilds(guilds)

    await storeDiscordConnection(stateData.userId, tokens, profile, guildSummary)

    return NextResponse.redirect(
      new URL('/connections?success=discord_connected', request.url)
    )
  } catch (error) {
    console.error('Discord callback error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.redirect(
      new URL(`/connections?error=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}
