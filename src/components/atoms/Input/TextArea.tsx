import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400 resize-none',
          'focus:outline-none focus:ring-1',
          'disabled:bg-gray-50 disabled:cursor-not-allowed',
          error
            ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
          className
        )}
        {...props}
      />
    )
  }
)

TextArea.displayName = 'TextArea'
