import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  variant?: 'underline' | 'boxed'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, variant = 'underline', ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const variants = {
      underline: cn(
        'w-full bg-transparent border-b border-gray-700 py-3 text-white font-light',
        'placeholder:text-gray-600',
        'focus:outline-none focus:border-accent transition-colors',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        error && 'border-status-error focus:border-status-error'
      ),
      boxed: cn(
        'w-full bg-gray-900 border border-gray-800 px-4 py-3 text-white font-light',
        'placeholder:text-gray-600',
        'focus:outline-none focus:border-accent transition-colors',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        error && 'border-status-error focus:border-status-error'
      ),
    }

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-caption uppercase tracking-widest text-gray-400"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(variants[variant], className)}
          {...props}
        />
        {error && (
          <p className="text-caption text-status-error">{error}</p>
        )}
        {hint && !error && (
          <p className="text-caption text-gray-600">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
