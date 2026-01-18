import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { INTERVIEW_SYSTEM_ADDITIONS, OPENAI_REALTIME_MODEL_DEFAULT } from '@/lib/utils/constants'
import { tokenRateLimiter } from '@/lib/utils/rate-limiter'

// POST /api/interview/token - Get ephemeral token from OpenAI Realtime Sessions API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is vereist' }, { status: 400 })
    }

    // Rate limiting: 10 tokens per project per minute
    if (!tokenRateLimiter.isAllowed(projectId)) {
      return NextResponse.json(
        { error: 'Te veel verzoeken. Probeer het over een minuut opnieuw.' },
        { status: 429 }
      )
    }

    const supabase = await createClient()

    // Get project and verify it's active
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, is_active')
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

    // Get configuration
    const { data: config, error: configError } = await supabase
      .from('project_config')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (configError || !config) {
      return NextResponse.json({ error: 'Configuratie niet gevonden' }, { status: 404 })
    }

    // Build the full system prompt
    const fullSystemPrompt = `${config.system_prompt}

Tone of voice: ${config.tone_of_voice}
Maximaal aantal vragen: ${config.max_questions}
Taal: ${config.language || 'Nederlands'}

Welkomstbericht: ${config.welcome_message || 'Welkom bij dit interview.'}
Afsluitbericht: ${config.closing_message || 'Bedankt voor je deelname aan dit interview.'}

${INTERVIEW_SYSTEM_ADDITIONS}`

    // Request ephemeral token from OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured')
      return NextResponse.json(
        { error: 'Server configuratie fout' },
        { status: 500 }
      )
    }

    // Use environment variable for model version with fallback to default
    const realtimeModel = process.env.OPENAI_REALTIME_MODEL || OPENAI_REALTIME_MODEL_DEFAULT

    // Note: OpenAI Realtime API is proprietary and only works with OpenAI directly
    // OpenRouter does not support the WebRTC-based Realtime API
    const tokenResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: realtimeModel,
        voice: 'alloy',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('OpenAI token request failed:', errorText)
      return NextResponse.json(
        { error: 'Kon geen verbinding maken met de AI service' },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()

    return NextResponse.json({
      token: tokenData.client_secret?.value || tokenData.client_secret,
      config: {
        systemPrompt: fullSystemPrompt,
        welcomeMessage: config.welcome_message || 'Welkom bij dit interview. Ik stel je graag een aantal vragen.',
        closingMessage: config.closing_message || 'Bedankt voor je deelname aan dit interview. Fijne dag verder!',
        maxQuestions: config.max_questions,
        voice: 'alloy' as const,
      },
    })
  } catch (error) {
    console.error('Token endpoint error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
