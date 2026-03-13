export type AdminPreviewMode = 'real' | 'demo'

export const ADMIN_PREVIEW_COOKIE = 'imprint_admin_preview'

export function isAdminEmail(email?: string | null): boolean {
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  if (!email) {
    return false
  }

  return admins.includes(email.toLowerCase())
}

export function resolveAdminPreviewMode(
  cookieValue?: string | null,
  isAdmin: boolean = false
): AdminPreviewMode {
  if (!isAdmin) {
    return 'real'
  }

  return cookieValue === 'demo' ? 'demo' : 'real'
}
