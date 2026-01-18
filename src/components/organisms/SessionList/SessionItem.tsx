'use client'

import { cn } from '@/lib/utils/cn'
import { StatusBadge } from '@/components/atoms/Badge/StatusBadge'
import { TrashIcon } from '@/components/atoms/Icon/icons'
import { formatDateTime } from '@/lib/utils/date'
import type { Session } from '@/types/database'

interface SessionWithCount extends Session {
  messageCount: number
}

interface SessionItemProps {
  session: SessionWithCount
  onClick: () => void
  onDelete?: (sessionId: string) => void
  isSelected?: boolean
}

export function SessionItem({ session, onClick, onDelete, isSelected }: SessionItemProps) {
  const statusMap: Record<string, 'completed' | 'abandoned' | 'in-progress'> = {
    completed: 'completed',
    abandoned: 'abandoned',
    active: 'in-progress',
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(session.id)
    }
  }

  return (
    <div
      onClick={onClick}
      aria-selected={isSelected}
      role="option"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        'w-full px-4 py-3 flex items-center gap-4 text-left transition-colors cursor-pointer',
        'hover:bg-gray-50',
        isSelected && 'bg-primary-50 hover:bg-primary-50'
      )}
    >
      <StatusBadge status={statusMap[session.status || 'active'] || 'in-progress'} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {formatDateTime(session.started_at)}
        </p>
        <p className="text-xs text-gray-500">
          {session.messageCount} berichten
        </p>
      </div>

      {onDelete && (
        <button
          onClick={handleDelete}
          className="p-2 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
          title="Sessie verwijderen"
          aria-label="Sessie verwijderen"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
