'use client'

import { cn } from '@/lib/utils/cn'
import { CheckCircleIcon, XCircleIcon, XIcon } from '@/components/atoms/Icon/icons'
import type { ToastType } from '@/stores/toastStore'

interface ToastProps {
  type: ToastType
  message: string
  onClose: () => void
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )
}

const typeConfig: Record<
  ToastType,
  { icon: typeof CheckCircleIcon; className: string }
> = {
  success: {
    icon: CheckCircleIcon,
    className: 'bg-success-50 text-success-700 border-success-200',
  },
  error: {
    icon: XCircleIcon,
    className: 'bg-error-50 text-error-700 border-error-200',
  },
  warning: {
    icon: WarningIcon,
    className: 'bg-warning-50 text-warning-700 border-warning-200',
  },
  info: {
    icon: InfoIcon,
    className: 'bg-primary-50 text-primary-700 border-primary-200',
  },
}

export function Toast({ type, message, onClose }: ToastProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-up',
        config.className
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      <button
        onClick={onClose}
        className="p-1 hover:opacity-70 transition-opacity"
        aria-label="Sluiten"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  )
}
