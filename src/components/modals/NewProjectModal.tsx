'use client'

import { useState, FormEvent } from 'react'
import { Modal } from './Modal'
import { FormField } from '@/components/molecules/FormField/FormField'
import { TextInput, TextArea, Button } from '@/components/atoms'
import { createProjectSchema } from '@/lib/validation/schemas'

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (projectId: string) => void
}

export function NewProjectModal({ isOpen, onClose, onSuccess }: NewProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate with Zod
    const parseResult = createProjectSchema.safeParse({
      name: name.trim(),
      description: description.trim() || null,
    })

    if (!parseResult.success) {
      setError(parseResult.error.issues[0].message)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create project')
      }

      const project = await response.json()
      onSuccess(project.id)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan. Probeer het opnieuw.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nieuw Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Projectnaam"
          htmlFor="project-name"
          required
          error={error}
        >
          <TextInput
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bijv. Stage Evaluaties 2024"
            error={!!error}
          />
        </FormField>

        <FormField label="Beschrijving" htmlFor="project-description">
          <TextArea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optionele beschrijving van dit project"
            rows={3}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Annuleren
          </Button>
          <Button type="submit" loading={isLoading}>
            Aanmaken & Configureren
          </Button>
        </div>
      </form>
    </Modal>
  )
}
