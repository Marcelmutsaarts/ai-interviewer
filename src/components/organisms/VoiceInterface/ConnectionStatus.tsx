'use client'

import { cn } from '@/lib/utils/cn'
import { STATUS_CONFIG } from '@/lib/constants/interview-status'
import type { ConnectionStatus as ConnectionStatusType } from '@/stores/interviewStore'

interface ConnectionStatusProps {
  status: ConnectionStatusType
  className?: string
}

export function ConnectionStatus({ status, className }: ConnectionStatusProps) {
  const config = STATUS_CONFIG[status]

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="relative" aria-hidden="true">
        <div
          className={cn(
            'w-3 h-3 rounded-full',
            config.color,
            config.pulse && 'animate-pulse'
          )}
        />
        {config.pulse && (
          <div
            className={cn(
              'absolute inset-0 w-3 h-3 rounded-full opacity-50 animate-ping',
              config.color
            )}
          />
        )}
      </div>
      <span className="text-sm font-medium text-gray-700">
        {config.label}
      </span>
    </div>
  )
}
