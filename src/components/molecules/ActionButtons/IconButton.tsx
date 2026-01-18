import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  variant?: 'default' | 'danger'
  size?: 'sm' | 'md'
}

const variantStyles = {
  default: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
  danger: 'text-gray-500 hover:text-error-600 hover:bg-error-50',
}

const sizeStyles = {
  sm: 'p-1',
  md: 'p-2',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, variant = 'default', size = 'md', className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        aria-label={label}
        title={label}
        {...props}
      >
        {icon}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'
