'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import { Edit2, Save, X } from 'lucide-react'

interface FanNotesProps {
  initialNotes?: string | null
  onSave: (notes: string) => Promise<void>
}

export function FanNotes({ initialNotes, onSave }: FanNotesProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(notes)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save notes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setNotes(initialNotes || '')
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notes</CardTitle>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this fan..."
              className="w-full h-32 px-4 py-3 bg-vault-darker border border-vault-gray rounded-lg text-warm-white placeholder:text-vault-muted resize-none focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} isLoading={isSaving}>
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className={notes ? 'text-warm-white whitespace-pre-wrap' : 'text-vault-muted italic'}>
            {notes || 'No notes yet. Click edit to add notes about this fan.'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
