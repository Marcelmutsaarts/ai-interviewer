'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { useInterviewStore } from '@/stores/interviewStore'
import {
  getConnectionManager,
  resetConnectionManager,
  type RealtimeConfig,
  type ConnectionEvent,
} from '@/lib/websocket/connection-manager'
import { ConnectionStatus } from './ConnectionStatus'
import { TranscriptView } from './TranscriptView'
import { StatusBar } from './StatusBar'
import { VolumeUpIcon, VolumeOffIcon, StopIcon } from '@/components/atoms/Icon/icons'
import { IconButton } from '@/components/molecules/ActionButtons/IconButton'

/**
 * Buffered AI message structure for maintaining correct message order.
 * AI responses are buffered while user transcription is pending to ensure
 * user input appears before AI response in the UI.
 */
interface BufferedAIMessage {
  content: string
  isComplete: boolean
  isUpdate: boolean // True if this should update an existing message instead of adding new
  existingContent?: string // For updates: the previous content to append to
}

interface VoiceInterfaceProps {
  projectId: string
  onShowCompletionModal: () => void
  className?: string
}

export function VoiceInterface({
  projectId,
  onShowCompletionModal,
  className,
}: VoiceInterfaceProps) {
  const router = useRouter()
  const [isOutputMuted, setIsOutputMuted] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const {
    connectionStatus,
    setConnectionStatus,
    sessionId,
    setSessionId,
    transcript,
    addMessage,
    updateLastMessage,
    error,
    setError,
    reset,
  } = useInterviewStore()

  // Use refs for values accessed in event handler to avoid stale closures
  // This prevents memory leaks from frequent re-subscriptions
  const sessionIdRef = useRef<string | null>(null)
  const currentAIMessageIdRef = useRef<string | null>(null)
  const currentParticipantMessageIdRef = useRef<string | null>(null)
  const transcriptRef = useRef(transcript)
  const connectionStatusRef = useRef(connectionStatus)

  // Message ordering: Buffer AI responses while user transcription is pending
  // This ensures user input is displayed BEFORE the AI response that follows it
  const pendingUserTranscriptionRef = useRef<boolean>(false)
  const bufferedAIMessagesRef = useRef<BufferedAIMessage[]>([])
  // Track if we've received the first AI message (welcome message - should not be buffered)
  const hasReceivedFirstAIMessageRef = useRef<boolean>(false)
  // Track accumulated AI content while buffering (for streaming updates)
  const bufferedAIContentRef = useRef<string>('')

  // Keep refs in sync with state
  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    connectionStatusRef.current = connectionStatus
  }, [connectionStatus])

  // Ref to store the unsubscribe function for proper cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Handle connection events - uses refs to avoid stale closures and reduce re-subscriptions
  const handleConnectionEvent = useCallback(
    (event: ConnectionEvent) => {
      switch (event.type) {
        case 'status':
          if (event.status === 'connected') {
            setConnectionStatus('connected')
          } else if (event.status === 'connecting') {
            setConnectionStatus('connecting')
          } else if (event.status === 'disconnected') {
            setConnectionStatus('disconnected')
          } else if (event.status === 'error') {
            setConnectionStatus('error')
          }
          break

        case 'speaking':
          if (event.isSpeaking) {
            setConnectionStatus('speaking')
          } else if (connectionStatusRef.current === 'speaking') {
            setConnectionStatus('connected')
          }
          break

        case 'listening':
          if (event.isListening) {
            setConnectionStatus('listening')
            // User started speaking - mark pending transcription
            // Any AI responses that arrive now should be buffered
            pendingUserTranscriptionRef.current = true
          } else if (connectionStatusRef.current === 'listening') {
            setConnectionStatus('connected')
            // Note: We do NOT clear pendingUserTranscription here because
            // the transcription.completed event hasn't arrived yet
          }
          break

        case 'transcript':
          if (event.role === 'ai') {
            // Determine if this is the first AI message (welcome message)
            // The welcome message should never be buffered since there's no prior user input
            const isFirstAIMessage = !hasReceivedFirstAIMessageRef.current
            if (isFirstAIMessage) {
              hasReceivedFirstAIMessageRef.current = true
            }

            // Should we buffer this AI message?
            // Buffer if: user transcription is pending AND this is not the first AI message
            const shouldBuffer = pendingUserTranscriptionRef.current && !isFirstAIMessage

            if (event.isComplete) {
              // Complete AI message
              if (shouldBuffer) {
                // Buffer the complete message
                bufferedAIMessagesRef.current.push({
                  content: event.content,
                  isComplete: true,
                  isUpdate: currentAIMessageIdRef.current !== null,
                })
                // Reset buffered content accumulator
                bufferedAIContentRef.current = ''
                currentAIMessageIdRef.current = null
              } else {
                // Not buffering - display immediately
                if (currentAIMessageIdRef.current) {
                  updateLastMessage('ai', event.content, true)
                  saveMessage(sessionIdRef.current, 'ai', event.content)
                } else {
                  addMessage({
                    role: 'ai',
                    content: event.content,
                    isComplete: true,
                  })
                  saveMessage(sessionIdRef.current, 'ai', event.content)
                }
                currentAIMessageIdRef.current = null
              }
            } else {
              // Partial AI message (streaming)
              if (shouldBuffer) {
                // Accumulate streamed content in buffer
                bufferedAIContentRef.current += event.content
                // Mark that we have a message ID for this stream
                if (!currentAIMessageIdRef.current) {
                  currentAIMessageIdRef.current = crypto.randomUUID()
                }
              } else {
                // Not buffering - display immediately
                if (!currentAIMessageIdRef.current) {
                  const id = crypto.randomUUID()
                  currentAIMessageIdRef.current = id
                  addMessage({
                    role: 'ai',
                    content: event.content,
                    isComplete: false,
                  })
                } else {
                  // Append to existing message
                  const lastAIMessage = transcriptRef.current.filter(m => m.role === 'ai').pop()
                  if (lastAIMessage) {
                    updateLastMessage('ai', lastAIMessage.content + event.content, false)
                  }
                }
              }
            }
          } else {
            // Participant message
            if (event.isComplete) {
              // Add the user message first
              if (currentParticipantMessageIdRef.current) {
                updateLastMessage('participant', event.content, true)
              } else {
                addMessage({
                  role: 'participant',
                  content: event.content,
                  isComplete: true,
                })
              }
              saveMessage(sessionIdRef.current, 'participant', event.content)
              currentParticipantMessageIdRef.current = null

              // Clear pending flag - user transcription is now complete
              pendingUserTranscriptionRef.current = false

              // Flush any buffered AI messages AFTER the user message has been added
              // This ensures correct ordering: user message -> AI response
              const hadStreamingContent = bufferedAIContentRef.current.length > 0
              const hadBufferedMessages = bufferedAIMessagesRef.current.length > 0

              if (hadStreamingContent || hadBufferedMessages) {
                // If we have accumulated streaming content, add it as a new message
                if (hadStreamingContent) {
                  // Keep the message ID active so subsequent streaming updates
                  // can properly update this message (ID was already set during buffering)
                  addMessage({
                    role: 'ai',
                    content: bufferedAIContentRef.current,
                    isComplete: false, // Will be marked complete when done event arrives
                  })
                  bufferedAIContentRef.current = ''
                }

                // Process any buffered complete messages
                bufferedAIMessagesRef.current.forEach((bufferedMsg) => {
                  if (bufferedMsg.isUpdate) {
                    updateLastMessage('ai', bufferedMsg.content, bufferedMsg.isComplete)
                    if (bufferedMsg.isComplete) {
                      saveMessage(sessionIdRef.current, 'ai', bufferedMsg.content)
                      currentAIMessageIdRef.current = null
                    }
                  } else {
                    addMessage({
                      role: 'ai',
                      content: bufferedMsg.content,
                      isComplete: bufferedMsg.isComplete,
                    })
                    if (bufferedMsg.isComplete) {
                      saveMessage(sessionIdRef.current, 'ai', bufferedMsg.content)
                      currentAIMessageIdRef.current = null
                    }
                  }
                })
                bufferedAIMessagesRef.current = []
              }
            } else {
              // Partial participant message (streaming) - not typically used but handle it
              if (!currentParticipantMessageIdRef.current) {
                const id = crypto.randomUUID()
                currentParticipantMessageIdRef.current = id
                addMessage({
                  role: 'participant',
                  content: event.content,
                  isComplete: false,
                })
              } else {
                const lastParticipantMessage = transcriptRef.current.filter(m => m.role === 'participant').pop()
                if (lastParticipantMessage) {
                  updateLastMessage('participant', lastParticipantMessage.content + event.content, false)
                }
              }
            }
          }
          break

        case 'error':
          setError(event.message)
          setConnectionError(event.message)
          break

        case 'closing_detected':
          onShowCompletionModal()
          break
      }
    },
    // Minimal dependencies - store actions are stable, onShowCompletionModal is from props
    [setConnectionStatus, addMessage, updateLastMessage, setError, onShowCompletionModal]
  )

  // Save message to database
  const saveMessage = async (
    sessionId: string | null,
    role: 'ai' | 'participant',
    content: string
  ) => {
    if (!sessionId || !content.trim()) return

    try {
      await fetch('/api/interview/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, role, content }),
      })
    } catch (error) {
      console.error('Failed to save message:', error)
    }
  }

  // Initialize connection on mount
  useEffect(() => {
    let mounted = true

    const initConnection = async () => {
      try {
        setConnectionStatus('connecting')

        // Create session first
        const startResponse = await fetch('/api/interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId }),
        })

        if (!startResponse.ok) {
          const error = await startResponse.json()
          throw new Error(error.error || 'Kon sessie niet starten')
        }

        const { sessionId: newSessionId } = await startResponse.json()
        if (!mounted) return

        setSessionId(newSessionId)

        // Get ephemeral token
        const tokenResponse = await fetch('/api/interview/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId }),
        })

        if (!tokenResponse.ok) {
          const error = await tokenResponse.json()
          throw new Error(error.error || 'Kon verbinding niet maken')
        }

        const { token, config } = await tokenResponse.json()
        if (!mounted) return

        // Connect to OpenAI Realtime
        const manager = getConnectionManager()

        // Clean up any existing subscription before creating a new one
        if (unsubscribeRef.current) {
          unsubscribeRef.current()
        }

        // Subscribe to events and store unsubscribe function in ref
        unsubscribeRef.current = manager.onEvent(handleConnectionEvent)

        await manager.connect(token, config as RealtimeConfig)
      } catch (error) {
        if (!mounted) return
        console.error('Connection error:', error)
        setConnectionStatus('error')
        setConnectionError(
          error instanceof Error ? error.message : 'Verbinding mislukt'
        )
      }
    }

    initConnection()

    return () => {
      mounted = false
      // Clean up event subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      // Reset message ordering state
      pendingUserTranscriptionRef.current = false
      bufferedAIMessagesRef.current = []
      bufferedAIContentRef.current = ''
      hasReceivedFirstAIMessageRef.current = false
      resetConnectionManager()
    }
  }, [projectId, setConnectionStatus, setSessionId, handleConnectionEvent])

  // Handle ending the interview
  const handleEndInterview = useCallback(async () => {
    const manager = getConnectionManager()
    manager.disconnect()

    if (sessionId) {
      try {
        await fetch('/api/interview/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, status: 'abandoned' }),
        })
      } catch (error) {
        console.error('Failed to end session:', error)
      }
    }

    reset()
    router.push(`/interview/${projectId}/complete`)
  }, [sessionId, projectId, router, reset])

  // Handle stop button
  const handleStop = useCallback(() => {
    onShowCompletionModal()
  }, [onShowCompletionModal])

  // Handle volume toggle
  const handleVolumeToggle = useCallback(() => {
    const manager = getConnectionManager()
    const newMuted = !isOutputMuted
    setIsOutputMuted(newMuted)
    manager.setOutputMuted(newMuted)
  }, [isOutputMuted])

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600">
        <ConnectionStatus
          status={connectionStatus}
          className="text-white [&_span]:text-white"
        />
        <div className="flex items-center gap-2">
          <IconButton
            icon={
              isOutputMuted ? (
                <VolumeOffIcon className="w-5 h-5" />
              ) : (
                <VolumeUpIcon className="w-5 h-5" />
              )
            }
            label={isOutputMuted ? 'Geluid aan' : 'Geluid uit'}
            onClick={handleVolumeToggle}
            className="text-white hover:bg-white/20"
          />
          <IconButton
            icon={<StopIcon className="w-5 h-5" />}
            label="Stop interview"
            onClick={handleStop}
            className="text-white hover:bg-red-500/80 bg-red-500/60"
          />
        </div>
      </div>

      {/* Connection error banner */}
      {connectionError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <p className="text-sm text-red-600">{connectionError}</p>
        </div>
      )}

      {/* Connecting banner */}
      {connectionStatus === 'connecting' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-yellow-700">Verbinding maken met AI...</p>
        </div>
      )}

      {/* Transcript */}
      <TranscriptView
        messages={transcript}
        isAISpeaking={connectionStatus === 'speaking'}
        className="flex-1"
      />

      {/* Status bar */}
      <StatusBar
        status={connectionStatus}
        onEndInterview={handleEndInterview}
      />
    </div>
  )
}
