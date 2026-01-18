'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { ChatBubble } from '@/components/molecules/ChatBubble/ChatBubble'
import { ChatInput } from './ChatInput'
import { LoadingDots } from '@/components/atoms/Spinner/LoadingDots'

interface Message {
  id: string
  role: 'admin' | 'assistant' | 'ai' | 'participant'
  content: string
  timestamp?: Date
}

interface ChatWindowProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isLoading?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ChatWindow({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = 'Typ een bericht...',
  disabled = false,
  className,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">Start het gesprek door te beschrijven welk interview je wilt opzetten.</p>
          </div>
        )}

        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            role={message.role === 'admin' ? 'user' : message.role === 'assistant' ? 'ai' : message.role}
            content={message.content}
            label={message.role === 'assistant' ? 'AI Assistent' : undefined}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <LoadingDots className="text-gray-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <ChatInput
          onSend={onSendMessage}
          placeholder={placeholder}
          disabled={disabled || isLoading}
        />
      </div>
    </div>
  )
}
