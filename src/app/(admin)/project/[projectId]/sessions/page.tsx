'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/atoms/Button/Button'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { ChevronLeftIcon, DocumentIcon } from '@/components/atoms/Icon/icons'
import { SessionList } from '@/components/organisms/SessionList/SessionList'
import { TranscriptModal } from '@/components/modals/TranscriptModal'
import { ConfirmDeleteSessionModal } from '@/components/modals/ConfirmDeleteSessionModal'
import { useSessions } from '@/hooks/useSessions'
import { useProject } from '@/hooks/useProject'
import { useToastStore } from '@/stores/toastStore'
import { formatDateTime } from '@/lib/utils/date'

export default function SessionsPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string

  const { project, isLoading: projectLoading } = useProject(projectId)
  const { data: sessions, isLoading: sessionsLoading, error: sessionsError, mutate: mutateSessions } = useSessions(projectId)
  const addToast = useToastStore((state) => state.addToast)

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/sessions/export`)

      if (!response.ok) {
        const error = await response.json()
        addToast({ type: 'error', message: error.error || 'Export mislukt' })
        return
      }

      // Download CSV
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `interview-export-${projectId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (error) {
      console.error('Export error:', error)
      addToast({ type: 'error', message: 'Export mislukt' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteSession = async () => {
    if (!deleteSessionId) return

    try {
      const response = await fetch(`/api/projects/${projectId}/sessions/${deleteSessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        setDeleteError(error.error || 'Kan sessie niet verwijderen')
        return
      }

      // Clear selectedSessionId if deleted session was selected
      if (selectedSessionId === deleteSessionId) {
        setSelectedSessionId(null)
      }

      // Close the modal and refresh the sessions list
      setDeleteSessionId(null)
      setDeleteError(null)
      mutateSessions()
      addToast({ type: 'success', message: 'Sessie succesvol verwijderd' })
    } catch (error) {
      console.error('Delete session error:', error)
      setDeleteError('Er is een fout opgetreden bij het verwijderen')
    }
  }

  const sessionToDelete = deleteSessionId
    ? sessions?.find((s) => s.id === deleteSessionId)
    : null

  if (projectLoading || sessionsLoading) {
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

  if (sessionsError) {
    return (
      <div className="text-center py-12">
        <p className="text-error-600">Kan sessies niet laden. Probeer de pagina te vernieuwen.</p>
      </div>
    )
  }

  const completedSessions = sessions?.filter((s) => s.status !== 'active') || []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Terug
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500">Interview sessies</p>
          </div>
        </div>

        {completedSessions.length > 0 && (
          <Button
            variant="secondary"
            leftIcon={<DocumentIcon className="w-4 h-4" />}
            onClick={handleExport}
            loading={isExporting}
          >
            {isExporting ? 'AI analyseert...' : 'Export CSV'}
          </Button>
        )}
      </div>

      {/* Sessions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <SessionList
          sessions={sessions || []}
          onSelect={setSelectedSessionId}
          onDelete={setDeleteSessionId}
          selectedId={selectedSessionId || undefined}
        />
      </div>

      {/* Transcript Modal */}
      <TranscriptModal
        isOpen={!!selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
        projectId={projectId}
        sessionId={selectedSessionId}
      />

      {/* Delete Session Modal */}
      <ConfirmDeleteSessionModal
        isOpen={!!deleteSessionId}
        onClose={() => {
          setDeleteSessionId(null)
          setDeleteError(null)
        }}
        onConfirm={handleDeleteSession}
        sessionDate={sessionToDelete ? formatDateTime(sessionToDelete.started_at) : ''}
        error={deleteError}
      />
    </div>
  )
}
