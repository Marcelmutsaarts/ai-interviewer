'use client'

import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { EyeIcon, EyeSlashIcon } from '../Icon/icons'

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <div className="relative">
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={cn(
            'w-full rounded-lg border px-3 py-2 pr-10 text-sm placeholder-gray-400',
            'focus:outline-none focus:ring-1',
            'disabled:bg-gray-50 disabled:cursor-not-allowed',
            error
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
            className
          )}
          {...props}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
          aria-label={showPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
        >
          {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
