import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isProxyableAvatarHost, normalizeAvatarSource } from '@/lib/avatar-url'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const source = normalizeAvatarSource(request.nextUrl.searchParams.get('url'))
    if (!source) {
      return NextResponse.json({ error: 'Missing avatar URL' }, { status: 400 })
    }

    let sourceUrl: URL
    try {
      sourceUrl = new URL(source)
    } catch {
      return NextResponse.json({ error: 'Invalid avatar URL' }, { status: 400 })
    }

    if (!['https:', 'http:'].includes(sourceUrl.protocol)) {
      return NextResponse.json({ error: 'Unsupported avatar URL' }, { status: 400 })
    }

    if (!isProxyableAvatarHost(sourceUrl.hostname)) {
      return NextResponse.json({ error: 'Avatar host is not allowed' }, { status: 400 })
    }

    const upstream = await fetch(sourceUrl.toString(), {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; ImprintAvatarProxy/1.0)',
      },
      redirect: 'follow',
    })

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'Failed to fetch avatar' }, { status: 502 })
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    const contentLength = upstream.headers.get('content-length')
    const response = new NextResponse(upstream.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=86400, stale-while-revalidate=604800',
      },
    })

    if (contentLength) {
      response.headers.set('Content-Length', contentLength)
    }

    return response
  } catch (error) {
    console.error('Avatar proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
