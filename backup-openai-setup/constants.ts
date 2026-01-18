export const TONE_OF_VOICE_OPTIONS = [
  { value: 'friendly', label: 'Vriendelijk' },
  { value: 'formal', label: 'Formeel' },
  { value: 'informal', label: 'Informeel' },
  { value: 'neutral', label: 'Neutraal' },
  { value: 'empathetic', label: 'Empathisch' },
] as const

export const SESSION_STATUS_LABELS = {
  active: 'Actief',
  completed: 'Voltooid',
  abandoned: 'Afgebroken',
} as const

export const PROJECT_STATUS_LABELS = {
  active: 'Actief',
  inactive: 'Inactief',
} as const

export const MAX_QUESTIONS_MIN = 1
export const MAX_QUESTIONS_MAX = 20
export const MAX_QUESTIONS_DEFAULT = 8

export const CLOSING_KEYWORDS = [
  'bedankt voor',
  'fijne dag',
  'succes',
  'tot ziens',
  'prettige dag',
  'veel succes',
]

// AI model configuration
// Chat uses OpenRouter for Gemini models (OpenAI-compatible API)
// Realtime uses OpenAI directly (OpenAI's Realtime API is proprietary WebRTC-based)

/**
 * Chat model for text-based AI interactions via OpenRouter.
 * Used for: configuration chat, CSV export clustering, etc.
 * Format: provider/model-name (OpenRouter format)
 */
export const OPENROUTER_CHAT_MODEL = 'google/gemini-3-pro-preview'

/**
 * OpenAI Realtime API model for voice interviews.
 * Must use OpenAI directly as Realtime API is not available via OpenRouter.
 * Can be overridden via OPENAI_REALTIME_MODEL environment variable.
 */
export const OPENAI_REALTIME_MODEL_DEFAULT = 'gpt-4o-realtime-preview-2024-12-17'

/**
 * OpenRouter API base URL for chat completions.
 */
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

// Magic numbers for closing detection in connection-manager.ts
export const CLOSING_MESSAGE_MATCH_LENGTH = 20
export const CLOSING_DETECTION_DELAY_MS = 3000

// Additional instructions appended to the system prompt for voice interviews
export const INTERVIEW_SYSTEM_ADDITIONS = `

INTERVIEW INSTRUCTIES:
- Je voert een interview via spraak
- Luister actief en stel doorvragen waar relevant
- Houd je antwoorden beknopt (2-3 zinnen per beurt)
- Wees empathisch en geinteresseerd
- Tel het aantal vragen dat je stelt
- Als je het maximum aantal vragen hebt gesteld, rond dan netjes af
- Gebruik het afsluitbericht dat is geconfigureerd wanneer je het interview afsluit
- Spreek duidelijk en in een natuurlijk tempo
- Wacht op het antwoord van de deelnemer voordat je verdergaat
`
