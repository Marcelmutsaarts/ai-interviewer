import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminFromSession } from '@/lib/auth/session'
import OpenAI from 'openai'
import { CONFIG_ASSISTANT_PROMPT, parseConfigurationFromResponse } from '@/lib/ai/config-chat-assistant'
import { generateSystemPrompt } from '@/lib/ai/configuration-generator'
import { OPENROUTER_CHAT_MODEL, OPENROUTER_BASE_URL } from '@/lib/utils/constants'

interface RouteParams {
  params: Promise<{ projectId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate API key - prefer OpenRouter, fall back to OpenAI
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('Neither OPENROUTER_API_KEY nor OPENAI_API_KEY configured')
      return NextResponse.json(
        { error: 'Server configuratiefout' },
        { status: 500 }
      )
    }

    // Use OpenRouter for chat completions (Gemini models)
    const openai = new OpenAI({
      apiKey,
      baseURL: OPENROUTER_BASE_URL,
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

    // Build messages for OpenAI
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: CONFIG_ASSISTANT_PROMPT },
      ...(chatHistory || []).map((m) => ({
        role: m.role === 'admin' ? 'user' : 'assistant',
        content: m.content,
      } as OpenAI.ChatCompletionMessageParam)),
      { role: 'user', content: message },
    ]

    // Get AI response via OpenRouter
    const completion = await openai.chat.completions.create({
      model: OPENROUTER_CHAT_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    })

    const assistantMessage = completion.choices[0]?.message?.content || ''

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
      // Generate system prompt from parsed config
      const systemPrompt = generateSystemPrompt({
        goal: parsedConfig.goal || '',
        toneOfVoice: parsedConfig.toneOfVoice || 'friendly',
        maxQuestions: parsedConfig.maxQuestions || 8,
        welcomeMessage: parsedConfig.welcomeMessage,
        closingMessage: parsedConfig.closingMessage,
        topics: parsedConfig.topics,
        additionalInstructions: parsedConfig.additionalInstructions,
      })

      // Update configuration (using correct column names for actual database)
      await supabase
        .from('project_config')
        .update({
          interview_goal: parsedConfig.goal || '',
          tone_of_voice: parsedConfig.toneOfVoice || 'friendly',
          max_questions: parsedConfig.maxQuestions || 8,
          welcome_message: parsedConfig.welcomeMessage,
          closing_message: parsedConfig.closingMessage,
          system_prompt: systemPrompt,
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', projectId)
    }

    return NextResponse.json({
      message: assistantMessage,
      configComplete: !!parsedConfig,
      parsedConfig,
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Kan bericht niet verwerken' }, { status: 500 })
  }
}
