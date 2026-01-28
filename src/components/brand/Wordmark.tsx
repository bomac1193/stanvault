"use client"

import { cn } from "@/lib/utils"

interface WordmarkProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  tagline?: boolean
}

const sizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
}

/**
 * Standalone Wordmark Component
 * "STANVAULT" in Futura Bold, tracked out
 * Optionally includes tagline
 */
export function Wordmark({ size = "md", tagline = false, className }: WordmarkProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span
        className={cn(
          "wordmark text-warm-white",
          sizes[size]
        )}
      >
        STANVAULT
      </span>
      {tagline && (
        <span className="font-display font-medium text-xs uppercase tracking-brand text-vault-muted mt-1">
          Own Your Fans. Own Your Future.
        </span>
      )}
    </div>
  )
}

export default Wordmark
