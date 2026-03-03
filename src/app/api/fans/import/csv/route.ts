import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateStanScore } from '@/lib/scoring/stan-score'

interface CsvRow {
  name: string
  email?: string
  platform?: string
  streams?: string
  concerts?: string
  merch_purchases?: string
  notes?: string
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'))
  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ''
    })
    if (row.name) {
      rows.push(row as unknown as CsvRow)
    }
  }

  return rows
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const rows = parseCsv(text)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV is empty or missing header row' }, { status: 400 })
    }

    const results = { created: 0, skipped: 0, errors: 0 }

    for (const row of rows) {
      try {
        const now = new Date()
        const streams = parseInt(row.streams || '0', 10) || 0
        const concerts = parseInt(row.concerts || '0', 10) || 0
        const merchPurchases = parseInt(row.merch_purchases || '0', 10) || 0

        // Build platform links for scoring
        const platformLinks = []
        if (streams > 0 || row.platform?.toUpperCase() === 'SPOTIFY') {
          platformLinks.push({
            platform: 'SPOTIFY' as const,
            streams,
            saves: 0,
          })
        }
        if (merchPurchases > 0) {
          platformLinks.push({
            platform: 'MERCH' as const,
            purchaseCount: merchPurchases,
          })
        }

        const scoreResult = calculateStanScore({
          platformLinks: platformLinks as any,
          firstSeenAt: now,
          lastActiveAt: now,
        })

        const fan = await prisma.fan.create({
          data: {
            userId,
            displayName: row.name,
            email: row.email || null,
            stanScore: scoreResult.totalScore,
            tier: scoreResult.tier,
            convictionScore: scoreResult.convictionScore,
            platformScore: scoreResult.platformScore,
            engagementScore: scoreResult.engagementScore,
            longevityScore: scoreResult.longevityScore,
            recencyScore: scoreResult.recencyScore,
            firstSeenAt: now,
            lastActiveAt: now,
            notes: row.notes || null,
          },
        })

        // Create platform links
        if (streams > 0) {
          await prisma.fanPlatformLink.create({
            data: {
              fanId: fan.id,
              platform: 'SPOTIFY',
              streams,
            },
          })
        }

        // Add concert proofs
        if (concerts > 0) {
          await prisma.fanProof.create({
            data: {
              fanId: fan.id,
              proofType: 'CONCERT_TICKET',
              description: `${concerts} concert(s) attended (imported via CSV)`,
            },
          })
        }

        // Add merch proofs
        if (merchPurchases > 0) {
          await prisma.fanProof.create({
            data: {
              fanId: fan.id,
              proofType: 'MERCH_RECEIPT',
              description: `${merchPurchases} merch purchase(s) (imported via CSV)`,
            },
          })
        }

        results.created++
      } catch (err) {
        console.error('CSV row import error:', err)
        results.errors++
      }
    }

    return NextResponse.json({
      message: `Imported ${results.created} fans`,
      ...results,
      total: rows.length,
    })
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
