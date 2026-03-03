'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Copy, Check, ExternalLink, Trash2, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'

interface Drop {
  id: string
  slug: string
  title: string
  description: string | null
  contentType: string
  contentUrl: string | null
  minTier: string | null
  minScore: number | null
  minMonths: number | null
  startsAt: string | null
  endsAt: string | null
  maxClaims: number | null
  claimCount: number
  isActive: boolean
  createdAt: string
}

export default function DropsPage() {
  const { data: dropsData, isLoading: loading, refetch: refetchDrops } = useQuery<{ drops: Drop[] }>({
    queryKey: ['drops'],
    queryFn: async () => {
      const res = await fetch('/api/drops')
      if (!res.ok) throw new Error('Failed to fetch drops')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
  const drops = dropsData?.drops || []

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contentType, setContentType] = useState('MESSAGE')
  const [contentUrl, setContentUrl] = useState('')
  const [minTier, setMinTier] = useState('')
  const [minScore, setMinScore] = useState('')
  const [maxClaims, setMaxClaims] = useState('')

  async function createDrop(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    try {
      const res = await fetch('/api/drops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          contentType,
          contentUrl: contentUrl || null,
          minTier: minTier || null,
          minScore: minScore || null,
          maxClaims: maxClaims || null,
        }),
      })

      if (res.ok) {
        // Reset form
        setTitle('')
        setDescription('')
        setContentType('MESSAGE')
        setContentUrl('')
        setMinTier('')
        setMinScore('')
        setMaxClaims('')
        setShowCreate(false)
        refetchDrops()
      }
    } catch {
      console.error('Failed to create drop')
    } finally {
      setCreating(false)
    }
  }

  function copyDropLink(slug: string) {
    const url = `${window.location.origin}/drop/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Drops"
        description="Create verification-gated content for your fans"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-black font-medium hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Drop
          </button>
        }
      />

      {/* Create Form */}
      {showCreate && (
        <div className="mb-8 p-6 border border-[#1a1a1a] bg-[#0a0a0a]">
          <h2 className="text-sm font-medium text-gray-400 mb-6">Create Drop</h2>
          <form onSubmit={createDrop} className="space-y-6">
            <div>
              <label className="block text-caption uppercase tracking-widest text-gray-400 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Unreleased Demo"
                required
                className="w-full bg-transparent border-b border-[#1a1a1a] py-3 text-white font-light placeholder:text-gray-600 focus:outline-none focus:border-[#333] transition-colors"
              />
            </div>

            <div>
              <label className="block text-caption uppercase tracking-widest text-gray-400 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Exclusive for my real ones..."
                rows={3}
                className="w-full bg-transparent border border-[#1a1a1a] p-3 text-white font-light placeholder:text-gray-600 focus:outline-none focus:border-[#333] transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-caption uppercase tracking-widest text-gray-400 mb-2">
                  Content Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] p-3 text-white focus:outline-none focus:border-[#333] transition-colors"
                >
                  <option value="MESSAGE">Message / Text</option>
                  <option value="LINK">External Link</option>
                  <option value="DOWNLOAD">Download Link</option>
                  <option value="PRESALE">Presale Code</option>
                </select>
              </div>

              <div>
                <label className="block text-caption uppercase tracking-widest text-gray-400 mb-2">
                  {contentType === 'PRESALE' ? 'Presale Code' : 'Content / URL'}
                </label>
                <input
                  type="text"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder={
                    contentType === 'MESSAGE'
                      ? 'Your secret message...'
                      : contentType === 'PRESALE'
                        ? 'SUPERFAN2024'
                        : 'https://...'
                  }
                  className="w-full bg-transparent border-b border-[#1a1a1a] py-3 text-white font-light placeholder:text-gray-600 focus:outline-none focus:border-[#333] transition-colors"
                />
              </div>
            </div>

            <div className="border-t border-[#1a1a1a] pt-6">
              <p className="text-caption uppercase tracking-widest text-gray-400 mb-4">
                Gating Rules
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-caption text-gray-500 mb-2">Minimum Tier</label>
                  <select
                    value={minTier}
                    onChange={(e) => setMinTier(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] p-3 text-white focus:outline-none focus:border-[#333] transition-colors"
                  >
                    <option value="">Any verified fan</option>
                    <option value="CASUAL">Faint+</option>
                    <option value="ENGAGED">Steady+</option>
                    <option value="DEDICATED">Strong+</option>
                    <option value="SUPERFAN">Core only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-caption text-gray-500 mb-2">Min Pulse Score</label>
                  <input
                    type="number"
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full bg-transparent border-b border-[#1a1a1a] py-3 text-white font-light placeholder:text-gray-600 focus:outline-none focus:border-[#333] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-caption text-gray-500 mb-2">Max Claims</label>
                  <input
                    type="number"
                    value={maxClaims}
                    onChange={(e) => setMaxClaims(e.target.value)}
                    placeholder="Unlimited"
                    min="1"
                    className="w-full bg-transparent border-b border-[#1a1a1a] py-3 text-white font-light placeholder:text-gray-600 focus:outline-none focus:border-[#333] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={creating || !title}
                className="px-8 py-3 bg-[#0a0a0a] text-gray-200 font-medium border border-[#1a1a1a] hover:border-[#333] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Drop'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-8 py-3 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Drops List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      ) : drops.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[#1a1a1a]">
          <p className="text-lg text-white mb-2">No drops yet</p>
          <p className="text-gray-500 mb-4">
            Drops let you gate exclusive content by fan tier and Pulse score.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-2 bg-accent text-black font-medium hover:brightness-110 transition-all"
          >
            Create your first drop
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {drops.map((drop) => (
            <div
              key={drop.id}
              className="p-6 border border-[#1a1a1a] hover:border-[#222] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-body-lg font-medium text-white">{drop.title}</h3>
                    <span
                      className={`px-2 py-0.5 text-caption uppercase tracking-wider ${
                        drop.isActive
                          ? 'bg-status-success/20 text-status-success'
                          : 'bg-[#1a1a1a] text-gray-500'
                      }`}
                    >
                      {drop.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-0.5 text-caption uppercase tracking-wider bg-[#1a1a1a] text-gray-400">
                      {drop.contentType}
                    </span>
                  </div>

                  {drop.description && (
                    <p className="text-body-sm text-gray-500 font-light mb-4">{drop.description}</p>
                  )}

                  <div className="flex items-center gap-6 text-caption text-gray-500">
                    <span>
                      <span className="text-white font-medium">{drop.claimCount}</span> claims
                      {drop.maxClaims && <span> / {drop.maxClaims}</span>}
                    </span>
                    {drop.minTier && <span>Min: {drop.minTier}</span>}
                    {drop.minScore && <span>Score: {drop.minScore}+</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyDropLink(drop.slug)}
                    className="p-2 text-gray-500 hover:text-white transition-colors"
                    title="Copy link"
                  >
                    {copiedSlug === drop.slug ? (
                      <Check className="w-4 h-4 text-status-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={`/drop/${drop.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-white transition-colors"
                    title="Preview"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Drop URL */}
              <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
                <p className="text-caption text-gray-600 mb-1">Share this link with your fans:</p>
                <code className="text-body-sm text-accent">
                  {baseUrl}/drop/{drop.slug}
                </code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
