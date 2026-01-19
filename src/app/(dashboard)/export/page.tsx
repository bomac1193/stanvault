'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout'
import { Button, Card, CardHeader, CardTitle, CardContent, Select } from '@/components/ui'
import { Download, FileJson, FileText } from 'lucide-react'

const fields = [
  { id: 'displayName', label: 'Name' },
  { id: 'email', label: 'Email' },
  { id: 'location', label: 'Location' },
  { id: 'stanScore', label: 'Stan Score' },
  { id: 'tier', label: 'Tier' },
  { id: 'platforms', label: 'Platforms' },
  { id: 'firstSeenAt', label: 'First Seen' },
  { id: 'lastActiveAt', label: 'Last Active' },
]

const tierOptions = [
  { value: 'ALL', label: 'All Fans' },
  { value: 'SUPERFAN', label: 'Superfans Only' },
  { value: 'DEDICATED', label: 'Dedicated Only' },
  { value: 'ENGAGED', label: 'Engaged Only' },
  { value: 'CASUAL', label: 'Casual Only' },
]

export default function ExportPage() {
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [tier, setTier] = useState('ALL')
  const [selectedFields, setSelectedFields] = useState<string[]>(fields.map((f) => f.id))
  const [isExporting, setIsExporting] = useState(false)

  const { data: metricsData } = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/metrics')
      if (!res.ok) throw new Error('Failed to fetch metrics')
      return res.json()
    },
  })

  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((f) => f !== fieldId)
        : [...prev, fieldId]
    )
  }

  const handleExport = async () => {
    if (selectedFields.length === 0) return

    setIsExporting(true)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, tier, fields: selectedFields }),
      })

      if (!res.ok) throw new Error('Export failed')

      // Download the file
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fans-export-${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Export"
        description="Export your fan data"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFormat('csv')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    format === 'csv'
                      ? 'border-gold bg-gold/10'
                      : 'border-vault-gray hover:border-vault-muted'
                  }`}
                >
                  <FileText className={`w-8 h-8 mx-auto mb-2 ${
                    format === 'csv' ? 'text-gold' : 'text-vault-muted'
                  }`} />
                  <p className="font-medium text-warm-white">CSV</p>
                  <p className="text-xs text-vault-muted">Excel compatible</p>
                </button>
                <button
                  onClick={() => setFormat('json')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    format === 'json'
                      ? 'border-gold bg-gold/10'
                      : 'border-vault-gray hover:border-vault-muted'
                  }`}
                >
                  <FileJson className={`w-8 h-8 mx-auto mb-2 ${
                    format === 'json' ? 'text-gold' : 'text-vault-muted'
                  }`} />
                  <p className="font-medium text-warm-white">JSON</p>
                  <p className="text-xs text-vault-muted">Developer friendly</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Tier Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Filter by Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                options={tierOptions}
              />
            </CardContent>
          </Card>

          {/* Field Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fields.map((field) => (
                  <label
                    key={field.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedFields.includes(field.id)
                        ? 'border-gold bg-gold/10'
                        : 'border-vault-gray hover:border-vault-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.id)}
                      onChange={() => toggleField(field.id)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedFields.includes(field.id)
                          ? 'bg-gold border-gold'
                          : 'border-vault-muted'
                      }`}
                    >
                      {selectedFields.includes(field.id) && (
                        <svg className="w-3 h-3 text-vault-black" viewBox="0 0 12 12">
                          <path
                            fill="currentColor"
                            d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-warm-white">{field.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Export Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-vault-muted">Format</span>
                  <span className="text-warm-white uppercase">{format}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vault-muted">Tier</span>
                  <span className="text-warm-white">
                    {tierOptions.find((t) => t.value === tier)?.label}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vault-muted">Fields</span>
                  <span className="text-warm-white">{selectedFields.length} selected</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vault-muted">Total Fans</span>
                  <span className="text-warm-white font-mono">
                    {metricsData?.totalFans?.toLocaleString() || 0}
                  </span>
                </div>

                <hr className="border-vault-gray" />

                <Button
                  className="w-full"
                  onClick={handleExport}
                  disabled={selectedFields.length === 0}
                  isLoading={isExporting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export {format.toUpperCase()}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
