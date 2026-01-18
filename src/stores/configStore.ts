'use client'

import { create } from 'zustand'
import type { Configuration } from '@/types/database'

export interface ConfigMessage {
  id: string
  role: 'admin' | 'assistant'
  content: string
  timestamp: Date
}

interface ConfigState {
  configuration: Configuration | null
  chatHistory: ConfigMessage[]
  isLoading: boolean
  configMethod: 'ai_chat' | 'direct_input' | null
}

interface ConfigActions {
  setConfiguration: (config: Configuration) => void
  setChatHistory: (messages: ConfigMessage[]) => void
  addChatMessage: (message: ConfigMessage) => void
  setConfigMethod: (method: 'ai_chat' | 'direct_input') => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

type ConfigStore = ConfigState & ConfigActions

const initialState: ConfigState = {
  configuration: null,
  chatHistory: [],
  isLoading: false,
  configMethod: null,
}

export const useConfigStore = create<ConfigStore>((set) => ({
  ...initialState,

  setConfiguration: (config) => set({ configuration: config }),

  setChatHistory: (messages) => set({ chatHistory: messages }),

  addChatMessage: (message) => set((state) => ({
    chatHistory: [...state.chatHistory, message]
  })),

  setConfigMethod: (method) => set({ configMethod: method }),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () => set(initialState),
}))
