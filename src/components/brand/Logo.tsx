"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "full" | "mark" | "wordmark"
  className?: string
  inverted?: boolean
}

const sizes = {
  sm: { mark: "text-lg", wordmark: "text-sm", gap: "gap-1.5" },
  md: { mark: "text-2xl", wordmark: "text-base", gap: "gap-2" },
  lg: { mark: "text-4xl", wordmark: "text-xl", gap: "gap-3" },
  xl: { mark: "text-6xl", wordmark: "text-2xl", gap: "gap-4" },
}

/**
 * STANVAULT Logo Mark
 *
 * Deconstructed "SV" - Virgil energy
 * The brackets represent: [contained] yet open
 * Typography as identity
 */
export function LogoMark({
  size = "md",
  className,
  inverted = false,
}: {
  size?: LogoProps["size"]
  className?: string
  inverted?: boolean
}) {
  return (
    <span
      className={cn(
        "font-bold tracking-tighter select-none",
        sizes[size].mark,
        inverted ? "text-black" : "text-white",
        className
      )}
    >
      <span className="text-accent">[</span>
      SV
      <span className="text-accent">]</span>
    </span>
  )
}

/**
 * STANVAULT Wordmark
 *
 * All caps, tracked, brutal
 * "STANVAULT" or "STAN VAULT" depending on context
 */
export function Wordmark({
  size = "md",
  className,
  inverted = false,
  split = false,
}: {
  size?: LogoProps["size"]
  className?: string
  inverted?: boolean
  split?: boolean
}) {
  return (
    <span
      className={cn(
        "font-bold uppercase tracking-tight select-none",
        sizes[size].wordmark,
        inverted ? "text-black" : "text-white",
        className
      )}
    >
      {split ? (
        <>
          STAN<span className="text-accent">VAULT</span>
        </>
      ) : (
        "STANVAULT"
      )}
    </span>
  )
}

/**
 * Full Logo
 *
 * Mark + Wordmark combined
 */
export function Logo({
  size = "md",
  variant = "full",
  className,
  inverted = false,
}: LogoProps) {
  if (variant === "mark") {
    return <LogoMark size={size} className={className} inverted={inverted} />
  }

  if (variant === "wordmark") {
    return <Wordmark size={size} className={className} inverted={inverted} />
  }

  return (
    <div className={cn("flex items-center", sizes[size].gap, className)}>
      <LogoMark size={size} inverted={inverted} />
      <span className={cn(
        "text-gray-600 font-light",
        size === "sm" ? "text-xs" : "text-sm"
      )}>
        /
      </span>
      <Wordmark size={size} inverted={inverted} />
    </div>
  )
}

/**
 * Statement Logo
 *
 * For hero sections - massive, brutal
 */
export function StatementLogo({ className }: { className?: string }) {
  return (
    <div className={cn("select-none", className)}>
      <div className="text-display-xl font-black tracking-tighter leading-none">
        <span className="text-accent">[</span>
        STAN
      </div>
      <div className="text-display-xl font-black tracking-tighter leading-none">
        VAULT
        <span className="text-accent">]</span>
      </div>
    </div>
  )
}

/**
 * Tagline
 *
 * The manifesto, not a slogan
 */
export function Tagline({
  variant = "default",
  className,
}: {
  variant?: "default" | "full" | "minimal"
  className?: string
}) {
  if (variant === "minimal") {
    return (
      <p className={cn("text-caption text-gray-500 uppercase tracking-widest", className)}>
        Own your "fans"
      </p>
    )
  }

  if (variant === "full") {
    return (
      <div className={cn("space-y-1", className)}>
        <p className="text-body font-light text-gray-400">
          The platform for artists who refuse to be algorithms.
        </p>
        <p className="text-caption text-gray-600 uppercase tracking-wider">
          Know your <span className="text-accent">"fans"</span> — Own your future
        </p>
      </div>
    )
  }

  return (
    <p className={cn("text-body-sm text-gray-500 font-light", className)}>
      Own your <span className="quoted text-white">fans</span>
    </p>
  )
}

export default Logo
