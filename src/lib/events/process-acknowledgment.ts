import { prisma } from '@/lib/prisma'
import { callEchoniqCampaign } from '@/lib/echoniq'
import { resolveTokens } from './resolve-tokens'
import { getDefaultTemplate } from './acknowledgment-templates'

/**
 * Process a single acknowledgment — resolve tokens and send via Echoniq.
 */
export async function processAcknowledgment(ackId: string): Promise<void> {
  const ack = await prisma.acknowledgment.findUnique({
    where: { id: ackId },
    include: {
      fan: {
        include: { platformLinks: true, user: true },
      },
      fanEvent: true,
    },
  })

  if (!ack || ack.status !== 'PENDING') return

  const fan = ack.fan
  if (!fan.email) {
    await prisma.acknowledgment.update({
      where: { id: ackId },
      data: { status: 'SKIPPED', failureReason: 'Fan has no email' },
    })
    return
  }

  // Load artist template override or fall back to default
  const dbTemplate = await prisma.acknowledgmentTemplate.findUnique({
    where: {
      userId_eventType: {
        userId: fan.userId,
        eventType: ack.eventType,
      },
    },
  })

  if (dbTemplate && !dbTemplate.enabled) {
    await prisma.acknowledgment.update({
      where: { id: ackId },
      data: { status: 'SKIPPED', failureReason: 'Template disabled by artist' },
    })
    return
  }

  const defaultTpl = getDefaultTemplate(ack.eventType)
  const subject = dbTemplate?.subject || defaultTpl?.subject || 'A message from your artist'
  const body = dbTemplate?.messageBody || defaultTpl?.messageBody || ''

  // Resolve tokens
  const renderedSubject = resolveTokens(subject, fan)
  const renderedBody = resolveTokens(body, fan)

  try {
    const artistName = fan.user.artistName || fan.user.name || undefined
    const result = await callEchoniqCampaign({
      artistId: fan.userId,
      artistName,
      subject: renderedSubject,
      messageTemplate: renderedBody,
      testRecipientEmail: fan.email,
      dryRun: false,
    })

    if (result.ok) {
      await prisma.acknowledgment.update({
        where: { id: ackId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          messageRendered: renderedBody,
          subjectRendered: renderedSubject,
        },
      })
    } else {
      await prisma.acknowledgment.update({
        where: { id: ackId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failureReason: `Echoniq ${result.status}: ${result.responseText.slice(0, 500)}`,
          retryCount: { increment: 1 },
          messageRendered: renderedBody,
          subjectRendered: renderedSubject,
        },
      })
    }
  } catch (error) {
    await prisma.acknowledgment.update({
      where: { id: ackId },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        retryCount: { increment: 1 },
      },
    })
  }
}

/**
 * Batch retry: process all PENDING or FAILED acknowledgments with retryCount < 3.
 * Called by the daily cron.
 */
export async function processPendingAcknowledgments(): Promise<{
  processed: number
  sent: number
  failed: number
}> {
  const pending = await prisma.acknowledgment.findMany({
    where: {
      status: { in: ['PENDING', 'FAILED'] },
      retryCount: { lt: 3 },
    },
    select: { id: true },
    take: 100, // Process in batches
  })

  let sent = 0
  let failed = 0

  for (const ack of pending) {
    // Reset to PENDING before retry so processAcknowledgment picks it up
    await prisma.acknowledgment.update({
      where: { id: ack.id },
      data: { status: 'PENDING' },
    })

    try {
      await processAcknowledgment(ack.id)
      const updated = await prisma.acknowledgment.findUnique({
        where: { id: ack.id },
        select: { status: true },
      })
      if (updated?.status === 'SENT') sent++
      else failed++
    } catch {
      failed++
    }
  }

  return { processed: pending.length, sent, failed }
}
