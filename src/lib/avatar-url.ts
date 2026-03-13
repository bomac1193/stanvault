const PROXYABLE_AVATAR_HOST_SUFFIXES = [
  '.ggpht.com',
  '.googleusercontent.com',
]

const PROXYABLE_AVATAR_HOSTS = new Set([
  'yt3.ggpht.com',
  'lh3.googleusercontent.com',
])

export function normalizeAvatarSource(src?: string | null): string | null {
  if (!src) {
    return null
  }

  const trimmed = src.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }

  return trimmed
}

export function isProxyableAvatarHost(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase()

  if (PROXYABLE_AVATAR_HOSTS.has(normalizedHostname)) {
    return true
  }

  return PROXYABLE_AVATAR_HOST_SUFFIXES.some(
    (suffix) => normalizedHostname === suffix.slice(1) || normalizedHostname.endsWith(suffix)
  )
}

export function getRenderableAvatarUrl(src?: string | null): string | null {
  const normalized = normalizeAvatarSource(src)
  if (!normalized) {
    return null
  }

  if (
    normalized.startsWith('/') ||
    normalized.startsWith('data:') ||
    normalized.startsWith('blob:')
  ) {
    return normalized
  }

  try {
    const url = new URL(normalized)
    if (isProxyableAvatarHost(url.hostname)) {
      return `/api/images/avatar?url=${encodeURIComponent(url.toString())}`
    }

    return url.toString()
  } catch {
    return normalized
  }
}
