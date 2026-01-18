import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-gray-500">{hint}</p>}
      {error && (
        <p className="text-sm text-error-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
