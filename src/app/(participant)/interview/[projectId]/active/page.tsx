'use client'

import { useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { VoiceInterface } from '@/components/organisms/VoiceInterface'
import { InterviewCompleteModal } from '@/components/modals/InterviewCompleteModal'
import { useInterviewStore } from '@/stores/interviewStore'
import { getConnectionManager } from '@/lib/websocket/connection-manager'

interface ActiveInterviewPageProps {
  params: Promise<{ projectId: string }>
}

export default function ActiveInterviewPage({ params }: ActiveInterviewPageProps) {
  const { projectId } = use(params)
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const { sessionId, reset } = useInterviewStore()

  // Handle showing completion modal
  const handleShowCompletionModal = useCallback(() => {
    setShowModal(true)
  }, [])

  // Handle continue interview
  const handleContinue = useCallback(() => {
    setShowModal(false)
  }, [])

  // Handle finish interview
  const handleFinish = useCallback(async () => {
    // Prevent double-clicks
    if (isFinishing) return
    setIsFinishing(true)

    // Disconnect from the realtime API
    const manager = getConnectionManager()
    manager.disconnect()

    // Update session status in database
    if (sessionId) {
      try {
        await fetch('/api/interview/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, status: 'completed' }),
        })
      } catch (error) {
        console.error('Failed to end session:', error)
      }
    }

    // Reset store and navigate to complete page
    reset()
    router.push(`/interview/${projectId}/complete`)
  }, [sessionId, projectId, router, reset, isFinishing])

  return (
    <div className="flex-1 flex flex-col p-4 max-w-4xl mx-auto w-full">
      <VoiceInterface
        projectId={projectId}
        onShowCompletionModal={handleShowCompletionModal}
        className="flex-1 min-h-[600px]"
      />

      <InterviewCompleteModal
        isOpen={showModal}
        onContinue={handleContinue}
        onFinish={handleFinish}
        isFinishing={isFinishing}
      />
    </div>
  )
}
