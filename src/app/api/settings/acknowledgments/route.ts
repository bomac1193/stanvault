import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EventType } from '@prisma/client'
import { ACKNOWLEDGABLE_EVENT_TYPES, DEFAULT_TEMPLATES } from '@/lib/events'

/**
 * GET: Return artist's templates merged with defaults for all acknowledgable event types.
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load artist's custom templates
    const dbTemplates = await prisma.acknowledgmentTemplate.findMany({
      where: { userId: session.user.id },
    })

    const dbMap = new Map(dbTemplates.map((t) => [t.eventType, t]))

    // Merge with defaults
    const templates = ACKNOWLEDGABLE_EVENT_TYPES.map((eventType) => {
      const db = dbMap.get(eventType)
      const def = DEFAULT_TEMPLATES[eventType]

      return {
        eventType,
        enabled: db?.enabled ?? true,
        subject: db?.subject ?? def?.subject ?? '',
        messageBody: db?.messageBody ?? def?.messageBody ?? '',
        deliveryMode: db?.deliveryMode ?? 'email',
        isCustomized: !!db,
      }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Acknowledgment templates GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT: Upsert a template for a specific event type.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { eventType, enabled, subject, messageBody } = body

    if (!eventType || !ACKNOWLEDGABLE_EVENT_TYPES.includes(eventType as EventType)) {
      return NextResponse.json(
        { error: `Invalid event type. Valid: ${ACKNOWLEDGABLE_EVENT_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const def = DEFAULT_TEMPLATES[eventType as string]

    const template = await prisma.acknowledgmentTemplate.upsert({
      where: {
        userId_eventType: {
          userId: session.user.id,
          eventType: eventType as EventType,
        },
      },
      update: {
        enabled: enabled ?? true,
        subject: subject ?? def?.subject ?? '',
        messageBody: messageBody ?? def?.messageBody ?? '',
      },
      create: {
        userId: session.user.id,
        eventType: eventType as EventType,
        enabled: enabled ?? true,
        subject: subject ?? def?.subject ?? '',
        messageBody: messageBody ?? def?.messageBody ?? '',
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Acknowledgment templates PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
