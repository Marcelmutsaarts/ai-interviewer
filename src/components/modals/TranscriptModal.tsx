'use client'

import { Modal } from './Modal'
import { ChatBubble } from '@/components/molecules/ChatBubble'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { StatusBadge } from '@/components/atoms/Badge/StatusBadge'
import { formatDateTime } from '@/lib/utils/date'
import { useSessionDetail } from '@/hooks/useSessions'

interface TranscriptModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  sessionId: string | null
}

export function TranscriptModal({ isOpen, onClose, projectId, sessionId }: TranscriptModalProps) {
  const { data: session, isLoading } = useSessionDetail(projectId, sessionId)

  const statusMap: Record<string, 'completed' | 'abandoned' | 'in-progress'> = {
    completed: 'completed',
    abandoned: 'abandoned',
    active: 'in-progress',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Interview Transcript" size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : session ? (
        <div>
          {/* Session info */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
            <StatusBadge status={statusMap[session.status || 'active'] || 'in-progress'} />
            <span className="text-sm text-gray-500">
              {formatDateTime(session.started_at)}
            </span>
            {session.ended_at && (
              <span className="text-sm text-gray-400">
                - {formatDateTime(session.ended_at)}
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {session.transcript_messages.map((message) => (
              <ChatBubble
                key={message.id}
                role={message.role === 'ai' ? 'ai' : 'participant'}
                content={message.content}
                label={message.role === 'ai' ? 'AI Interviewer' : 'Geïnterviewde'}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">Sessie niet gevonden</p>
      )}
    </Modal>
  )
}
