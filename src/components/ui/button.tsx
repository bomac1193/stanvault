'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium transition-all duration-200',
      'disabled:opacity-40 disabled:cursor-not-allowed',
      'focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-1 focus:ring-offset-black'
    )

    const variants = {
      primary: 'bg-white text-black hover:bg-gray-200 active:bg-gray-300',
      accent: 'bg-accent text-black hover:brightness-110 active:brightness-90',
      ghost: 'bg-transparent text-white hover:text-accent',
      outline: 'bg-transparent border border-gray-700 text-white hover:border-white hover:bg-white/5',
      danger: 'bg-status-error text-white hover:brightness-110',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-caption tracking-wide',
      md: 'px-5 py-2.5 text-body-sm',
      lg: 'px-8 py-4 text-body',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading</span>
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
