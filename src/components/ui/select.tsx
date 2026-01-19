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
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-warm-white"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full px-4 py-2.5 pr-10 bg-vault-darker border border-vault-gray rounded-lg',
              'text-warm-white appearance-none cursor-pointer',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-status-error focus:ring-status-error',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vault-muted pointer-events-none" />
        </div>
        {error && (
          <p className="text-sm text-status-error">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
