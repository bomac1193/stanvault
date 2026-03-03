import { prisma } from '@/lib/prisma'
import { EventType, Platform, FanEvent } from '@prisma/client'
import { ACKNOWLEDGABLE_EVENT_TYPES } from './acknowledgment-templates'
import { processAcknowledgment } from './process-acknowledgment'

interface RecordFanEventParams {
  fanId: string
  eventType: EventType
  platform?: Platform
  description?: string
  metadata?: Record<string, unknown>
  occurredAt?: Date
}

/**
 * Centralized fan event recorder.
 * 1. Creates the FanEvent record
 * 2. If the event type is acknowledgable, creates an Acknowledgment (PENDING)
 * 3. Fires off acknowledgment delivery (fire-and-forget)
 */
export async function recordFanEvent(params: RecordFanEventParams): Promise<FanEvent> {
  const event = await prisma.fanEvent.create({
    data: {
      fanId: params.fanId,
      eventType: params.eventType,
      platform: params.platform,
      description: params.description,
      metadata: params.metadata as any,
      occurredAt: params.occurredAt || new Date(),
    },
  })

  // Check if this event type should trigger an acknowledgment
  if (ACKNOWLEDGABLE_EVENT_TYPES.includes(params.eventType)) {
    try {
      // Load fan to check for email
      const fan = await prisma.fan.findUnique({
        where: { id: params.fanId },
        select: { id: true, email: true, userId: true },
      })

      if (fan?.email) {
        // Check if artist has disabled this template
        const template = await prisma.acknowledgmentTemplate.findUnique({
          where: {
            userId_eventType: {
              userId: fan.userId,
              eventType: params.eventType,
            },
          },
          select: { enabled: true },
        })

        // Only skip if there's an explicit DB template that's disabled
        const enabled = template === null || template.enabled

        if (enabled) {
          const ack = await prisma.acknowledgment.create({
            data: {
              fanId: params.fanId,
              fanEventId: event.id,
              eventType: params.eventType,
              status: 'PENDING',
            },
          })

          // Fire-and-forget delivery
          processAcknowledgment(ack.id).catch((err) => {
            console.error(`[Ack] Failed to process acknowledgment ${ack.id}:`, err)
          })
        }
      }
    } catch (err) {
      // Never let acknowledgment failures block event recording
      console.error(`[Ack] Error creating acknowledgment for event ${event.id}:`, err)
    }
  }

  return event
}
