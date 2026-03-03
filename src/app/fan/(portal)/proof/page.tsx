'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Upload, Loader2, Check, AlertCircle } from 'lucide-react'

const PROOF_TYPES = [
  { value: 'CONCERT_TICKET', label: 'Concert Ticket' },
  { value: 'MERCH_RECEIPT', label: 'Merch Receipt' },
  { value: 'ALBUM_PURCHASE', label: 'Album Purchase' },
  { value: 'SCREENSHOT', label: 'Screenshot / Evidence' },
  { value: 'OTHER', label: 'Other' },
]

interface ArtistLink {
  artistId: string
  artistName: string
  fanRecordId: string | null
}

export default function FanProofPage() {
  const router = useRouter()
  const [artists, setArtists] = useState<ArtistLink[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedArtist, setSelectedArtist] = useState('')
  const [proofType, setProofType] = useState('CONCERT_TICKET')
  const [proofUrl, setProofUrl] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetch('/api/fan/artists')
      .then((r) => r.json())
      .then((data) => {
        setArtists(data.artists || [])
        if (data.artists?.length > 0) {
          setSelectedArtist(data.artists[0].fanRecordId || '')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedArtist) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/fans/${selectedArtist}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofType,
          proofUrl: proofUrl || null,
          description: description || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit proof')
      }

      setSuccess(true)
      setProofUrl('')
      setDescription('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-medium text-warm-white" style={{ fontFamily: 'Canela, serif' }}>Submit Proof</h1>
      </div>

      <p className="text-sm text-gray-400 mb-8">
        Upload evidence of your support — concert tickets, merch receipts, album purchases.
        Your creator will review and verify your proof, which can boost your Pulse score.
      </p>

      {artists.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-800 rounded">
          <p className="text-gray-500 mb-2">No creator connections found.</p>
          <p className="text-xs text-gray-600">
            Verify with a creator first to submit proof.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-caption uppercase tracking-widest text-gray-400 mb-2">
              Creator
            </label>
            <select
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 p-3 text-white focus:outline-none focus:border-accent transition-colors"
            >
              {artists.map((a) => (
                <option key={a.artistId} value={a.fanRecordId || ''}>
                  {a.artistName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-caption uppercase tracking-widest text-gray-400 mb-2">
              Proof Type
            </label>
            <select
              value={proofType}
              onChange={(e) => setProofType(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 p-3 text-white focus:outline-none focus:border-accent transition-colors"
            >
              {PROOF_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-caption uppercase tracking-widest text-gray-400 mb-2">
              Proof URL (optional)
            </label>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://... (link to receipt, photo, etc.)"
              className="w-full bg-transparent border-b border-gray-700 py-3 text-white font-light placeholder:text-gray-600 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-caption uppercase tracking-widest text-gray-400 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your proof — e.g., 'Attended Lagos show on Jan 15, 2026'"
              rows={3}
              className="w-full bg-transparent border border-gray-700 p-3 text-white font-light placeholder:text-gray-600 focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-status-error/10 border border-status-error/30 rounded text-sm text-status-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-status-success/10 border border-status-success/30 rounded text-sm text-status-success">
              <Check className="w-4 h-4 shrink-0" />
              Proof submitted! Your creator will review it.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedArtist}
            className="w-full px-6 py-3 bg-accent text-black font-medium hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Submit Proof
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}
