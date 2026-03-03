'use client'

import { useState, ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DisclosureProps {
  label: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  /** Show a subtle count/badge next to the label */
  badge?: string | number
}

export function Disclosure({
  label,
  children,
  defaultOpen = false,
  className,
  badge,
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn('border-t border-[#1a1a1a]', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 w-full py-3 group"
      >
        <ChevronRight
          className={cn(
            'w-3 h-3 text-gray-600 transition-transform duration-150',
            open && 'rotate-90'
          )}
        />
        <span className="text-caption text-gray-500 group-hover:text-gray-300 transition-colors">
          {label}
        </span>
        {badge !== undefined && (
          <span className="text-caption text-gray-600 tabular-nums">{badge}</span>
        )}
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  )
}
