'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Check, ZoomIn, ZoomOut, RotateCw, Loader2 } from 'lucide-react'

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
  const [rotation, setRotation] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Clamp position so image always fills the crop area (no blank edges)
  const clampPosition = useCallback(
    (pos: { x: number; y: number }, currentZoom: number) => {
      if (!containerRef.current || imgNatural.w === 0) return pos
      const container = containerRef.current.getBoundingClientRect()
      const cw = container.width
      const ch = container.height
      // Manual cover: image sized to fill container
      const coverScale = Math.max(cw / imgNatural.w, ch / imgNatural.h)
      const imgW = imgNatural.w * coverScale
      const imgH = imgNatural.h * coverScale
      // At this zoom, how much can we pan in each direction
      const maxX = Math.max(0, (imgW * currentZoom - cw) / 2)
      const maxY = Math.max(0, (imgH * currentZoom - ch) / 2)
      return {
        x: Math.max(-maxX, Math.min(maxX, pos.x)),
        y: Math.max(-maxY, Math.min(maxY, pos.y)),
      }
    },
    [imgNatural]
  )

  // Use refs to track drag state for non-passive touch handlers
  const draggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const positionRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)

  // Keep refs in sync
  useEffect(() => { positionRef.current = position }, [position])
  useEffect(() => { zoomRef.current = zoom }, [zoom])

  // Handle mouse drag (React events are fine for mouse)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      draggingRef.current = true
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      }
    },
    [position]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return
      const raw = {
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      }
      setPosition(clampPosition(raw, zoom))
    },
    [isDragging, zoom, clampPosition]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    draggingRef.current = false
  }, [])

  // Register non-passive touch listeners on the container directly
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      setIsDragging(true)
      draggingRef.current = true
      const t = e.touches[0]
      dragStartRef.current = {
        x: t.clientX - positionRef.current.x,
        y: t.clientY - positionRef.current.y,
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!draggingRef.current) return
      e.preventDefault()
      const t = e.touches[0]
      const raw = {
        x: t.clientX - dragStartRef.current.x,
        y: t.clientY - dragStartRef.current.y,
      }
      const clamped = clampPosition(raw, zoomRef.current)
      positionRef.current = clamped
      setPosition(clamped)
    }

    const onTouchEnd = () => {
      setIsDragging(false)
      draggingRef.current = false
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [clampPosition])

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false)
      draggingRef.current = false
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [])

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(1, Math.min(3, newZoom))
    setZoom(clamped)
    // Re-clamp position at new zoom level
    setPosition((prev) => clampPosition(prev, clamped))
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
      const cw = container.width
      const ch = container.height
      const iw = img.naturalWidth
      const ih = img.naturalHeight

      // Match object-fit: cover — scale to fill, then crop
      const coverScale = Math.max(cw / iw, ch / ih)
      // At zoom=1, the visible source rect size
      const visW = cw / (coverScale * zoom)
      const visH = ch / (coverScale * zoom)
      // Center offset + drag offset (convert position px → source px)
      const sx = (iw - visW) / 2 - position.x / (coverScale * zoom)
      const sy = (ih - visH) / 2 - position.y / (coverScale * zoom)

      // Draw with transformations
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.translate(-canvas.width / 2, -canvas.height / 2)

      ctx.drawImage(
        img,
        sx, sy, visW, visH,
        0, 0, canvas.width, canvas.height
      )

      ctx.restore()

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      onSave(dataUrl)
    } catch (error) {
      console.error('Failed to save image:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Adjust Photo</h2>
          <button
            onClick={onCancel}
            className="p-1 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview */}
        <div className="p-4">
          <div
            ref={containerRef}
            className="relative overflow-hidden bg-black rounded-lg cursor-move mx-auto"
            style={{
              width: '100%',
              maxWidth: '300px',
              aspectRatio: aspectRatio,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={image}
              alt="Preview"
              className="absolute select-none"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                maxWidth: 'none',
                // Manual cover sizing — allows panning within overflow
                ...(imgNatural.w > 0 && containerRef.current
                  ? (() => {
                      const cw = containerRef.current.clientWidth
                      const ch = containerRef.current.clientHeight
                      const s = Math.max(cw / imgNatural.w, ch / imgNatural.h)
                      return { width: `${imgNatural.w * s}px`, height: `${imgNatural.h * s}px` }
                    })()
                  : { width: '100%', height: '100%', objectFit: 'cover' as const }),
              }}
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget
                setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
              }}
            />
            {/* Circular crop mask — clear circle, dark outside */}
            {aspectRatio === 1 && (
              <>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, transparent 49%, rgba(0,0,0,0.75) 49.5%)',
                  }}
                />
                {/* White circle ring */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, transparent 48.5%, rgba(255,255,255,0.25) 48.5%, rgba(255,255,255,0.25) 49.5%, transparent 49.5%)',
                  }}
                />
              </>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center mt-2">
            Drag to reposition
          </p>
        </div>

        {/* Controls */}
        <div className="px-4 pb-4 space-y-4">
          {/* Zoom Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Zoom</span>
              <span className="text-sm text-white">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-gray-500" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-[#0a0a0a] rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <ZoomIn className="w-4 h-4 text-gray-500" />
            </div>
          </div>

          {/* Rotation */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Rotation</span>
            <button
              onClick={handleRotate}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-white bg-[#0a0a0a] rounded-lg transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              {rotation}°
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-[#1a1a1a] flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
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
