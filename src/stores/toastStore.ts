import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

// Store timer references to prevent memory leaks
const timerMap = new Map<string, ReturnType<typeof setTimeout>>()

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))

    // Auto remove after duration
    const timerId = setTimeout(() => {
      timerMap.delete(id)
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, toast.duration || 5000)

    // Store the timer reference
    timerMap.set(id, timerId)
  },

  removeToast: (id) => {
    // Clear the timer if it exists to prevent memory leak
    const timerId = timerMap.get(id)
    if (timerId) {
      clearTimeout(timerId)
      timerMap.delete(id)
    }

    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))
