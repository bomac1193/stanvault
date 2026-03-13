const DEFAULT_APP_URL = 'http://localhost:3003'

export function getAppUrl(): string {
  return process.env.APP_URL || process.env.NEXTAUTH_URL || DEFAULT_APP_URL
}

export function buildAppUrl(path = '/'): string {
  return new URL(path, getAppUrl()).toString()
}
