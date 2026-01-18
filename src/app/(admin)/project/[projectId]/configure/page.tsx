'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/atoms/Button/Button'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { ChevronLeftIcon, ChatBubbleIcon, DocumentTextIcon } from '@/components/atoms/Icon/icons'
import { ConfigPreview } from '@/components/organisms/ConfigPreview/ConfigPreview'
import { useConfiguration } from '@/hooks/useConfiguration'
import { useProject } from '@/hooks/useProject'
import { useConfigStore } from '@/stores/configStore'
import { useToastStore } from '@/stores/toastStore'
import { v4 as uuidv4 } from 'uuid'
import type { Configuration } from '@/types/database'
import { generateSystemPrompt } from '@/lib/ai/configuration-generator'

// Lazy load heavy components for better performance
const ChatWindow = dynamic(
  () => import('@/components/organisms/ChatWindow/ChatWindow').then(mod => ({ default: mod.ChatWindow })),
  {
    loading: () => (
      <div className="flex justify-center items-center py-8 h-full">
        <Spinner size="lg" />
      </div>
    ),
    ssr: false
  }
)

const DirectInputForm = dynamic(
  () => import('@/components/organisms/ConfigForm/DirectInputForm').then(mod => ({ default: mod.DirectInputForm })),
  {
    loading: () => (
      <div className="flex justify-center items-center py-8">
        <Spinner size="lg" />
      </div>
    ),
    ssr: false
  }
)

type ConfigMethod = 'ai_chat' | 'direct_input' | null

