'use client'

import { useState } from 'react'
import { Button } from '@/components/atoms/Button/Button'
import { TextInput } from '@/components/atoms/Input/TextInput'
import { TextArea } from '@/components/atoms/Input/TextArea'
import { Select } from '@/components/atoms/Input/Select'
import { TONE_OF_VOICE_OPTIONS, MAX_QUESTIONS_DEFAULT } from '@/lib/utils/constants'
import { directInputConfigSchema, type DirectInputConfigInput } from '@/lib/validation/schemas'
import { generateConfiguration } from '@/lib/ai/configuration-generator'

interface DirectInputFormProps {
  onGenerate: (config: ReturnType<typeof generateConfiguration> & DirectInputConfigInput) => void
  isGenerating?: boolean
  initialValues?: Partial<DirectInputConfigInput>
}

export function DirectInputForm({ onGenerate, isGenerating, initialValues }: DirectInputFormProps) {
  const [formData, setFormData] = useState<DirectInputConfigInput>({
    interviewGoal: initialValues?.interviewGoal || '',
    topicsQuestions: initialValues?.topicsQuestions || '',
    toneOfVoice: initialValues?.toneOfVoice || 'friendly',
    maxQuestions: initialValues?.maxQuestions || MAX_QUESTIONS_DEFAULT,
    welcomeMessage: initialValues?.welcomeMessage || '',
    closingMessage: initialValues?.closingMessage || '',
    extraInstructions: initialValues?.extraInstructions || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof DirectInputConfigInput, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate
    const result = directInputConfigSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    // Generate configuration
    const generated = generateConfiguration(result.data)
    onGenerate({ ...result.data, ...generated })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {/* Interview Goal */}
      <div>
        <label htmlFor="interview-goal" className="block text-sm font-medium text-gray-700 mb-1">
          Interview doel <span className="text-error-500">*</span>
        </label>
        <TextArea
          id="interview-goal"
          value={formData.interviewGoal}
          onChange={(e) => handleChange('interviewGoal', e.target.value)}
          placeholder={"Wat wil je bereiken met dit interview? Beschrijf het doel en de context.\n\nVoorbeeld: Inzicht krijgen in de stage-ervaringen van studenten. We willen weten wat ze geleerd hebben en waar verbeterpunten liggen voor toekomstige stageplekken."}
          rows={4}
          error={!!errors.interviewGoal}
        />
        {errors.interviewGoal && (
          <p className="mt-1 text-sm text-error-600">{errors.interviewGoal}</p>
        )}
      </div>

      {/* Topics/Questions */}
      <div>
        <label htmlFor="topics" className="block text-sm font-medium text-gray-700 mb-1">
          Onderwerpen / Vragen <span className="text-error-500">*</span>
        </label>
        <TextArea
          id="topics"
          value={formData.topicsQuestions}
          onChange={(e) => handleChange('topicsQuestions', e.target.value)}
          placeholder={"Welke onderwerpen of specifieke vragen moeten aan bod komen?\n\nVoorbeeld:\n- Wat waren de belangrijkste leermomenten?\n- Welke vaardigheden heb je ontwikkeld?\n- Wat ging goed in de begeleiding?\n- Wat kon beter aan de stageplek?"}
          rows={6}
          error={!!errors.topicsQuestions}
        />
        {errors.topicsQuestions && (
          <p className="mt-1 text-sm text-error-600">{errors.topicsQuestions}</p>
        )}
      </div>

      {/* Tone and Max Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tone-of-voice" className="block text-sm font-medium text-gray-700 mb-1">
            Tone of voice <span className="text-error-500">*</span>
          </label>
          <Select
            id="tone-of-voice"
            value={formData.toneOfVoice}
            onChange={(e) => handleChange('toneOfVoice', e.target.value)}
            options={TONE_OF_VOICE_OPTIONS}
            error={!!errors.toneOfVoice}
          />
          {errors.toneOfVoice && (
            <p className="mt-1 text-sm text-error-600">{errors.toneOfVoice}</p>
          )}
        </div>

        <div>
          <label htmlFor="max-questions" className="block text-sm font-medium text-gray-700 mb-1">
            Max vragen <span className="text-error-500">*</span>
          </label>
          <TextInput
            id="max-questions"
            type="number"
            min={1}
            max={20}
            value={formData.maxQuestions}
            onChange={(e) => handleChange('maxQuestions', parseInt(e.target.value) || MAX_QUESTIONS_DEFAULT)}
            error={!!errors.maxQuestions}
          />
          {errors.maxQuestions && (
            <p className="mt-1 text-sm text-error-600">{errors.maxQuestions}</p>
          )}
        </div>
      </div>

      {/* Optional: Welcome Message */}
      <div>
        <label htmlFor="welcome-message" className="block text-sm font-medium text-gray-700 mb-1">
          Welkomstbericht <span className="text-gray-400 font-normal">(optioneel)</span>
        </label>
        <TextArea
          id="welcome-message"
          value={formData.welcomeMessage || ''}
          onChange={(e) => handleChange('welcomeMessage', e.target.value)}
          placeholder="Laat leeg om automatisch te genereren op basis van de tone of voice"
          rows={2}
          error={!!errors.welcomeMessage}
        />
        {errors.welcomeMessage && (
          <p className="mt-1 text-sm text-error-600">{errors.welcomeMessage}</p>
        )}
      </div>

      {/* Optional: Closing Message */}
      <div>
        <label htmlFor="closing-message" className="block text-sm font-medium text-gray-700 mb-1">
          Afsluitbericht <span className="text-gray-400 font-normal">(optioneel)</span>
        </label>
        <TextArea
          id="closing-message"
          value={formData.closingMessage || ''}
          onChange={(e) => handleChange('closingMessage', e.target.value)}
          placeholder="Laat leeg om automatisch te genereren"
          rows={2}
          error={!!errors.closingMessage}
        />
        {errors.closingMessage && (
          <p className="mt-1 text-sm text-error-600">{errors.closingMessage}</p>
        )}
      </div>

      {/* Optional: Extra Instructions */}
      <div>
        <label htmlFor="extra-instructions" className="block text-sm font-medium text-gray-700 mb-1">
          Extra instructies <span className="text-gray-400 font-normal">(optioneel)</span>
        </label>
        <TextArea
          id="extra-instructions"
          value={formData.extraInstructions || ''}
          onChange={(e) => handleChange('extraInstructions', e.target.value)}
          placeholder={"Aanvullende instructies voor de AI interviewer.\n\nVoorbeeld: Vraag door op emotionele ervaringen. Als de deelnemer negatief is, vraag dan naar concrete voorbeelden."}
          rows={3}
          error={!!errors.extraInstructions}
        />
        {errors.extraInstructions && (
          <p className="mt-1 text-sm text-error-600">{errors.extraInstructions}</p>
        )}
      </div>

      {/* Submit */}
      <div className="pt-4">
        <Button type="submit" loading={isGenerating} fullWidth size="lg">
          Configuratie Genereren
        </Button>
      </div>
    </form>
  )
}
