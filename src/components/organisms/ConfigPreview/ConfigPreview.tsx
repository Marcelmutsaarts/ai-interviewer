'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/atoms/Button/Button'
import { TextArea } from '@/components/atoms/Input/TextArea'
import { TextInput } from '@/components/atoms/Input/TextInput'
import { Select } from '@/components/atoms/Input/Select'
import { CopyButton } from '@/components/molecules/ActionButtons/CopyButton'
import { PencilIcon } from '@/components/atoms/Icon/icons'
import { TONE_OF_VOICE_OPTIONS, MAX_QUESTIONS_MIN, MAX_QUESTIONS_MAX } from '@/lib/utils/constants'
import type { Configuration, ToneOfVoice } from '@/types/database'

interface ConfigPreviewProps {
  configuration: Configuration | null
  projectId: string
  onSave: () => void
  onTest: () => void
  isSaving?: boolean
  onConfigurationUpdate?: (config: Partial<Configuration>) => Promise<void>
  isUpdating?: boolean
}

export function ConfigPreview({
  configuration,
  projectId,
  onSave,
  onTest,
  isSaving = false,
  onConfigurationUpdate,
  isUpdating = false,
}: ConfigPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [goalError, setGoalError] = useState('')
  const [editedConfig, setEditedConfig] = useState({
    goal: '',
    tone_of_voice: 'friendly' as ToneOfVoice,
    max_questions: 8,
    welcome_message: '',
    closing_message: '',
  })

  // Initialize editedConfig when configuration changes
  useEffect(() => {
    if (configuration) {
      setEditedConfig({
        goal: configuration.goal || configuration.interview_goal || '',
        tone_of_voice: configuration.tone_of_voice || 'friendly',
        max_questions: configuration.max_questions || 8,
        welcome_message: configuration.welcome_message || '',
        closing_message: configuration.closing_message || '',
      })
    }
  }, [configuration])

  const interviewUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/interview/${projectId}`
  const toneLabel = TONE_OF_VOICE_OPTIONS.find(t => t.value === configuration?.tone_of_voice)?.label || configuration?.tone_of_voice

  const handleSave = async () => {
    if (!editedConfig.goal?.trim()) {
      setGoalError('Doel is verplicht')
      return
    }
    setGoalError('')
    if (onConfigurationUpdate) {
      await onConfigurationUpdate(editedConfig)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    // Reset to original values
    if (configuration) {
      setEditedConfig({
        goal: configuration.goal || configuration.interview_goal || '',
        tone_of_voice: configuration.tone_of_voice || 'friendly',
        max_questions: configuration.max_questions || 8,
        welcome_message: configuration.welcome_message || '',
        closing_message: configuration.closing_message || '',
      })
    }
    setGoalError('')
    setIsEditing(false)
  }

  const handleInputChange = (field: keyof typeof editedConfig, value: string | number) => {
    if (field === 'goal') {
      setGoalError('')
    }
    setEditedConfig(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  if (!configuration?.is_complete) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div>
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">&#128172;</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Configuratie wordt opgebouwd</h3>
          <p className="text-sm text-gray-500">
            Chat met de AI assistent om je interview te configureren.
            De preview verschijnt hier zodra de configuratie compleet is.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Configuratie Preview</h3>
        {onConfigurationUpdate && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 py-1"
            aria-label="Bewerken"
          >
            <PencilIcon className="w-4 h-4" />
            <span>Bewerken</span>
          </button>
        )}
      </div>

      {/* Settings Summary */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Doel</label>
          {isEditing ? (
            <>
              <TextArea
                value={editedConfig.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
                rows={3}
                className={`mt-1 ${goalError ? 'border-red-500' : ''}`}
                placeholder="Beschrijf het doel van dit interview..."
              />
              {goalError && (
                <p className="text-sm text-red-600 mt-1">{goalError}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-900 mt-1">{configuration.goal || configuration.interview_goal || '-'}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tone of voice</label>
            {isEditing ? (
              <Select
                value={editedConfig.tone_of_voice}
                onChange={(e) => handleInputChange('tone_of_voice', e.target.value as ToneOfVoice)}
                options={TONE_OF_VOICE_OPTIONS}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-900 mt-1">{toneLabel}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Max vragen</label>
            {isEditing ? (
              <TextInput
                type="number"
                value={editedConfig.max_questions}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10)
                  if (!isNaN(value)) {
                    const clampedValue = Math.min(Math.max(value, MAX_QUESTIONS_MIN), MAX_QUESTIONS_MAX)
                    handleInputChange('max_questions', clampedValue)
                  }
                }}
                min={MAX_QUESTIONS_MIN}
                max={MAX_QUESTIONS_MAX}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-900 mt-1">{configuration.max_questions}</p>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Welkomstbericht</label>
          {isEditing ? (
            <TextArea
              value={editedConfig.welcome_message}
              onChange={(e) => handleInputChange('welcome_message', e.target.value)}
              rows={2}
              className="mt-1"
              placeholder="Welkomstbericht voor de deelnemer..."
            />
          ) : (
            <p className="text-sm text-gray-900 mt-1 italic">&quot;{configuration.welcome_message || '-'}&quot;</p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Afsluitbericht</label>
          {isEditing ? (
            <TextArea
              value={editedConfig.closing_message}
              onChange={(e) => handleInputChange('closing_message', e.target.value)}
              rows={2}
              className="mt-1"
              placeholder="Afsluitbericht voor de deelnemer..."
            />
          ) : (
            <p className="text-sm text-gray-900 mt-1 italic">&quot;{configuration.closing_message || '-'}&quot;</p>
          )}
        </div>

        {configuration.topics && configuration.topics.length > 0 && !isEditing && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Onderwerpen</label>
            <ul className="text-sm text-gray-900 mt-1 list-disc list-inside">
              {configuration.topics.map((topic, i) => (
                <li key={i}>{topic}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Collapsible system prompt - only show when not editing */}
        {!isEditing && (
          <div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              className="text-xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            >
              Systeem prompt
              <span className="transform transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : '' }}>
                &#9660;
              </span>
            </button>
            {isExpanded && (
              <pre className="text-xs text-gray-700 mt-2 p-3 bg-gray-50 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                {configuration.system_prompt}
              </pre>
            )}
          </div>
        )}

        {/* Edit mode action buttons */}
        {isEditing && (
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={isUpdating}
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button
              onClick={handleSave}
              loading={isUpdating}
              className="flex-1"
            >
              Wijzigingen opslaan
            </Button>
          </div>
        )}
      </div>

      {/* Interview Link - only show when not editing */}
      {!isEditing && (
        <div className="border-t border-gray-200 pt-4 mt-auto">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Interview Link</label>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={interviewUrl}
              readOnly
              aria-label="Interview link"
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 truncate"
            />
            <CopyButton text={interviewUrl} />
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="secondary" onClick={onTest} className="flex-1">
              Interview testen
            </Button>
            <Button onClick={onSave} loading={isSaving} className="flex-1">
              Opslaan &amp; Afsluiten
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
