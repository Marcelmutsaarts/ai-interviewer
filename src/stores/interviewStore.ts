'use client'

import { create } from 'zustand'
import type { UITranscriptMessage } from '@/types/database'

// Connection status types for the voice interview
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'speaking'
  | 'listening'
  | 'error'

// Re-export UITranscriptMessage as TranscriptMessage for backward compatibility
export type TranscriptMessage = UITranscriptMessage

interface InterviewState {
  // Connection state
  connectionStatus: ConnectionStatus
  sessionId: string | null

  // Audio state
  isAudioMuted: boolean

  // Conversation state
  transcript: TranscriptMessage[]
  // Sequence counter for message ordering (prevents timestamp collision issues)
  messageSequence: number

  // UI state
  showCompletionModal: boolean

  // Error state
  error: string | null
}

interface InterviewActions {
  // Connection actions
  setConnectionStatus: (status: ConnectionStatus) => void
  setSessionId: (sessionId: string | null) => void

  // Audio actions
  toggleMute: () => void
  setAudioMuted: (muted: boolean) => void

  // Message actions
  addMessage: (message: Omit<TranscriptMessage, 'id' | 'timestamp' | 'sequenceNumber'>) => void
  updateLastMessage: (role: 'ai' | 'participant', content: string, isComplete?: boolean) => void

  // UI actions
  setShowCompletionModal: (show: boolean) => void

  // Error actions
  setError: (error: string | null) => void

  // Reset action
  reset: () => void
}

type InterviewStore = InterviewState & InterviewActions

const initialState: InterviewState = {
  connectionStatus: 'disconnected',
  sessionId: null,
  isAudioMuted: false,
  transcript: [],
  messageSequence: 0,
  showCompletionModal: false,
  error: null,
}

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  // Initial state
  ...initialState,

  // Connection actions
  setConnectionStatus: (status: ConnectionStatus) => {
    set({ connectionStatus: status })
    // Clear error when connection is established
    if (status === 'connected') {
      set({ error: null })
    }
  },

  setSessionId: (sessionId: string | null) => {
    set({ sessionId })
  },

  // Audio actions
  toggleMute: () => {
    set((state) => ({ isAudioMuted: !state.isAudioMuted }))
  },

  setAudioMuted: (muted: boolean) => {
    set({ isAudioMuted: muted })
  },

  // Message actions
  addMessage: (message: Omit<TranscriptMessage, 'id' | 'timestamp' | 'sequenceNumber'>) => {
    const state = get()
    const nextSequence = state.messageSequence + 1
    const newMessage: TranscriptMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      sequenceNumber: nextSequence,
    }
    set({
      transcript: [...state.transcript, newMessage],
      messageSequence: nextSequence,
    })
  },

  updateLastMessage: (role: 'ai' | 'participant', content: string, isComplete?: boolean) => {
    set((state) => {
      const transcript = [...state.transcript]
      // Find the last message with the given role
      for (let i = transcript.length - 1; i >= 0; i--) {
        if (transcript[i].role === role && !transcript[i].isComplete) {
          transcript[i] = {
            ...transcript[i],
            content,
            isComplete: isComplete ?? transcript[i].isComplete,
          }
          break
        }
      }
      return { transcript }
    })
  },

  // UI actions
  setShowCompletionModal: (show: boolean) => {
    set({ showCompletionModal: show })
  },

  // Error actions
  setError: (error: string | null) => {
    set({ error })
  },

  // Reset action
  reset: () => {
    set(initialState)
  },
}))
