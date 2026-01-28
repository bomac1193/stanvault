import { NextResponse } from 'next/server'
import { getFanUser } from '@/lib/fan-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getFanUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get fan's artist relationships
    const relationships = await prisma.fanUserArtistLink.findMany({
      where: { fanUserId: user.id },
      include: {
        artist: {
          select: {
            id: true,
            artistName: true,
            image: true,
            genre: true,
          },
        },
      },
      orderBy: { stanScore: 'desc' },
    })

    // Get fan user details
    const fanUser = await prisma.fanUser.findUnique({
      where: { id: user.id },
      select: {
        spotifyUserId: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    // Calculate total identity stats
    const totalArtists = relationships.length
    const totalScore = relationships.reduce((sum, r) => sum + r.stanScore, 0)
    const superfanCount = relationships.filter(r => r.tier === 'SUPERFAN').length
    const verifiedCount = relationships.filter(r => r.verified).length

    return NextResponse.json({
      user: {
        id: user.id,
        displayName: fanUser?.displayName,
        avatarUrl: fanUser?.avatarUrl,
        spotifyConnected: !!fanUser?.spotifyUserId,
        memberSince: fanUser?.createdAt,
      },
      stats: {
        totalArtists,
        totalScore,
        superfanCount,
        verifiedCount,
        avgScore: totalArtists > 0 ? Math.round(totalScore / totalArtists) : 0,
      },
      relationships: relationships.map(r => ({
        id: r.id,
        artist: {
          id: r.artistId,
          name: r.artist.artistName || 'Unknown Artist',
          image: r.artist.image,
          genre: r.artist.genre,
        },
        tier: r.tier,
        stanScore: r.stanScore,
        totalStreams: r.totalStreams,
        savedTracks: r.savedTracks,
        isFollowing: r.isFollowing,
        verified: r.verified,
        verifiedAt: r.verifiedAt,
        firstSeenAt: r.firstSeenAt,
        lastActiveAt: r.lastActiveAt,
      })),
    })
  } catch (error) {
    console.error('Fan dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
