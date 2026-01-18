'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Admin {
  id: string
  name: string
}

interface AuthState {
  admin: Admin | null
  isLoading: boolean
  isInitialized: boolean
}

interface AuthActions {
  login: (name: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkSession: () => Promise<boolean>
  setAdmin: (admin: Admin | null) => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      admin: null,
      isLoading: false,
      isInitialized: false,

      // Actions
      login: async (name: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, password }),
          })

          const data = await response.json()

          if (!response.ok) {
            set({ isLoading: false })
            return { success: false, error: data.error || 'Inloggen mislukt' }
          }

          set({
            admin: data.admin,
            isLoading: false,
            isInitialized: true,
          })

          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Verbindingsfout. Probeer het opnieuw.' }
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
          })
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({
            admin: null,
            isLoading: false,
            isInitialized: true,
          })
        }
      },

      checkSession: async () => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/session')
          const data = await response.json()

          if (response.ok && data.admin) {
            set({
              admin: data.admin,
              isLoading: false,
              isInitialized: true,
            })
            return true
          }

          set({
            admin: null,
            isLoading: false,
            isInitialized: true,
          })
          return false
        } catch (error) {
          set({
            admin: null,
            isLoading: false,
            isInitialized: true,
          })
          return false
        }
      },

      setAdmin: (admin: Admin | null) => {
        set({ admin, isInitialized: true })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ admin: state.admin }),
    }
  )
)
