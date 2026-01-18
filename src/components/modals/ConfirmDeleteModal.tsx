'use client'

import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from '@/components/atoms'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  projectName: string
  error?: string | null
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  error,
}: ConfirmDeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      // Only close if there's no error (parent controls this now)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Verwijderen" size="sm">
      <div className="space-y-4">
        <p className="text-gray-600">
          Weet je zeker dat je <span className="font-semibold">{projectName}</span> wilt
          verwijderen? Alle interviews en data worden permanent verwijderd.
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
