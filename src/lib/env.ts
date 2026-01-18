import { z } from 'zod'

/**
 * Environment variables schema for server-side validation.
 * This ensures all required environment variables are present and correctly formatted.
 */
const serverEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL moet een geldige URL zijn'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is verplicht'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is verplicht'),

  // Google Gemini API (accept either GOOGLE_GEMINI_API_KEY or GOOGLE_API_KEY)
  GOOGLE_GEMINI_API_KEY: z
    .string()
    .min(1)
    .optional(),
  GOOGLE_API_KEY: z
    .string()
    .min(1)
    .optional(),

  // Auth
  ADMIN_PASSWORD_HASH: z
    .string()
    .min(1, 'ADMIN_PASSWORD_HASH is verplicht'),

  // App (optional)
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL moet een geldige URL zijn')
    .optional(),

  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
})

/**
 * Client-side environment variables schema.
 * These variables are exposed to the browser.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL moet een geldige URL zijn'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is verplicht'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL moet een geldige URL zijn')
    .optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>

/**
 * Validates server-side environment variables.
 * Should only be called on the server.
 *
 * @throws Error if any required environment variables are missing or invalid
 * @returns The validated environment variables
 */
export function validateServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    const errorMessages = Object.entries(errors)
      .map(([key, messages]) => `  - ${key}: ${messages?.join(', ')}`)
      .join('\n')

    console.error('Ongeldige omgevingsvariabelen:')
    console.error(errorMessages)

    throw new Error(
      `Ongeldige omgevingsvariabelen:\n${errorMessages}`
    )
  }

  return result.data
}

/**
 * Validates client-side environment variables.
 * Safe to call from both client and server.
 *
 * @throws Error if any required environment variables are missing or invalid
 * @returns The validated environment variables
 */
export function validateClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  })

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    const errorMessages = Object.entries(errors)
      .map(([key, messages]) => `  - ${key}: ${messages?.join(', ')}`)
      .join('\n')

    console.error('Ongeldige client omgevingsvariabelen:')
    console.error(errorMessages)

    throw new Error(
      `Ongeldige client omgevingsvariabelen:\n${errorMessages}`
    )
  }

  return result.data
}

/**
 * Get validated environment variables.
 * Validates on first access and caches the result.
 */
let cachedServerEnv: ServerEnv | null = null
let cachedClientEnv: ClientEnv | null = null

export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv kan alleen op de server worden aangeroepen')
  }

  if (!cachedServerEnv) {
    cachedServerEnv = validateServerEnv()
  }

  return cachedServerEnv
}

export function getClientEnv(): ClientEnv {
  if (!cachedClientEnv) {
    cachedClientEnv = validateClientEnv()
  }

  return cachedClientEnv
}

// Validate environment variables on server startup in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  validateServerEnv()
}
