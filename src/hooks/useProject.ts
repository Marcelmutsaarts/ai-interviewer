'use client'

import useSWR from 'swr'
import type { Project, Configuration } from '@/types/database'
import { createFetcher } from '@/lib/api/fetcher'

interface ProjectWithConfig extends Project {
  configuration?: Configuration
}

const projectFetcher = createFetcher<ProjectWithConfig>('project')

export function useProject(projectId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ProjectWithConfig>(
    projectId ? `/api/projects/${projectId}` : null,
    projectFetcher
  )

  return {
    project: data,
    isLoading,
    isError: error,
    mutate,
  }
}
