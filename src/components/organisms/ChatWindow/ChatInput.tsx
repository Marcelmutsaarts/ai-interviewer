'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/atoms/Button/Button'
import { cn } from '@/lib/utils/cn'

interface ChatInputProps {
  onSend: (message: string) => void
  placeholder?: string
  disabled?: boolean
}

export function ChatInput({ onSend, placeholder, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm',
          'focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500',
          'disabled:bg-gray-50 disabled:cursor-not-allowed',
          'max-h-[120px]'
        )}
      />
      <Button
        type="submit"
        disabled={disabled || !message.trim()}
        className="self-end"
      >
        Verzenden
      </Button>
    </form>
  )
}
