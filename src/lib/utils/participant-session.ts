import { randomBytes, createHmac, timingSafeEqual } from 'crypto'

const PARTICIPANT_TOKEN_COOKIE_NAME = 'participant_session_token'
const TOKEN_EXPIRY_HOURS = 24

/**
 * Generates a secure token for participant session ownership validation.
 * The token is tied to a specific session ID to prevent unauthorized access.
 *
 * @param sessionId - The session ID to bind the token to
 * @returns A secure token string
 */
export function generateParticipantToken(sessionId: string): string {
  const secret = process.env.PARTICIPANT_TOKEN_SECRET || process.env.ADMIN_PASSWORD_HASH || 'fallback-secret'
  const timestamp = Date.now()
  const randomPart = randomBytes(16).toString('hex')

  // Create a payload with session ID, timestamp, and random component
  const payload = `${sessionId}:${timestamp}:${randomPart}`

  // Sign the payload with HMAC
  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  // Return combined token (base64 encoded for cookie safety)
  return Buffer.from(`${payload}:${signature}`).toString('base64')
}

/**
 * Validates a participant token and checks if it matches the claimed session.
 *
 * @param token - The token to validate
 * @param sessionId - The session ID being accessed
 * @returns true if the token is valid for this session, false otherwise
 */
export function validateParticipantToken(token: string | undefined, sessionId: string): boolean {
  if (!token) {
    return false
  }

  try {
    const secret = process.env.PARTICIPANT_TOKEN_SECRET || process.env.ADMIN_PASSWORD_HASH || 'fallback-secret'

    // Decode the token
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const parts = decoded.split(':')

    if (parts.length !== 4) {
      return false
    }

    const [tokenSessionId, timestampStr, randomPart, providedSignature] = parts

    // Check session ID matches
    if (tokenSessionId !== sessionId) {
      return false
    }

    // Check timestamp is not expired
    const timestamp = parseInt(timestampStr, 10)
    const expiryMs = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
    if (Date.now() - timestamp > expiryMs) {
      return false
    }

    // Verify signature
    const payload = `${tokenSessionId}:${timestampStr}:${randomPart}`
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    // Use timing-safe comparison to prevent timing attacks
    const providedBuffer = Buffer.from(providedSignature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')

    if (providedBuffer.length !== expectedBuffer.length) {
      return false
    }

    return timingSafeEqual(providedBuffer, expectedBuffer)
  } catch {
    // Any error during validation means invalid token
    return false
  }
}

/**
 * Gets the cookie options for setting the participant token.
 */
export function getParticipantTokenCookieOptions() {
  return {
    name: PARTICIPANT_TOKEN_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: TOKEN_EXPIRY_HOURS * 60 * 60, // 24 hours in seconds
    path: '/',
  }
}

export { PARTICIPANT_TOKEN_COOKIE_NAME }
