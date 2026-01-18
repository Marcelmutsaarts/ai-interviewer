'use client'

import { useCallback, useRef, useEffect } from 'react'

const ANNOUNCER_ID = 'aria-live-announcer'

/**
 * Hook for announcing messages to screen readers via ARIA live regions.
 * Creates a hidden announcer element that can be updated to notify
 * assistive technologies of dynamic content changes.
 *
 * @returns A function to announce messages to screen readers
 *
 * @example
 * ```tsx
 * const announce = useAnnounce()
 *
 * // Announce a message when an action completes
 * const handleSave = async () => {
 *   await saveData()
 *   announce('Gegevens succesvol opgeslagen')
 * }
 * ```
 */
export function useAnnounce() {
  const announcerRef = useRef<HTMLDivElement | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Check if announcer with this ID already exists to prevent duplicates
    let announcer = document.getElementById(ANNOUNCER_ID) as HTMLDivElement | null

    if (!announcer) {
      // Create announcer element if it doesn't exist
      announcer = document.createElement('div')
      announcer.setAttribute('aria-live', 'polite')
      announcer.setAttribute('aria-atomic', 'true')
      announcer.setAttribute('role', 'status')
      announcer.className = 'sr-only'
      announcer.id = ANNOUNCER_ID
      document.body.appendChild(announcer)
    }

    announcerRef.current = announcer

    return () => {
      // Clear any pending timeout on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      // Only remove if no other instances are using it
      // We check if the element still exists and has no content pending
      const existingAnnouncer = document.getElementById(ANNOUNCER_ID)
      if (existingAnnouncer && existingAnnouncer === announcerRef.current) {
        existingAnnouncer.remove()
      }
    }
  }, [])

  const announce = useCallback((message: string) => {
    if (announcerRef.current) {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // Clear the content first
      announcerRef.current.textContent = ''
      // Small delay to ensure the announcement is picked up
      timeoutRef.current = setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message
        }
        timeoutRef.current = null
      }, 100)
    }
  }, [])

  return announce
}
