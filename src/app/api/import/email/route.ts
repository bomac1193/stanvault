import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { importEmailSubscribers } from '@/lib/import/email-import'

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''

    let csvContent: string

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 10MB.' },
          { status: 400 }
        )
      }

      if (!file.name.toLowerCase().endsWith('.csv')) {
        return NextResponse.json(
          { error: 'Only CSV files are supported' },
          { status: 400 }
        )
      }

      csvContent = await file.text()
    } else if (contentType.includes('application/json')) {
      // Handle JSON with CSV content
      const body = await request.json()
      csvContent = body.csvContent

      if (!csvContent || typeof csvContent !== 'string') {
        return NextResponse.json(
          { error: 'csvContent is required' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type. Use multipart/form-data or application/json.' },
        { status: 400 }
      )
    }

    // Import subscribers
    const result = await importEmailSubscribers(session.user.id, csvContent)

    return NextResponse.json({
      success: result.success,
      provider: result.provider,
      stats: {
        totalRows: result.totalRows,
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
      },
      errors: result.errors.slice(0, 10), // Return first 10 errors only
      hasMoreErrors: result.errors.length > 10,
    })
  } catch (error) {
    console.error('Email import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
