/**
 * Simple in-memory rate limiter for API endpoints.
 * Uses a sliding window approach with automatic cleanup.
 *
 * Note: This is suitable for single-instance deployments.
 * For multi-instance deployments, consider using Redis or similar.
 */

interface RateLimitEntry {
  timestamps: number[]
  lastCleanup: number
}

interface RateLimiterOptions {
  /** Maximum number of requests allowed within the window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
  /** Cleanup interval in milliseconds (default: 60000 = 1 minute) */
  cleanupIntervalMs?: number
}

class RateLimiter {
  private entries: Map<string, RateLimitEntry> = new Map()
  private maxRequests: number
  private windowMs: number
  private cleanupIntervalMs: number
  private lastGlobalCleanup: number = Date.now()

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests
    this.windowMs = options.windowMs
    this.cleanupIntervalMs = options.cleanupIntervalMs ?? 60000
  }

  /**
   * Check if a key is rate limited and record the attempt if not.
   * @param key - Unique identifier (e.g., IP address, project ID)
   * @returns true if the request is allowed, false if rate limited
   */
  isAllowed(key: string): boolean {
    const now = Date.now()

    // Periodically cleanup old entries
    if (now - this.lastGlobalCleanup > this.cleanupIntervalMs) {
      this.cleanup()
      this.lastGlobalCleanup = now
    }

    let entry = this.entries.get(key)

    if (!entry) {
      entry = { timestamps: [], lastCleanup: now }
      this.entries.set(key, entry)
    }

    // Remove timestamps outside the current window
    const windowStart = now - this.windowMs
    entry.timestamps = entry.timestamps.filter(ts => ts > windowStart)
    entry.lastCleanup = now

    // Check if under limit
    if (entry.timestamps.length < this.maxRequests) {
      entry.timestamps.push(now)
      return true
    }

    return false
  }

  /**
   * Get remaining requests for a key
   * @param key - Unique identifier
   * @returns Number of remaining requests in the current window
   */
  getRemainingRequests(key: string): number {
    const now = Date.now()
    const entry = this.entries.get(key)

    if (!entry) {
      return this.maxRequests
    }

    const windowStart = now - this.windowMs
    const validTimestamps = entry.timestamps.filter(ts => ts > windowStart)

    return Math.max(0, this.maxRequests - validTimestamps.length)
  }

  /**
   * Get the time until the rate limit resets for a key
   * @param key - Unique identifier
   * @returns Milliseconds until the oldest request expires, or 0 if not limited
   */
  getTimeUntilReset(key: string): number {
    const now = Date.now()
    const entry = this.entries.get(key)

    if (!entry || entry.timestamps.length === 0) {
      return 0
    }

    const windowStart = now - this.windowMs
    const validTimestamps = entry.timestamps.filter(ts => ts > windowStart)

    if (validTimestamps.length < this.maxRequests) {
      return 0
    }

    const oldestTimestamp = Math.min(...validTimestamps)
    return Math.max(0, oldestTimestamp + this.windowMs - now)
  }

  /**
   * Remove old entries that haven't been accessed recently
   */
  private cleanup(): void {
    const now = Date.now()
    const staleThreshold = now - this.windowMs * 2

    for (const [key, entry] of this.entries.entries()) {
      if (entry.lastCleanup < staleThreshold && entry.timestamps.length === 0) {
        this.entries.delete(key)
      }
    }
  }

  /**
   * Reset the rate limiter (useful for testing)
   */
  reset(): void {
    this.entries.clear()
    this.lastGlobalCleanup = Date.now()
  }
}

// Pre-configured rate limiters for different purposes

/** Rate limiter for login attempts: 5 requests per minute per IP */
export const loginRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
})

/** Rate limiter for interview tokens: 10 tokens per minute per project */
export const tokenRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
})

/**
 * Extract client IP from request headers.
 * Handles various proxy configurations.
 */
export function getClientIp(request: Request): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Vercel-specific header
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for')
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim()
  }

  // Fallback for development or direct connections
  return 'unknown'
}

export { RateLimiter }
export type { RateLimiterOptions }
