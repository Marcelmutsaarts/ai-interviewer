'use client'

import { cn } from '@/lib/utils/cn'
import { STATUS_CONFIG } from '@/lib/constants/interview-status'
import type { ConnectionStatus } from '@/stores/interviewStore'

interface StatusBarProps {
  status: ConnectionStatus
  onEndInterview: () => void
  className?: string
}

export function StatusBar({ status, onEndInterview, className }: StatusBarProps) {
  const config = STATUS_CONFIG[status]

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="relative">
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full',
              config.color,
              config.pulse && 'animate-pulse'
            )}
          />
        </div>

        {/* Status text */}
        <span className="text-sm text-gray-600">
          {config.statusText}
        </span>
      </div>

      {/* End interview link */}
      <button
        type="button"
        onClick={onEndInterview}
        className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
      >
        Interview afronden
      </button>
    </div>
  )
}
