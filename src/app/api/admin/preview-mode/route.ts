import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  ADMIN_PREVIEW_COOKIE,
  AdminPreviewMode,
  isAdminEmail,
  resolveAdminPreviewMode,
} from '@/lib/admin'

function parseMode(value: unknown): AdminPreviewMode {
  return value === 'demo' ? 'demo' : 'real'
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = isAdminEmail(session.user.email)
  const mode = resolveAdminPreviewMode(
    request.cookies.get(ADMIN_PREVIEW_COOKIE)?.value,
    isAdmin
  )

  return NextResponse.json({ isAdmin, mode })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const mode = parseMode(body.mode)

  const response = NextResponse.json({ success: true, mode })
  response.cookies.set(ADMIN_PREVIEW_COOKIE, mode, {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  })

  return response
}
