'use client'

import { StatusBadge, Button, CogIcon, DocumentIcon, ExternalLinkIcon, TrashIcon } from '@/components/atoms'
import { IconButton } from '@/components/molecules/ActionButtons/IconButton'

interface Project {
  id: string
  name: string
  description?: string | null
  is_active: boolean
  totalSessions: number
  completedSessions: number
}

interface ProjectCardProps {
  project: Project
  onConfigure: () => void
  onSessions: () => void
  onOpenInterview: () => void
  onDelete: () => void
}

export function ProjectCard({
  project,
  onConfigure,
  onSessions,
  onOpenInterview,
  onDelete,
}: ProjectCardProps) {
  // Convert is_active boolean to status string for StatusBadge
  const status = project.is_active ? 'active' : 'inactive'

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 truncate pr-2">
          {project.name}
        </h3>
        <StatusBadge status={status} size="sm" />
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {project.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <span>{project.totalSessions} interviews</span>
        <span>{project.completedSessions} voltooid</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onConfigure}>
            <CogIcon className="w-4 h-4 mr-1" />
            Configuratie
          </Button>
          <Button variant="ghost" size="sm" onClick={onSessions}>
            <DocumentIcon className="w-4 h-4 mr-1" />
            Sessies
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            icon={<ExternalLinkIcon className="w-4 h-4" />}
            label="Open interview"
            onClick={onOpenInterview}
          />
          <IconButton
            icon={<TrashIcon className="w-4 h-4" />}
            label="Verwijderen"
            variant="danger"
            onClick={onDelete}
          />
        </div>
      </div>
    </div>
  )
}
