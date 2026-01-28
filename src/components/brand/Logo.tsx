"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  variant?: "full" | "mark"
}

const sizes = {
  sm: { mark: 24, wordmark: "text-sm" },
  md: { mark: 32, wordmark: "text-base" },
  lg: { mark: 48, wordmark: "text-xl" },
  xl: { mark: 64, wordmark: "text-2xl" },
}

/**
 * Stanvault Logo Mark
 * A stylized "SV" monogram inside a vault-door / shield shape.
 * Geometric lines (Ruler), organic rounded corners (Caregiver), bold weight (Rebel).
 */
export function LogoMark({ size = "md", className }: { size?: LogoProps["size"]; className?: string }) {
  const dimension = sizes[size].mark

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
      aria-label="Stanvault logo"
    >
      {/* Shield/Vault door shape with organic rounded corners */}
      <path
        d="M32 4L56 14V32C56 46.36 45.64 58.08 32 60C18.36 58.08 8 46.36 8 32V14L32 4Z"
        fill="currentColor"
        className="text-gold"
      />
      {/* Inner vault circle */}
      <circle
        cx="32"
        cy="34"
        r="20"
        fill="currentColor"
        className="text-vault-black"
      />
      {/* SV Monogram */}
      <text
        x="32"
        y="42"
        textAnchor="middle"
        className="font-display font-bold text-gold"
        fill="currentColor"
        style={{
          fontSize: "22px",
          fontFamily: "Futura, Jost, system-ui, sans-serif",
          fontWeight: 700,
          letterSpacing: "0.05em"
        }}
      >
        SV
      </text>
      {/* Vault door details - horizontal lines */}
      <line x1="18" y1="26" x2="24" y2="26" stroke="currentColor" strokeWidth="1.5" className="text-gold/40" />
      <line x1="40" y1="26" x2="46" y2="26" stroke="currentColor" strokeWidth="1.5" className="text-gold/40" />
      <line x1="18" y1="42" x2="24" y2="42" stroke="currentColor" strokeWidth="1.5" className="text-gold/40" />
      <line x1="40" y1="42" x2="46" y2="42" stroke="currentColor" strokeWidth="1.5" className="text-gold/40" />
    </svg>
  )
}

/**
 * Stanvault Wordmark
 * "STANVAULT" in Futura Bold, tracked out
 */
export function Wordmark({ size = "md", className }: { size?: LogoProps["size"]; className?: string }) {
  return (
    <span
      className={cn(
        "wordmark text-warm-white",
        sizes[size].wordmark,
        className
      )}
    >
      STANVAULT
    </span>
  )
}

/**
 * Full Logo Component
 * Combines LogoMark + Wordmark
 */
export function Logo({ size = "md", variant = "full", className }: LogoProps) {
  if (variant === "mark") {
    return <LogoMark size={size} className={className} />
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={size} />
      <Wordmark size={size} />
    </div>
  )
}

export default Logo
