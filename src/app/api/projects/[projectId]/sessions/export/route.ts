import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminFromSession } from '@/lib/auth/session'
import { generateExportCSV, SessionWithMessages, TranscriptMessageForExport } from '@/lib/export/csv-generator'

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId]/sessions/export - Export sessions as CSV
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const admin = await getAdminFromSession()

    if (!admin) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const supabase = await createClient()

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .eq('admin_id', admin.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 })
    }

    // Get all sessions with messages (exclude active sessions)
    // Include sequence_number for proper message ordering
    const { data: sessions, error } = await supabase
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
      .eq('project_id', projectId)
      .neq('status', 'active')
      .order('started_at', { ascending: true })

    if (error) {
      console.error('Error fetching sessions for export:', error)
      return NextResponse.json({ error: 'Kan sessies niet ophalen' }, { status: 500 })
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: 'Geen sessies om te exporteren' }, { status: 400 })
    }

    // Transform sessions to match expected format for csv-generator
    // The csv-generator expects transcript_messages, so we map transcripts to that format
    // Sort transcripts by sequence_number to ensure correct message ordering
    const transformedSessions: SessionWithMessages[] = sessions.map((session) => {
      // Sort transcripts by sequence_number before transformation
      const sortedTranscripts = [...(session.transcripts || [])].sort(
        (a, b) => (a.sequence_number ?? 0) - (b.sequence_number ?? 0)
      )

      return {
        id: session.id,
        project_id: session.project_id,
        status: session.status,
        started_at: session.started_at,
        ended_at: session.ended_at,
        metadata: session.metadata,
        transcript_messages: sortedTranscripts.map((t): TranscriptMessageForExport => ({
          id: t.id,
          role: (t.role === 'user' ? 'participant' : t.role) as 'ai' | 'participant',
          content: t.content,
          created_at: t.timestamp,
        })),
      }
    })

    // Generate CSV
    const csvContent = await generateExportCSV(projectId, transformedSessions)

    // Return CSV as download
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="interview-export-${projectId}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export genereren mislukt' }, { status: 500 })
  }
}
