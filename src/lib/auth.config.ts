import type { NextAuthConfig } from 'next-auth'

// Minimal auth config for middleware (no database calls)
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')
      const isOnboardingPage = nextUrl.pathname.startsWith('/onboarding')
      const isProtectedPage = nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/fans') ||
        nextUrl.pathname.startsWith('/connections') ||
        nextUrl.pathname.startsWith('/insights') ||
        nextUrl.pathname.startsWith('/export') ||
        nextUrl.pathname.startsWith('/settings')

      // Allow access to auth pages when not logged in
      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl))
        return true
      }

      // Require login for protected pages
      if (isProtectedPage || isOnboardingPage) {
        if (!isLoggedIn) return false // Redirect to login
        return true
      }

      return true
    },
  },
  providers: [], // Providers are configured in auth.ts
}
