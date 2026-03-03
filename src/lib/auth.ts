import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authConfig } from './auth.config'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(parsed.data.password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        if (session.name !== undefined) token.name = session.name
      }

      // Fetch user data on each request to get latest onboarding status
      // NOTE: image is NOT stored in the JWT (too large for cookies — causes 431).
      // The client fetches it via /api/settings/profile or session.user.id.
      if (token.id || token.email) {
        let dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            artistName: true,
            spotifyArtistId: true,
            onboardingCompleted: true,
            onboardingStep: true,
          },
        })
        // Fall back to email lookup if ID is stale (e.g. DB was reseeded)
        if (!dbUser && token.email) {
          dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: {
              id: true,
              artistName: true,
              spotifyArtistId: true,
              onboardingCompleted: true,
              onboardingStep: true,
            },
          })
          if (dbUser) {
            token.id = dbUser.id // Fix the stale ID
          }
        }
        if (dbUser) {
          token.picture = null // Never store image in JWT
          token.artistName = dbUser.artistName
          token.spotifyArtistId = dbUser.spotifyArtistId
          token.onboardingCompleted = dbUser.onboardingCompleted
          token.onboardingStep = dbUser.onboardingStep
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.image = (token.picture as string) || null
        session.user.artistName = token.artistName as string | undefined
        session.user.spotifyArtistId = token.spotifyArtistId as string | undefined
        session.user.onboardingCompleted = token.onboardingCompleted as boolean
        session.user.onboardingStep = token.onboardingStep as number
      }
      return session
    },
  },
})