export default function ConfigurePage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string

  const { project, isLoading: projectLoading } = useProject(projectId)
  const { data: configuration, mutate: mutateConfig, isLoading: configLoading } = useConfiguration(projectId)

  const { chatHistory, setChatHistory, addChatMessage, setConfiguration } = useConfigStore()
  const addToast = useToastStore((state) => state.addToast)

  const [method, setMethod] = useState<ConfigMethod>(null)
  const [isAIChatLoading, setIsAIChatLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Load config method from configuration
  useEffect(() => {
    if (configuration) {
      setConfiguration(configuration)
      if (configuration.config_method) {
        setMethod(configuration.config_method)
      }
    }
  }, [configuration, setConfiguration])

  // Load chat history
  useEffect(() => {
    if (method === 'ai_chat' && projectId) {
      fetch(`/api/projects/${projectId}/config/chat/history`)
        .then(res => res.json())
        .then(data => {
          if (data.messages) {
            setChatHistory(data.messages.map((m: { id: string; role: string; content: string; created_at: string }) => ({
              id: m.id,
              role: m.role as 'admin' | 'assistant',
              content: m.content,
              timestamp: new Date(m.created_at),
            })))
          }
        })
        .catch(console.error)
    }
  }, [method, projectId, setChatHistory])

  const handleSendChatMessage = async (message: string) => {
    const messageId = uuidv4()
    addChatMessage({
      id: messageId,
      role: 'admin',
      content: message,
      timestamp: new Date(),
    })

    setIsAIChatLoading(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/config/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Chat error:', errorData.error)
        addChatMessage({
          id: uuidv4(),
          role: 'assistant',
          content: `Er is een fout opgetreden: ${errorData.error || 'Onbekende fout'}. Probeer het opnieuw.`,
          timestamp: new Date(),
        })
        return
      }

      const data = await response.json()

      addChatMessage({
        id: uuidv4(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      })

      if (data.configComplete) {
        mutateConfig()
      }
    } catch (error) {
      console.error('Chat error:', error)
      addChatMessage({
        id: uuidv4(),
        role: 'assistant',
        content: 'Er is een netwerkfout opgetreden. Controleer je internetverbinding en probeer het opnieuw.',
        timestamp: new Date(),
      })
    } finally {
      setIsAIChatLoading(false)
    }
  }

  const handleDirectInputGenerate = async (config: {
    systemPrompt: string
    welcomeMessage: string
    closingMessage: string
    topics: string[]
    interviewGoal: string
    topicsQuestions: string
    toneOfVoice: 'friendly' | 'formal' | 'informal' | 'neutral' | 'empathetic'
    maxQuestions: number
    extraInstructions?: string | null
  }) => {
    setIsGenerating(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: config.systemPrompt,
          goal: config.interviewGoal,
          toneOfVoice: config.toneOfVoice,
          maxQuestions: config.maxQuestions,
          welcomeMessage: config.welcomeMessage,
          closingMessage: config.closingMessage,
          topics: config.topics,
          additionalInstructions: config.extraInstructions,
          configMethod: 'direct_input',
          isComplete: true,
        }),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          message: 'Configuratie succesvol gegenereerd! Je kunt nu de interview link delen.',
        })
        mutateConfig()
      } else {
        const errorData = await response.json().catch(() => ({}))
        addToast({
          type: 'error',
          message: errorData.error || 'Er is een fout opgetreden bij het genereren van de configuratie.',
        })
      }
    } catch (error) {
      console.error('Generate error:', error)
      addToast({
        type: 'error',
        message: 'Er is een netwerkfout opgetreden. Controleer je internetverbinding en probeer het opnieuw.',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = () => {
    setIsSaving(true)
    // Config is already saved, navigate immediately
    addToast({
      type: 'success',
      message: 'Configuratie opgeslagen.',
    })
    router.push('/dashboard')
  }

  const handleTest = () => {
    window.open(`/interview/${projectId}`, '_blank')
  }

  const handleConfigurationUpdate = useCallback(async (updatedConfig: Partial<Configuration>) => {
    if (!configuration) {
      addToast({ type: 'error', message: 'Geen bestaande configuratie gevonden' })
      return
    }

    setIsUpdating(true)
    try {
      // Merge updated values with existing configuration for system prompt generation
      // Note: topics and additional_instructions are now real database columns
      const mergedGoal = updatedConfig.goal ?? configuration?.interview_goal ?? configuration?.goal ?? ''
      const mergedToneOfVoice = updatedConfig.tone_of_voice ?? configuration?.tone_of_voice ?? 'friendly'
      const mergedMaxQuestions = updatedConfig.max_questions ?? configuration?.max_questions ?? 8
      const mergedWelcomeMessage = updatedConfig.welcome_message ?? configuration?.welcome_message
      const mergedClosingMessage = updatedConfig.closing_message ?? configuration?.closing_message
      const mergedTopics = updatedConfig.topics ?? configuration?.topics ?? []
      const mergedAdditionalInstructions = updatedConfig.additional_instructions ?? configuration?.additional_instructions

      // Regenerate system prompt with updated values
      const newSystemPrompt = generateSystemPrompt({
        goal: mergedGoal,
        toneOfVoice: mergedToneOfVoice,
        maxQuestions: mergedMaxQuestions,
        welcomeMessage: mergedWelcomeMessage,
        closingMessage: mergedClosingMessage,
        topics: mergedTopics,
        additionalInstructions: mergedAdditionalInstructions,
      })

      const response = await fetch(`/api/projects/${projectId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: updatedConfig.goal,
          toneOfVoice: updatedConfig.tone_of_voice,
          maxQuestions: updatedConfig.max_questions,
          welcomeMessage: updatedConfig.welcome_message,
          closingMessage: updatedConfig.closing_message,
          topics: updatedConfig.topics,
          additionalInstructions: updatedConfig.additional_instructions,
          systemPrompt: newSystemPrompt,
        }),
      })

      if (response.ok) {
        mutateConfig()
        addToast({ type: 'success', message: 'Configuratie bijgewerkt' })
      } else {
        const errorData = await response.json().catch(() => ({}))
        addToast({ type: 'error', message: errorData.error || 'Fout bij bijwerken configuratie' })
      }
    } catch (error) {
      console.error('Update error:', error)
      addToast({ type: 'error', message: 'Netwerkfout. Probeer opnieuw.' })
    } finally {
      setIsUpdating(false)
    }
  }, [projectId, configuration, mutateConfig, addToast])

  if (projectLoading || configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-error-600">Project niet gevonden</p>
      </div>
    )
  }

  // Method selection screen
  if (!method) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-6 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Terug naar dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
        <p className="text-gray-500 mb-8">Kies hoe je het interview wilt configureren</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* AI Chat option */}
          <button
            onClick={() => setMethod('ai_chat')}
            className="card-hover p-6 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
              <ChatBubbleIcon className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Met AI Assistent</h3>
            <p className="text-sm text-gray-500 mb-4">
              Beschrijf wat je wilt en laat de AI je helpen met de perfecte configuratie
            </p>
            <span className="inline-block text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
              Aanbevolen voor nieuwe gebruikers
            </span>
          </button>

          {/* Direct Input option */}
          <button
            onClick={() => setMethod('direct_input')}
            className="card-hover p-6 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
              <DocumentTextIcon className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Zelf Invullen</h3>
            <p className="text-sm text-gray-500 mb-4">
              Vul direct de velden in als je precies weet wat je wilt
            </p>
            <span className="inline-block text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              Sneller voor ervaren gebruikers
            </span>
          </button>
        </div>
      </div>
    )
  }

  // AI Chat mode
  if (method === 'ai_chat') {
    return (
      <div className="h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMethod(null)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Terug
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMethod('direct_input')}>
            Overschakelen naar formulier
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 h-[calc(100%-3rem)]">
          {/* Chat */}
          <div className="card h-full">
            <ChatWindow
              messages={chatHistory}
              onSendMessage={handleSendChatMessage}
              isLoading={isAIChatLoading}
              placeholder="Beschrijf het interview dat je wilt afnemen..."
            />
          </div>

          {/* Preview */}
          <div className="card h-full">
            <ConfigPreview
              configuration={configuration || null}
              projectId={projectId}
              onSave={handleSave}
              onTest={handleTest}
              isSaving={isSaving}
              onConfigurationUpdate={handleConfigurationUpdate}
              isUpdating={isUpdating}
            />
          </div>
        </div>
      </div>
    )
  }

  // Direct Input mode
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMethod(null)}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Terug
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMethod('ai_chat')}>
          Overschakelen naar AI chat
        </Button>
      </div>

      <div className="card">
        {configuration?.is_complete ? (
          <ConfigPreview
            configuration={configuration}
            projectId={projectId}
            onSave={handleSave}
            onTest={handleTest}
            isSaving={isSaving}
            onConfigurationUpdate={handleConfigurationUpdate}
            isUpdating={isUpdating}
          />
        ) : (
          <DirectInputForm
            onGenerate={handleDirectInputGenerate}
            isGenerating={isGenerating}
            initialValues={configuration ? {
              interviewGoal: configuration.goal ?? configuration.interview_goal ?? '',
              topicsQuestions: configuration.topics?.join('\n') || '',
              toneOfVoice: configuration.tone_of_voice ?? 'friendly',
              maxQuestions: configuration.max_questions ?? 8,
              welcomeMessage: configuration.welcome_message,
              closingMessage: configuration.closing_message,
              extraInstructions: configuration.additional_instructions,
            } : undefined}
          />
        )}
      </div>
    </div>
  )
}
