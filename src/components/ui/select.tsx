'use client'

import { forwardRef, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
  variant?: 'underline' | 'boxed'
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, variant = 'boxed', ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const variants = {
      underline: cn(
        'w-full bg-transparent border-b border-gray-700 py-3 pr-10 text-white font-light',
        'appearance-none cursor-pointer',
        'focus:outline-none focus:border-accent transition-colors',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        error && 'border-status-error focus:border-status-error'
      ),
      boxed: cn(
        'w-full bg-gray-900 border border-gray-800 px-4 py-3 pr-10 text-white font-light',
        'appearance-none cursor-pointer',
        'focus:outline-none focus:border-accent transition-colors',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        error && 'border-status-error focus:border-status-error'
      ),
    }

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-caption uppercase tracking-widest text-gray-400"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(variants[variant], className)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-gray-900">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
        {error && (
          <p className="text-caption text-status-error">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
