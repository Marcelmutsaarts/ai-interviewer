'use client'

import useSWR from 'swr'
import type { InterviewSession, Transcript } from '@/types/database'
import { fetchWithHandler } from '@/lib/api/fetcher'

export interface SessionWithMessages extends InterviewSession {
  messageCount: number
}

export interface SessionDetail extends InterviewSession {
  transcript_messages: {
    id: string
    role: 'ai' | 'participant'
    content: string
    created_at: string
  }[]
}

async function fetchSessions(projectId: string): Promise<SessionWithMessages[]> {
  return fetchWithHandler<SessionWithMessages[]>(
    () => fetch(`/api/projects/${projectId}/sessions`),
    'sessies'
  )
}

async function fetchSessionDetail(projectId: string, sessionId: string): Promise<SessionDetail> {
  return fetchWithHandler<SessionDetail>(
    () => fetch(`/api/projects/${projectId}/sessions/${sessionId}`),
    'sessie'
  )
}

export function useSessions(projectId: string) {
  const { data, error, isLoading, mutate } = useSWR<SessionWithMessages[]>(
    projectId ? `sessions-${projectId}` : null,
    () => fetchSessions(projectId),
    { revalidateOnFocus: false }
  )

  return {
    data,
    sessions: data,
    error,
    isLoading,
    isError: !!error,
    mutate,
  }
}

export function useSessionDetail(projectId: string, sessionId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<SessionDetail>(
    projectId && sessionId ? `session-${projectId}-${sessionId}` : null,
    () => fetchSessionDetail(projectId, sessionId!),
    { revalidateOnFocus: false }
  )

  return {
    data,
    session: data,
    error,
    isLoading,
    isError: !!error,
    mutate,
  }
}
