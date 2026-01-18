'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button/Button'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { MicrophoneIcon } from '@/components/atoms/Icon/icons'

interface ProjectInfo {
  id: string
  name: string
  description: string | null
  isActive: boolean
  goal: string | null
  welcomeMessage: string | null
  isConfigured: boolean
}

interface InterviewLandingPageProps {
  params: Promise<{ projectId: string }>
}

export default function InterviewLandingPage({ params }: InterviewLandingPageProps) {
  const { projectId } = use(params)
  const router = useRouter()
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [microphoneError, setMicrophoneError] = useState<string | null>(null)
  const [isRequestingMic, setIsRequestingMic] = useState(false)

  // Fetch project info
  useEffect(() => {
    const fetchProjectInfo = async () => {
      try {
        const response = await fetch(`/api/interview/project/${projectId}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Dit interview bestaat niet.')
          } else {
            const data = await response.json()
            setError(data.error || 'Kon project niet laden.')
          }
          return
        }

        const data = await response.json()
        setProjectInfo(data)

        if (!data.isActive) {
          setError('Dit interview is momenteel niet beschikbaar.')
        }
      } catch (err) {
        console.error('Error fetching project:', err)
        setError('Er is een fout opgetreden bij het laden.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjectInfo()
  }, [projectId])

  // Handle start interview
  const handleStartInterview = async () => {
    setMicrophoneError(null)
    setIsRequestingMic(true)

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Stop the stream tracks immediately - we only needed to check permission
      // The actual interview will request its own stream with proper configuration
      stream.getTracks().forEach((track) => track.stop())

      // Permission granted, navigate to active interview
      router.push(`/interview/${projectId}/active`)
    } catch (err) {
      console.error('Microphone access error:', err)
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setMicrophoneError(
            'Microfoontoestemming is geweigerd. Sta toegang tot je microfoon toe in je browserinstellingen en probeer opnieuw.'
          )
        } else if (err.name === 'NotFoundError') {
          setMicrophoneError(
            'Geen microfoon gevonden. Sluit een microfoon aan en probeer opnieuw.'
          )
        } else {
          setMicrophoneError(
            'Kon geen toegang krijgen tot de microfoon. Controleer je instellingen.'
          )
        }
      } else {
        setMicrophoneError('Er is een onverwachte fout opgetreden.')
      }
    } finally {
      setIsRequestingMic(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Interview niet beschikbaar
          </h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <MicrophoneIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {projectInfo?.name || 'Interview'}
          </h1>
          {projectInfo?.goal && (
            <p className="text-gray-600">{projectInfo.goal}</p>
          )}
        </div>

        {/* Instructions card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Hoe het werkt
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">
                1
              </span>
              <span className="text-gray-600">
                Geef toestemming voor je microfoon
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">
                2
              </span>
              <span className="text-gray-600">
                Je praat direct met de AI - geen knoppen nodig
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">
                3
              </span>
              <span className="text-gray-600">
                De AI luistert en reageert met spraak
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">
                4
              </span>
              <span className="text-gray-600">
                Spreek duidelijk en wacht op antwoord
              </span>
            </li>
          </ul>

          <div className="mt-4 p-3 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Tip:</strong> Zorg dat je in een rustige omgeving bent.
            </p>
          </div>
        </div>

        {/* Microphone error */}
        {microphoneError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{microphoneError}</p>
          </div>
        )}

        {/* Start button */}
        <Button
          onClick={handleStartInterview}
          disabled={isRequestingMic}
          className="w-full py-4 text-lg font-semibold"
        >
          {isRequestingMic ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Microfoon controleren...
            </>
          ) : (
            <>
              <MicrophoneIcon className="w-5 h-5 mr-2" />
              Start Interview
            </>
          )}
        </Button>

        {/* Privacy notice */}
        <p className="mt-4 text-center text-sm text-gray-500">
          Je antwoorden worden opgenomen en getranscribeerd voor analyse.
        </p>
      </div>
    </div>
  )
}
