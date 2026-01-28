'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Download,
  ArrowLeft,
  FileJson,
  Key,
  ShieldCheck,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  History,
  Info,
} from 'lucide-react'

type ExportFormat = 'json' | 'jwt' | 'w3c-vc'

interface ExportResult {
  format: ExportFormat
  exportId: string
  token?: string
  data?: object
  credential?: object
  signature?: string
  verifyUrl?: string
  expiresAt?: string
}

interface ExportHistoryItem {
  id: string
  format: string
  artistCount: number
  exportedAt: string
}

const formatOptions: Array<{
  id: ExportFormat
  name: string
  description: string
  icon: typeof FileJson
  badge?: string
}> = [
  {
    id: 'json',
    name: 'JSON',
    description: 'Standard JSON format with signature. Works with any system.',
    icon: FileJson,
  },
  {
    id: 'jwt',
    name: 'Signed Token (JWT)',
    description: 'Compact signed token format. Ideal for APIs and integrations.',
    icon: Key,
  },
  {
    id: 'w3c-vc',
    name: 'Verifiable Credential',
    description: 'W3C standard format. Future-proof and decentralized.',
    icon: ShieldCheck,
    badge: 'Recommended',
  },
]

export default function FanExportPage() {
  const router = useRouter()
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('w3c-vc')
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<ExportHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)
    setExportResult(null)

    try {
      const res = await fetch(`/api/fan/export?format=${selectedFormat}`)

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/fan/login')
          return
        }
        const data = await res.json()
        throw new Error(data.error || 'Export failed')
      }

      const data = await res.json()
      setExportResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopy = async () => {
    if (!exportResult) return

    let content: string
    if (exportResult.format === 'jwt' && exportResult.token) {
      content = exportResult.token
    } else if (exportResult.format === 'w3c-vc' && exportResult.credential) {
      content = JSON.stringify(exportResult.credential, null, 2)
    } else if (exportResult.data) {
      content = JSON.stringify(exportResult.data, null, 2)
    } else {
      return
    }

    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  const handleDownload = () => {
    if (!exportResult) return

    let content: string
    let filename: string

    if (exportResult.format === 'jwt' && exportResult.token) {
      content = exportResult.token
      filename = `fan-identity-${exportResult.exportId}.jwt`
    } else if (exportResult.format === 'w3c-vc' && exportResult.credential) {
      content = JSON.stringify(exportResult.credential, null, 2)
      filename = `fan-identity-${exportResult.exportId}.vc.json`
    } else if (exportResult.data) {
      content = JSON.stringify(
        { data: exportResult.data, signature: exportResult.signature },
        null,
        2
      )
      filename = `fan-identity-${exportResult.exportId}.json`
    } else {
      return
    }

    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const loadHistory = async () => {
    setShowHistory(true)
    setLoadingHistory(true)

    try {
      const res = await fetch('/api/fan/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'history' }),
      })

      if (res.ok) {
        const data = await res.json()
        setHistory(data.exports || [])
      }
    } catch {
      // Ignore errors for history
    } finally {
      setLoadingHistory(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-vault-black">
      {/* Header */}
      <header className="border-b border-vault-gray/60">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link
            href="/fan/dashboard"
            className="inline-flex items-center gap-2 text-vault-muted hover:text-warm-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="nav-item">Back to Dashboard</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-warm-white">Export Your Fan Identity</h1>
              <p className="text-vault-muted">
                Take your fan data anywhere
              </p>
            </div>
            <button
              onClick={loadHistory}
              className="flex items-center gap-2 text-sm text-vault-muted hover:text-warm-white transition-colors"
            >
              <History className="w-4 h-4" />
              Export History
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-status-error/10 border border-status-error rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0" />
            <p className="text-status-error">{error}</p>
          </div>
        )}

        {/* Info Card */}
        <div className="mb-8 p-4 bg-gold/5 border border-gold/20 rounded-lg flex gap-4">
          <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-warm-white mb-1">Portable Fan Identity</h3>
            <p className="text-sm text-vault-muted">
              Your fan data belongs to you. Export your verified listening history,
              artist relationships, and fan scores in industry-standard formats.
              Use it to prove your fandom anywhere - ticket presales, Discord servers,
              merch drops, or other platforms.
            </p>
          </div>
        </div>

        {!exportResult ? (
          <>
            {/* Format Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-warm-white mb-4">Choose Export Format</h2>
              <div className="space-y-3">
                {formatOptions.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`w-full p-4 rounded-lg border text-left transition-colors ${
                      selectedFormat === format.id
                        ? 'bg-gold/10 border-gold'
                        : 'bg-vault-dark border-vault-gray hover:border-vault-muted'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-lg ${
                          selectedFormat === format.id ? 'bg-gold/20' : 'bg-vault-darker'
                        }`}
                      >
                        <format.icon
                          className={`w-5 h-5 ${
                            selectedFormat === format.id ? 'text-gold' : 'text-vault-muted'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`font-medium ${
                              selectedFormat === format.id ? 'text-gold' : 'text-warm-white'
                            }`}
                          >
                            {format.name}
                          </h3>
                          {format.badge && (
                            <span className="px-2 py-0.5 text-xs bg-gold/20 text-gold rounded-full">
                              {format.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-vault-muted mt-1">{format.description}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedFormat === format.id
                            ? 'border-gold bg-gold'
                            : 'border-vault-muted'
                        }`}
                      >
                        {selectedFormat === format.id && (
                          <Check className="w-3 h-3 text-vault-black" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* What's Included */}
            <div className="mb-8 p-4 bg-vault-dark border border-vault-gray/60 rounded-md">
              <h3 className="font-medium text-warm-white mb-3">What&apos;s included in your export:</h3>
              <ul className="space-y-2 text-sm text-vault-muted">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success" />
                  Your fan profile and member since date
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success" />
                  All artist relationships with tier and score
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success" />
                  Listening stats (streams, saves, playlist adds)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success" />
                  Verification status and timestamps
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success" />
                  Cryptographic signature for authenticity
                </li>
              </ul>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-4 bg-gold text-vault-black font-semibold rounded-md hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Export...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export My Fan Identity
                </>
              )}
            </button>
          </>
        ) : (
          <>
            {/* Export Result */}
            <div className="mb-6 p-4 bg-status-success/10 border border-status-success rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-status-success" />
                <span className="font-medium text-status-success">Export Generated Successfully</span>
              </div>
              <p className="text-sm text-vault-muted">
                Your fan identity has been exported in {exportResult.format.toUpperCase()} format.
              </p>
            </div>

            {/* Export Preview */}
            <div className="mb-6 bg-vault-dark border border-vault-gray/60 rounded-md overflow-hidden">
              <div className="px-4 py-3 border-b border-vault-gray/60 flex items-center justify-between">
                <span className="text-sm font-medium text-warm-white">
                  {exportResult.format === 'jwt'
                    ? 'Signed Token'
                    : exportResult.format === 'w3c-vc'
                    ? 'Verifiable Credential'
                    : 'JSON Export'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 text-vault-muted hover:text-warm-white transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-status-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 text-vault-muted hover:text-warm-white transition-colors"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-80 overflow-auto">
                <pre className="text-xs font-mono text-vault-muted whitespace-pre-wrap break-all">
                  {exportResult.format === 'jwt' && exportResult.token
                    ? exportResult.token
                    : JSON.stringify(
                        exportResult.credential || exportResult.data,
                        null,
                        2
                      )}
                </pre>
              </div>
            </div>

            {/* Verification Link */}
            {exportResult.verifyUrl && (
              <div className="mb-6 p-4 bg-vault-dark border border-vault-gray/60 rounded-md">
                <p className="text-sm text-vault-muted mb-2">
                  Anyone can verify this export at:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-vault-darker rounded text-sm text-warm-white font-mono truncate">
                    {exportResult.verifyUrl}
                  </code>
                  <a
                    href={exportResult.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gold hover:text-gold/80 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setExportResult(null)}
                className="flex-1 py-3 bg-vault-gray text-warm-white font-medium rounded-lg hover:bg-vault-muted/20 transition-colors"
              >
                Export Another Format
              </button>
              <Link
                href="/fan/dashboard"
                className="flex-1 py-3 bg-gold text-vault-black font-medium rounded-md hover:bg-gold-light transition-colors text-center"
              >
                Back to Dashboard
              </Link>
            </div>
          </>
        )}
      </main>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-vault-dark border border-vault-gray/60 rounded-md w-full max-w-md">
            <div className="px-6 py-4 border-b border-vault-gray/60 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-warm-white">Export History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-vault-muted hover:text-warm-white"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-gold animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-center text-vault-muted py-8">No previous exports</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-vault-darker rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-warm-white">
                          {item.format.toUpperCase()} Export
                        </p>
                        <p className="text-xs text-vault-muted">
                          {item.artistCount} artists • {formatDate(item.exportedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-vault-gray/60">
              <button
                onClick={() => setShowHistory(false)}
                className="w-full py-2 text-vault-muted hover:text-warm-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
