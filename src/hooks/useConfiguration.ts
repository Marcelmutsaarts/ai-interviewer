'use client'

import useSWR from 'swr'
import type { Configuration } from '@/types/database'
import { fetchWithHandler } from '@/lib/api/fetcher'

async function fetchConfiguration(projectId: string): Promise<Configuration> {
  return fetchWithHandler<Configuration>(
    () => fetch(`/api/projects/${projectId}/config`),
    'configuratie'
  )
}

export function useConfiguration(projectId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Configuration>(
    projectId ? `config-${projectId}` : null,
    () => fetchConfiguration(projectId!),
    { revalidateOnFocus: false }
  )

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}
