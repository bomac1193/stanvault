// Fan Portal Authentication Configuration

export const FAN_AUTH_CONFIG = {
  sessionCookieName: 'fan_session',
  sessionMaxAge: 30 * 24 * 60 * 60, // 30 days in seconds

  // Routes
  loginPage: '/fan/login',
  registerPage: '/fan/register',
  onboardingPage: '/fan/onboarding',
  dashboardPage: '/fan/dashboard',

  // Protected route prefixes
  protectedPrefixes: ['/fan/dashboard', '/fan/settings', '/fan/tokens'],
}

export const FAN_SPOTIFY_SCOPES = [
  'user-read-recently-played',
  'user-library-read',
  'user-follow-read',
  'user-top-read',
  'user-read-email',
  'user-read-private',
]
