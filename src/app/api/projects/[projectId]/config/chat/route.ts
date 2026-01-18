import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminFromSession } from '@/lib/auth/session'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { CONFIG_ASSISTANT_PROMPT, parseConfigurationFromResponse } from '@/lib/ai/config-chat-assistant'
import { generateSystemPrompt, generateWelcomeMessage, generateClosingMessage } from '@/lib/ai/configuration-generator'
import { GEMINI_CHAT_MODEL } from '@/lib/utils/constants'

interface RouteParams {
  params: Promise<{ projectId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate API key - accept both GOOGLE_GEMINI_API_KEY and GOOGLE_API_KEY
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      console.error('GOOGLE_GEMINI_API_KEY or GOOGLE_API_KEY not configured')
      return NextResponse.json(
        { error: 'Server configuratiefout' },
        { status: 500 }
      )
    }

    // Initialize Google Generative AI client
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: GEMINI_CHAT_MODEL,
      systemInstruction: CONFIG_ASSISTANT_PROMPT,
    })

    const { projectId } = await params
    const admin = await getAdminFromSession()

    if (!admin) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Bericht is verplicht' }, { status: 400 })
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: 'Bericht is te lang (max 5000 tekens)' }, { status: 400 })
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

    // Get chat history
    const { data: chatHistory } = await supabase
      .from('config_chat_history')
      .select('role, content')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    // Save admin message
    await supabase
      .from('config_chat_history')
      .insert({
        project_id: projectId,
        role: 'admin',
        content: message,
      })

    // Build conversation history for Gemini
    // Gemini uses a different format - we need to build a chat history
    const history = (chatHistory || []).map((m) => ({
      role: m.role === 'admin' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }))

    // Start a chat session with the history
    const chat = model.startChat({
      history,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    })

    // Get AI response
    const result = await chat.sendMessage(message)
    const assistantMessage = result.response.text()

    // Save assistant message
    await supabase
      .from('config_chat_history')
      .insert({
        project_id: projectId,
        role: 'assistant',
        content: assistantMessage,
      })

    // Check if configuration is complete
    const parsedConfig = parseConfigurationFromResponse(assistantMessage)

    if (parsedConfig) {
      const goal = parsedConfig.goal || ''
      const toneOfVoice = parsedConfig.toneOfVoice || 'friendly'
      const maxQuestions = parsedConfig.maxQuestions || 8

      // Generate welcome/closing messages if not provided by AI
      const welcomeMessage = parsedConfig.welcomeMessage?.trim() ||
        generateWelcomeMessage(toneOfVoice, goal)
      const closingMessage = parsedConfig.closingMessage?.trim() ||
        generateClosingMessage(toneOfVoice)

      // Generate system prompt from parsed config
      const systemPrompt = generateSystemPrompt({
        goal,
        toneOfVoice,
        maxQuestions,
        welcomeMessage,
        closingMessage,
        topics: parsedConfig.topics,
        additionalInstructions: parsedConfig.additionalInstructions,
      })

      // Update configuration (using correct column names for actual database)
      const { error: updateError } = await supabase
        .from('project_config')
        .update({
          interview_goal: goal,
          tone_of_voice: toneOfVoice,
          max_questions: maxQuestions,
          welcome_message: welcomeMessage,
          closing_message: closingMessage,
          system_prompt: systemPrompt,
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', projectId)

      if (updateError) {
        console.error('Config update error:', updateError)
        // Still return the message but mark config as incomplete
        return NextResponse.json({
          message: assistantMessage,
          configComplete: false,
          parsedConfig,
        })
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      configComplete: !!parsedConfig,
      parsedConfig,
    })
  } catch (error: unknown) {
    console.error('Chat error:', error)

    // Handle specific error types for better user feedback
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()

      // Handle API key errors
      if (errorMessage.includes('api key') || errorMessage.includes('api_key') || errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        console.error('API key error - check GOOGLE_GEMINI_API_KEY or GOOGLE_API_KEY configuration')
        return NextResponse.json({ error: 'Server configuratiefout: ongeldige API-sleutel' }, { status: 500 })
      }

      // Handle model not found errors
      if (errorMessage.includes('model') && (errorMessage.includes('not found') || errorMessage.includes('does not exist') || errorMessage.includes('404'))) {
        console.error('Model not found error - check GEMINI_CHAT_MODEL constant')
        return NextResponse.json({ error: 'Server configuratiefout: AI-model niet beschikbaar' }, { status: 500 })
      }

      // Handle rate limiting
      if (errorMessage.includes('rate limit') || errorMessage.includes('quota') || errorMessage.includes('429')) {
        return NextResponse.json({ error: 'Te veel verzoeken. Probeer het over een minuut opnieuw.' }, { status: 429 })
      }

      // Handle content safety / blocked content
      if (errorMessage.includes('safety') || errorMessage.includes('blocked') || errorMessage.includes('harmful')) {
        return NextResponse.json({ error: 'Het bericht kon niet worden verwerkt vanwege content restricties.' }, { status: 400 })
      }

      // Handle network errors
      if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('econnrefused')) {
        return NextResponse.json({ error: 'Netwerkfout. Controleer de internetverbinding en probeer het opnieuw.' }, { status: 503 })
      }
    }

    // Generic fallback error with more detail in logs
    return NextResponse.json({ error: 'Kan bericht niet verwerken. Probeer het opnieuw.' }, { status: 500 })
  }
}
