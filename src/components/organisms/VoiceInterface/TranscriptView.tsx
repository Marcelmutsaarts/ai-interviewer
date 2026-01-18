'use client'

import { useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils/cn'
import { LoadingDots } from '@/components/atoms/Spinner/LoadingDots'
import type { TranscriptMessage } from '@/stores/interviewStore'

interface TranscriptViewProps {
  messages: TranscriptMessage[]
  isAISpeaking: boolean
  className?: string
}

export function TranscriptView({ messages, isAISpeaking, className }: TranscriptViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Sort messages by sequenceNumber first, then timestamp as tiebreaker
  // This ensures correct ordering even when messages arrive out of order
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      // First, sort by sequenceNumber (undefined values go to the end)
      const seqA = a.sequenceNumber ?? Number.MAX_SAFE_INTEGER
      const seqB = b.sequenceNumber ?? Number.MAX_SAFE_INTEGER
      if (seqA !== seqB) {
        return seqA - seqB
      }
      // If sequenceNumbers are equal (or both undefined), use timestamp as tiebreaker
      return a.timestamp.getTime() - b.timestamp.getTime()
    })
  }, [messages])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages, isAISpeaking])

  return (
    <div
      ref={containerRef}
      role="log"
      aria-live="polite"
      aria-label="Interview transcript"
      className={cn(
        'flex-1 overflow-y-auto p-4 space-y-4',
        className
      )}
    >
      {sortedMessages.length === 0 && !isAISpeaking ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          <p>Het gesprek begint zodra de verbinding is gemaakt...</p>
        </div>
      ) : (
        <>
          {sortedMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
            />
          ))}
          {isAISpeaking && sortedMessages[sortedMessages.length - 1]?.role !== 'ai' && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xs font-medium text-indigo-600">AI</span>
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                <LoadingDots />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface MessageBubbleProps {
  message: TranscriptMessage
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isAI = message.role === 'ai'

  return (
    <div
      className={cn(
        'flex items-start gap-3',
        !isAI && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isAI ? 'bg-indigo-100' : 'bg-blue-100'
        )}
      >
        <span
          className={cn(
            'text-xs font-medium',
            isAI ? 'text-indigo-600' : 'text-blue-600'
          )}
        >
          {isAI ? 'AI' : 'Jij'}
        </span>
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'rounded-2xl px-4 py-3 max-w-[80%]',
          isAI
            ? 'bg-gray-100 rounded-tl-sm text-gray-800'
            : 'bg-blue-500 rounded-tr-sm text-white'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {!message.isComplete && (
          <span className="inline-block w-1.5 h-4 bg-current opacity-50 animate-pulse ml-1" />
        )}
      </div>
    </div>
  )
}
