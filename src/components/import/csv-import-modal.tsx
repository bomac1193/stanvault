'use client'

import { useState, useCallback } from 'react'
import { Upload, X, FileText, Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui'

interface CsvImportModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CsvImportModal({ open, onClose, onSuccess }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string[][] | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; errors: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setResult(null)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      const rows = lines.slice(0, 6).map((line) => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        for (const char of line) {
          if (char === '"') inQuotes = !inQuotes
          else if (char === ',' && !inQuotes) { result.push(current.trim()); current = '' }
          else current += char
        }
        result.push(current.trim())
        return result
      })
      setPreview(rows)
    }
    reader.readAsText(f)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) {
      handleFile(f)
    } else {
      setError('Please drop a .csv file')
    }
  }, [handleFile])

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/fans/import/csv', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Import failed')
      } else {
        setResult(data)
        onSuccess?.()
      }
    } catch {
      setError('Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
          <h2 className="text-lg font-medium text-white">Import Fans from CSV</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Drop zone */}
          {!file && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver ? 'border-accent bg-accent/5' : 'border-[#1a1a1a]'
              }`}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-gray-500" />
              <p className="text-sm text-gray-500 mb-2">
                Drag & drop a CSV file, or{' '}
                <label className="text-accent cursor-pointer hover:underline">
                  browse
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFile(f)
                    }}
                  />
                </label>
              </p>
              <p className="text-xs text-gray-600">
                Required columns: name. Optional: email, platform, streams, concerts, merch_purchases, notes
              </p>
            </div>
          )}

          {/* File info */}
          {file && !result && (
            <div className="flex items-center gap-3 p-3 bg-[#141414] rounded">
              <FileText className="w-5 h-5 text-accent shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={reset} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Preview table */}
          {preview && !result && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {preview[0]?.map((h, i) => (
                      <th key={i} className="text-left p-2 text-gray-400 border-b border-[#1a1a1a] font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="p-2 text-gray-300 border-b border-[#1a1a1a]/50">
                          {cell || <span className="text-gray-600">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 6 && (
                <p className="text-xs text-gray-600 mt-2">Showing first 5 rows...</p>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="text-center py-4">
              <Check className="w-10 h-10 text-status-success mx-auto mb-3" />
              <p className="text-lg text-white font-medium mb-1">
                {result.created} fan{result.created !== 1 ? 's' : ''} imported
              </p>
              {result.errors > 0 && (
                <p className="text-sm text-status-error">
                  {result.errors} row{result.errors !== 1 ? 's' : ''} failed
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-status-error/10 border border-status-error/30 rounded text-sm text-status-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-[#1a1a1a]">
          {result ? (
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={!file || importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Importing...
                  </>
                ) : (
                  'Import'
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
