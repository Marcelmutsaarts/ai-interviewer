import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminFromSession } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId]/sessions - List all sessions for a project
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
      .select('id')
      .eq('id', projectId)
      .eq('admin_id', admin.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 })
    }

    // Get sessions with message counts
    const { data: sessions, error } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        transcripts (id)
      `)
      .eq('project_id', projectId)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json({ error: 'Kan sessies niet ophalen' }, { status: 500 })
    }

    // Transform to include message count
    const sessionsWithCount = (sessions || []).map((s) => {
      const { transcripts, ...sessionData } = s
      return {
        ...sessionData,
        messageCount: Array.isArray(transcripts) ? transcripts.length : 0,
      }
    })

    return NextResponse.json(sessionsWithCount)
  } catch (error) {
    console.error('Sessions GET error:', error)
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 })
  }
}
