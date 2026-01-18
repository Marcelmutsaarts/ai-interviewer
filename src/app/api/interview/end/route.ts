import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import {
  validateParticipantToken,
  PARTICIPANT_TOKEN_COOKIE_NAME,
} from '@/lib/utils/participant-session'

// POST /api/interview/end - End an interview session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, status } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is vereist' }, { status: 400 })
    }

    // Validate session ownership via participant token
    const cookieStore = await cookies()
    const participantToken = cookieStore.get(PARTICIPANT_TOKEN_COOKIE_NAME)?.value
    if (!validateParticipantToken(participantToken, sessionId)) {
      return NextResponse.json(
        { error: 'Geen toegang tot deze sessie' },
        { status: 403 }
      )
    }

    if (!status || !['completed', 'abandoned'].includes(status)) {
      return NextResponse.json({ error: 'Ongeldige status' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('id, status')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Sessie niet gevonden' }, { status: 404 })
    }

    // Don't update if already ended
    if (session.status !== 'active') {
      return NextResponse.json({
        success: true,
        message: 'Sessie was al beeindigd',
        status: session.status,
      })
    }

    // Update session status
    const { data: updatedSession, error: updateError } = await supabase
      .from('interview_sessions')
      .update({
        status: status as 'completed' | 'abandoned',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      console.error('Error ending session:', updateError)
      return NextResponse.json(
        { error: 'Kon sessie niet beeindigen' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        status: updatedSession.status,
        endedAt: updatedSession.ended_at,
      },
    })
  } catch (error) {
    console.error('End session error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
