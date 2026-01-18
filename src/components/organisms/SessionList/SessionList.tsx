'use client'

import { SessionItem } from './SessionItem'
import { ChatBubbleIcon } from '@/components/atoms/Icon/icons'
import type { Session } from '@/types/database'

interface SessionWithCount extends Session {
  messageCount: number
}

interface SessionListProps {
  sessions: SessionWithCount[]
  onSelect: (sessionId: string) => void
  onDelete?: (sessionId: string) => void
  selectedId?: string
}

export function SessionList({ sessions, onSelect, onDelete, selectedId }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <ChatBubbleIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Geen interview sessies</h3>
        <p className="text-gray-500">
          Sessies verschijnen hier zodra deelnemers interviews hebben afgenomen.
        </p>
      </div>
    )
  }

  return (
    <div role="listbox" aria-label="Interview sessies" className="divide-y divide-gray-200">
      {sessions.map((session) => (
        <SessionItem
          key={session.id}
          session={session}
          onClick={() => onSelect(session.id)}
          onDelete={onDelete}
          isSelected={session.id === selectedId}
        />
      ))}
    </div>
  )
}
