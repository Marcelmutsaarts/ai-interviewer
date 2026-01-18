import type { ConnectionStatus } from '@/stores/interviewStore'

/**
 * Shared configuration for interview connection status display.
 * Used by both ConnectionStatus and StatusBar components.
 */

export interface StatusConfig {
  color: string
  label: string
  statusText: string
  pulse: boolean
}

export const STATUS_CONFIG: Record<ConnectionStatus, StatusConfig> = {
  disconnected: {
    color: 'bg-gray-400',
    label: 'Niet verbonden',
    statusText: 'Niet verbonden',
    pulse: false,
  },
  connecting: {
    color: 'bg-yellow-400',
    label: 'Verbinden...',
    statusText: 'Verbinding maken met AI...',
    pulse: true,
  },
  connected: {
    color: 'bg-green-500',
    label: 'Verbonden',
    statusText: 'Verbonden - Microfoon actief',
    pulse: true,
  },
  speaking: {
    color: 'bg-blue-500',
    label: 'AI spreekt',
    statusText: 'AI is aan het spreken...',
    pulse: true,
  },
  listening: {
    color: 'bg-red-500',
    label: 'Luistert...',
    statusText: 'Spreek nu - je wordt gehoord',
    pulse: true,
  },
  error: {
    color: 'bg-red-600',
    label: 'Fout',
    statusText: 'Verbindingsfout opgetreden',
    pulse: false,
  },
}
