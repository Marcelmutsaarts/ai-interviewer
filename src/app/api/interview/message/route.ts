import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import {
  validateParticipantToken,
  PARTICIPANT_TOKEN_COOKIE_NAME,
} from '@/lib/utils/participant-session'

// POST /api/interview/message - Save a transcript message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, role, content } = body

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

    // Map 'participant' role to 'user' for database (database uses 'ai' | 'user')
    const dbRole = role === 'participant' ? 'user' : role
    if (!dbRole || !['ai', 'user'].includes(dbRole)) {
      return NextResponse.json({ error: 'Ongeldige rol' }, { status: 400 })
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Inhoud is vereist' }, { status: 400 })
    }

    // Validate message length (max 10000 characters)
    const MAX_MESSAGE_LENGTH = 10000
    if (content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Bericht is te lang (max ${MAX_MESSAGE_LENGTH} tekens)` },
        { status: 400 }
      )
    }

    // Don't save empty messages
    if (content.trim().length === 0) {
      return NextResponse.json({ success: true, skipped: true })
    }

    const supabase = await createClient()

    // Verify session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('id, status')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Sessie niet gevonden' }, { status: 404 })
    }

    // Accept messages for active, completed, and abandoned sessions
    // This allows late-arriving messages to be saved even after session ends
    // Only reject if session is in an unexpected state (future-proofing)
    const validStatuses = ['active', 'completed', 'abandoned']
    if (!session.status || !validStatuses.includes(session.status)) {
      return NextResponse.json(
        { error: 'Sessie heeft ongeldige status', sessionStatus: session.status },
        { status: 403 }
      )
    }

    // Get the next sequence number atomically using PostgreSQL function with advisory lock
    // This prevents race conditions when multiple messages are saved concurrently
    const { data: nextSequence, error: seqError } = await supabase
      .rpc('get_next_transcript_sequence', { p_session_id: sessionId })

    if (seqError) {
      console.error('Error getting next sequence number:', seqError)
      return NextResponse.json(
        { error: 'Kon volgnummer niet genereren' },
        { status: 500 }
      )
    }

    // Check for duplicate message in last 10 seconds
    // This prevents the same message from being saved multiple times due to client-side retries or race conditions
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString()
    const { data: existingMessage } = await supabase
      .from('transcripts')
      .select('id')
      .eq('session_id', sessionId)
      .eq('role', dbRole)
      .eq('content', content.trim())
      .gte('timestamp', tenSecondsAgo)
      .limit(1)
      .single()

    if (existingMessage) {
      console.log('[MessageAPI] Duplicate message prevented:', { role: dbRole, sessionId })
      return NextResponse.json({
        success: true,
        deduplicated: true,
      })
    }

    // Save the message with the calculated sequence number
    const { data: message, error: messageError } = await supabase
      .from('transcripts')
      .insert({
        session_id: sessionId,
        role: dbRole as 'ai' | 'user',
        content: content.trim(),
        sequence_number: nextSequence,
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error saving message:', messageError)
      return NextResponse.json(
        { error: 'Kon bericht niet opslaan' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: message.id,
      sequenceNumber: message.sequence_number,
    })
  } catch (error) {
    console.error('Save message error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
