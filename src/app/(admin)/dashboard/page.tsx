'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Spinner, PlusIcon, FolderIcon } from '@/components/atoms'
import { ProjectCard } from '@/components/organisms/ProjectCard/ProjectCard'
import { NewProjectModal } from '@/components/modals/NewProjectModal'
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal'
import { useProjects, ProjectWithStats } from '@/hooks/useProjects'

export default function DashboardPage() {
  const router = useRouter()
  const { projects, isLoading, isError, mutate } = useProjects()

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [deleteProject, setDeleteProject] = useState<ProjectWithStats | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleProjectCreated = (projectId: string) => {
    mutate() // Refresh the projects list
    router.push(`/project/${projectId}/configure`)
  }

  const handleConfigure = (projectId: string) => {
    router.push(`/project/${projectId}/configure`)
  }

  const handleSessions = (projectId: string) => {
    router.push(`/project/${projectId}/sessions`)
  }

  const handleOpenInterview = (projectId: string) => {
    window.open(`/interview/${projectId}`, '_blank')
  }

  const handleDeleteClick = (project: ProjectWithStats) => {
    setDeleteError(null) // Clear any previous error
    setDeleteProject(project)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteProject) return

    try {
      const response = await fetch(`/api/projects/${deleteProject.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteError(null)
        mutate() // Refresh the projects list
      } else {
        const data = await response.json().catch(() => ({}))
        setDeleteError(data.error || 'Kan project niet verwijderen. Probeer het opnieuw.')
      }
    } catch {
      setDeleteError('Kan project niet verwijderen. Controleer je internetverbinding.')
    }
  }

  const handleDeleteModalClose = () => {
    setDeleteProject(null)
    setDeleteError(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-error-600">Kan projecten niet laden. Probeer de pagina te vernieuwen.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mijn Projecten</h1>
        <Button
          leftIcon={<PlusIcon className="w-5 h-5" />}
          onClick={() => setIsNewProjectModalOpen(true)}
        >
          Nieuw Project
        </Button>
      </div>

      {/* Project Grid or Empty State */}
      {!projects || projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Geen projecten</h2>
          <p className="text-gray-500 mb-6">
            Maak je eerste project aan om interviews af te nemen.
          </p>
          <Button
            leftIcon={<PlusIcon className="w-5 h-5" />}
            onClick={() => setIsNewProjectModalOpen(true)}
          >
            Nieuw Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onConfigure={() => handleConfigure(project.id)}
              onSessions={() => handleSessions(project.id)}
              onOpenInterview={() => handleOpenInterview(project.id)}
              onDelete={() => handleDeleteClick(project)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSuccess={handleProjectCreated}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteProject}
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteConfirm}
        projectName={deleteProject?.name || ''}
        error={deleteError}
      />
    </div>
  )
}
