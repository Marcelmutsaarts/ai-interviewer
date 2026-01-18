import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getAdminFromSession } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ projectId: string; sessionId: string }>
}

// DELETE /api/projects/[projectId]/sessions/[sessionId] - Delete a session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sessionId } = await params
    const admin = await getAdminFromSession()

    if (!admin) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const supabase = await createClient()

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('admin_id', admin.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 })
    }

    // Verify session exists and belongs to this project
    const { data: session } = await supabase
      .from('interview_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('project_id', projectId)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Sessie niet gevonden' }, { status: 404 })
    }

    // Use admin client for delete operations to bypass RLS
    const adminClient = await createAdminClient()

    // Delete transcripts first (foreign key constraint)
    const { error: transcriptError } = await adminClient
      .from('transcripts')
      .delete()
      .eq('session_id', sessionId)

    if (transcriptError) {
      console.error('Transcript delete error:', transcriptError)
      return NextResponse.json({ error: 'Kan transcripties niet verwijderen' }, { status: 500 })
    }

    // Delete the session
    const { error: deleteError } = await adminClient
      .from('interview_sessions')
      .delete()
      .eq('id', sessionId)

    if (deleteError) {
      console.error('Session delete error:', deleteError)
      return NextResponse.json({ error: 'Kan sessie niet verwijderen' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Session DELETE error:', error)
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 })
  }
}

// GET /api/projects/[projectId]/sessions/[sessionId] - Get session detail with messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, sessionId } = await params
    const admin = await getAdminFromSession()

    if (!admin) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const supabase = await createClient()

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('admin_id', admin.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 })
    }

    // Get session with messages
    const { data: session, error } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        transcripts (
          id,
          role,
          content,
          timestamp,
          sequence_number
        )
      `)
      .eq('id', sessionId)
      .eq('project_id', projectId)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Sessie niet gevonden' }, { status: 404 })
    }

    // Sort messages by sequence_number first, then timestamp as tiebreaker
    // This ensures correct ordering even when timestamps are identical or sequence_number has gaps
    const transcripts = session.transcripts || []
    let sortedTranscripts = transcripts
    if (Array.isArray(transcripts)) {
      transcripts.sort(
        (a: { timestamp: string; sequence_number: number | null }, b: { timestamp: string; sequence_number: number | null }) => {
          // First, sort by sequence_number (nulls go to the end)
          const seqA = a.sequence_number ?? Number.MAX_SAFE_INTEGER
          const seqB = b.sequence_number ?? Number.MAX_SAFE_INTEGER
          if (seqA !== seqB) {
            return seqA - seqB
          }
          // If sequence_numbers are equal (or both null), use timestamp as tiebreaker
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        }
      )
      sortedTranscripts = transcripts
    }

    // Deduplicate consecutive identical messages (safety net for any duplicates that slipped through)
    const deduplicatedTranscripts = sortedTranscripts.filter(
      (t: { role: string; content: string }, i: number, arr: Array<{ role: string; content: string }>) => {
        if (i === 0) return true
        const prev = arr[i - 1]
        return !(prev.role === t.role && prev.content === t.content)
      }
    )

    // Transform to match expected format (transcript_messages with created_at)
    const response = {
      ...session,
      transcript_messages: deduplicatedTranscripts.map((t: { id: string; role: string; content: string; timestamp: string }) => ({
        id: t.id,
        role: t.role === 'user' ? 'participant' : t.role, // Map 'user' to 'participant' for compatibility
        content: t.content,
        created_at: t.timestamp,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Session detail GET error:', error)
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 })
  }
}
