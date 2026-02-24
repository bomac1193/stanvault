'use client'

import { useMemo } from 'react'

type ColorPanelProps = {
  colors: [string, string, string]
  onColorsChange: (colors: [string, string, string]) => void
}

export default function ColorPanel({ colors, onColorsChange }: ColorPanelProps) {
  const labels = useMemo(() => ['Hue', 'Saturation', 'Brightness'] as const, [])

  function updateColor(index: 0 | 1 | 2, value: string) {
    const next: [string, string, string] = [...colors] as [string, string, string]
    next[index] = value
    onColorsChange(next)
  }

  return (
    <div className="border border-gray-700 bg-black/70 backdrop-blur-sm p-3 w-[180px] space-y-2">
      <p className="text-caption uppercase tracking-widest text-gray-400">Shader Colors</p>
      {labels.map((label, idx) => (
        <label key={label} className="block">
          <span className="text-caption text-gray-400">{label}</span>
          <input
            type="color"
            className="mt-1 h-8 w-full border border-gray-700 bg-black"
            value={colors[idx]}
            onChange={(e) => updateColor(idx as 0 | 1 | 2, e.target.value)}
          />
        </label>
      ))}
    </div>
  )
}
