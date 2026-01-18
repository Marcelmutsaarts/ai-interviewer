'use client'

import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from '@/components/atoms'

interface ConfirmDeleteSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  sessionDate: string
  error?: string | null
}

export function ConfirmDeleteSessionModal({
  isOpen,
  onClose,
  onConfirm,
  sessionDate,
  error,
}: ConfirmDeleteSessionModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sessie Verwijderen" size="sm">
      <div className="space-y-4">
        <p className="text-gray-600">
          Weet je zeker dat je deze sessie van{' '}
          <span className="font-semibold">{sessionDate}</span> wilt verwijderen? Het
          transcript en alle bijbehorende data worden permanent verwijderd.
        </p>

        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-3">
            <p className="text-sm text-error-700" role="alert">
              {error}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Annuleren
          </Button>
          <Button variant="danger" onClick={handleConfirm} loading={isLoading}>
            Verwijderen
          </Button>
        </div>
      </div>
    </Modal>
  )
}
