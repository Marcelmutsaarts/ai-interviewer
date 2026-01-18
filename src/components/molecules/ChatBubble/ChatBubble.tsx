import { cn } from '@/lib/utils/cn'

interface ChatBubbleProps {
  role: 'ai' | 'participant' | 'user'
  content: string
  label?: string
  className?: string
}

export function ChatBubble({ role, content, label, className }: ChatBubbleProps) {
  const isAI = role === 'ai'
  const displayLabel = label || (isAI ? 'AI Interviewer' : 'Geïnterviewde')

  return (
    <div className={cn('flex', isAI ? 'justify-start' : 'justify-end', className)}>
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3',
        isAI ? 'bg-gray-100 text-gray-900 rounded-bl-md' : 'bg-primary-600 text-white rounded-br-md'
      )}>
        <p className="text-xs font-medium mb-1 opacity-70">{displayLabel}</p>
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}
