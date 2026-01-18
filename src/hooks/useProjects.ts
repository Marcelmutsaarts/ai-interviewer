'use client'

import useSWR from 'swr'
import { createFetcher } from '@/lib/api/fetcher'

export interface ProjectWithStats {
  id: string
  admin_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  totalSessions: number
  completedSessions: number
}

const projectsFetcher = createFetcher<ProjectWithStats[]>('projecten')

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<ProjectWithStats[]>('/api/projects', projectsFetcher)

  return {
    projects: data,
    isLoading,
    isError: error,
    mutate,
  }
}
