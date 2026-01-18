'use client'

import { useEffect, useCallback } from 'react'
import { Button } from '@/components/atoms/Button/Button'
import { CheckCircleIcon } from '@/components/atoms/Icon/icons'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface InterviewCompleteModalProps {
  isOpen: boolean
  onContinue: () => void
  onFinish: () => void
  isFinishing?: boolean
}

export function InterviewCompleteModal({
  isOpen,
  onContinue,
  onFinish,
  isFinishing = false,
}: InterviewCompleteModalProps) {
  const focusRef = useFocusTrap<HTMLDivElement>(isOpen)

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onContinue()
      }
    },
    [onContinue]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onContinue}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={focusRef}
        className="relative bg-white rounded-xl shadow-xl w-full max-w-md animate-slide-up p-6"
      >
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircleIcon className="w-10 h-10 text-green-500" />
        </div>

        {/* Title */}
        <h2
          id="completion-modal-title"
          className="text-xl font-semibold text-gray-900 text-center mb-2"
        >
          Interview Afgerond
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          De AI heeft het interview afgerond. Wil je nog iets toevoegen?
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            variant="secondary"
            onClick={onContinue}
            className="w-full"
            disabled={isFinishing}
          >
            Ja, ik wil nog iets zeggen
          </Button>
          <Button
            onClick={onFinish}
            className="w-full"
            disabled={isFinishing}
            loading={isFinishing}
          >
            {isFinishing ? 'Bezig met afsluiten...' : 'Nee, interview afsluiten'}
          </Button>
        </div>
      </div>
    </div>
  )
}
