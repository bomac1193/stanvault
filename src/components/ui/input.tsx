import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-warm-white"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 bg-vault-darker border border-vault-gray rounded-md',
            'text-warm-white placeholder:text-vault-muted',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-moss-light focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-status-error focus:ring-status-error',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-status-error">{error}</p>
        )}
        {hint && !error && (
          <p className="text-sm text-vault-muted">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
