import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      artistName?: string
      spotifyArtistId?: string
      onboardingCompleted: boolean
      onboardingStep: number
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    artistName?: string
    spotifyArtistId?: string
    onboardingCompleted?: boolean
    onboardingStep?: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    artistName?: string
    spotifyArtistId?: string
    onboardingCompleted?: boolean
    onboardingStep?: number
  }
}
