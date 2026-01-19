import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const profileSchema = z.object({
  artistName: z.string().min(1),
  genre: z.string().min(1),
  careerStage: z.enum(['EMERGING', 'GROWING', 'ESTABLISHED', 'VETERAN']),
  location: z.string().optional(),
})

const stepSchema = z.object({
  step: z.number().min(1).max(4),
})

const completeSchema = z.object({
  complete: z.literal(true),
})

// Update profile or step
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Check if it's a profile update
    const profileResult = profileSchema.safeParse(body)
    if (profileResult.success) {
      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          artistName: profileResult.data.artistName,
          genre: profileResult.data.genre,
          careerStage: profileResult.data.careerStage,
          location: profileResult.data.location,
          onboardingStep: 3,
        },
      })
      return NextResponse.json({ success: true, user })
    }

    // Check if it's a step update
    const stepResult = stepSchema.safeParse(body)
    if (stepResult.success) {
      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: { onboardingStep: stepResult.data.step },
      })
      return NextResponse.json({ success: true, user })
    }

    // Check if it's completing onboarding
    const completeResult = completeSchema.safeParse(body)
    if (completeResult.success) {
      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          onboardingCompleted: true,
          onboardingStep: 4,
        },
      })
      return NextResponse.json({ success: true, user })
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  } catch (error) {
    console.error('Onboarding update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get current onboarding status
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        artistName: true,
        genre: true,
        careerStage: true,
        location: true,
        onboardingStep: true,
        onboardingCompleted: true,
        platformConnections: {
          select: {
            platform: true,
            fanCount: true,
            status: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Onboarding fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
