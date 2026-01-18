import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import {
  generateParticipantToken,
  getParticipantTokenCookieOptions,
} from '@/lib/utils/participant-session'

// POST /api/interview/start - Create a new interview session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is vereist' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify project exists and is active
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, is_active')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 })
    }

    if (!project.is_active) {
      return NextResponse.json(
        { error: 'Dit interview is momenteel niet beschikbaar' },
        { status: 403 }
      )
    }

    // Create new session
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .insert({
        project_id: projectId,
        status: 'active',
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return NextResponse.json(
        { error: 'Kon sessie niet aanmaken' },
        { status: 500 }
      )
    }

    // Generate participant token for session ownership validation
    const participantToken = generateParticipantToken(session.id)
    const cookieOptions = getParticipantTokenCookieOptions()

    // Set the participant token cookie
    const cookieStore = await cookies()
    cookieStore.set(cookieOptions.name, participantToken, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      maxAge: cookieOptions.maxAge,
      path: cookieOptions.path,
    })

    return NextResponse.json({
      sessionId: session.id,
      startedAt: session.started_at,
    })
  } catch (error) {
    console.error('Start session error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
