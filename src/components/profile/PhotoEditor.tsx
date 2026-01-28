'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Check, ZoomIn, ZoomOut, RotateCw, Upload, Loader2 } from 'lucide-react'

interface PhotoEditorProps {
  image: string
  onSave: (dataUrl: string) => void
  onCancel: () => void
  aspectRatio?: number // 1 for square (profile), 16/9 for banner
  outputSize?: { width: number; height: number }
}

export default function PhotoEditor({
  image,
  onSave,
  onCancel,
  aspectRatio = 1,
  outputSize = { width: 400, height: 400 },
}: PhotoEditorProps) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Handle mouse/touch drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      setIsDragging(true)
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      setDragStart({
        x: clientX - position.x,
        y: clientY - position.y,
      })
    },
    [position]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      setPosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      })
    },
    [isDragging, dragStart]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    window.addEventListener('touchend', handleGlobalMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp)
      window.removeEventListener('touchend', handleGlobalMouseUp)
    }
  }, [])

  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(0.5, Math.min(3, newZoom)))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleSave = async () => {
    if (!imageRef.current || !containerRef.current) return
    setIsSaving(true)

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = outputSize.width
      canvas.height = outputSize.height

      const img = new window.Image()
      img.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = image
      })

      const container = containerRef.current.getBoundingClientRect()
      const scaleX = img.naturalWidth / (container.width * zoom)
      const scaleY = img.naturalHeight / (container.height * zoom)

      // Draw with transformations
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.translate(-canvas.width / 2, -canvas.height / 2)

      ctx.drawImage(
        img,
        -position.x * scaleX,
        -position.y * scaleY,
        container.width * scaleX,
        container.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      )

      ctx.restore()

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      onSave(dataUrl)
    } catch (error) {
      console.error('Failed to save image:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-vault-dark rounded-xl border border-vault-gray w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-vault-gray flex items-center justify-between">
          <h2 className="text-lg font-semibold text-warm-white">Adjust Photo</h2>
          <button
            onClick={onCancel}
            className="p-1 text-vault-muted hover:text-warm-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview */}
        <div className="p-4">
          <div
            ref={containerRef}
            className="relative overflow-hidden bg-vault-darker rounded-lg cursor-move mx-auto"
            style={{
              width: '100%',
              maxWidth: '300px',
              aspectRatio: aspectRatio,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={image}
              alt="Preview"
              className="absolute select-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                maxWidth: 'none',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              draggable={false}
            />
            {/* Circular mask for profile photos */}
            {aspectRatio === 1 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: 'inset 0 0 0 9999px rgba(0,0,0,0.5)',
                  borderRadius: '50%',
                }}
              />
            )}
          </div>

          <p className="text-xs text-vault-muted text-center mt-2">
            Drag to reposition
          </p>
        </div>

        {/* Controls */}
        <div className="px-4 pb-4 space-y-4">
          {/* Zoom Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-vault-muted">Zoom</span>
              <span className="text-sm text-warm-white">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-vault-muted" />
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-vault-darker rounded-lg appearance-none cursor-pointer accent-gold"
              />
              <ZoomIn className="w-4 h-4 text-vault-muted" />
            </div>
          </div>

          {/* Rotation */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-vault-muted">Rotation</span>
            <button
              onClick={handleRotate}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-vault-muted hover:text-warm-white bg-vault-darker rounded-lg transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              {rotation}°
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-vault-gray flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-vault-muted hover:text-warm-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-vault-black font-medium rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
