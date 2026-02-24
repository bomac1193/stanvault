'use client'

type ShaderBackgroundProps = {
  width: number
  height: number
  colors: [string, string, string]
}

export default function ShaderBackground({ width, height, colors }: ShaderBackgroundProps) {
  const [c1, c2, c3] = colors

  return (
    <div
      className="absolute inset-0"
      style={{ width, height }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 120% at 12% 18%, ${c1}55 0%, transparent 45%), radial-gradient(100% 100% at 82% 22%, ${c2}55 0%, transparent 45%), radial-gradient(110% 120% at 50% 85%, ${c3}30 0%, transparent 55%), #02040a`,
        }}
      />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  )
}
