import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminFromSession } from '@/lib/auth/session'
import { updateConfigurationSchema } from '@/lib/validation/schemas'

// Disable caching for this route to ensure fresh configuration data
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET configuration
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const admin = await getAdminFromSession()

    if (!admin) {
      const response = NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      return response
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
      const response = NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 })
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      return response
    }

    // Get configuration
    const { data: config, error } = await supabase
      .from('project_config')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (error) {
      console.error('Error fetching config:', error)
      const response = NextResponse.json({ error: 'Kan configuratie niet ophalen' }, { status: 500 })
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      return response
    }

    // Compute is_complete based on required fields being populated
    // A configuration is complete when it has a meaningful goal, welcome message, closing message, and system prompt
    const isComplete = Boolean(
      config.interview_goal &&
      config.interview_goal.trim().length > 0 &&
      config.welcome_message &&
      config.welcome_message.trim().length > 0 &&
      config.closing_message &&
      config.closing_message.trim().length > 0 &&
      config.system_prompt &&
      config.system_prompt.trim().length > 0
    )

    // Return configuration with computed is_complete field and goal alias
    const response = NextResponse.json({
      ...config,
      is_complete: isComplete,
      goal: config.interview_goal, // Alias for backward compatibility
    })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response
  } catch (error) {
    console.error('Config GET error:', error)
    const response = NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response
  }
}

// PUT update configuration
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const admin = await getAdminFromSession()

    if (!admin) {
      const response = NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      return response
    }

    const body = await request.json()

    // Validate
    const result = updateConfigurationSchema.safeParse(body)
    if (!result.success) {
      const firstError = result.error.issues[0]
      const response = NextResponse.json({ error: firstError.message }, { status: 400 })
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      return response
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
      const response = NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 })
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      return response
    }

    // Map camelCase to snake_case for database
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // DEBUG: Log what we're receiving
    console.log(`[Config PUT] Received data for project ${projectId}:`, {
      systemPrompt_length: result.data.systemPrompt?.length,
      systemPrompt_preview: result.data.systemPrompt?.substring(0, 200),
      goal: result.data.goal,
      toneOfVoice: result.data.toneOfVoice,
      maxQuestions: result.data.maxQuestions,
    })

    if (result.data.systemPrompt !== undefined) updateData.system_prompt = result.data.systemPrompt
    if (result.data.goal !== undefined) updateData.interview_goal = result.data.goal
    if (result.data.toneOfVoice !== undefined) updateData.tone_of_voice = result.data.toneOfVoice
    if (result.data.maxQuestions !== undefined) updateData.max_questions = result.data.maxQuestions
    if (result.data.welcomeMessage !== undefined) updateData.welcome_message = result.data.welcomeMessage
    if (result.data.closingMessage !== undefined) updateData.closing_message = result.data.closingMessage
    if (result.data.topics !== undefined) updateData.topics = result.data.topics
    if (result.data.additionalInstructions !== undefined) updateData.additional_instructions = result.data.additionalInstructions

    // DEBUG: Log what we're about to save
    console.log(`[Config PUT] Saving to database:`, {
      updateData_keys: Object.keys(updateData),
      system_prompt_in_update: 'system_prompt' in updateData,
      system_prompt_length: (updateData.system_prompt as string)?.length,
    })

    // Update configuration
    const { data: config, error } = await supabase
      .from('project_config')
      .update(updateData)
      .eq('project_id', projectId)
      .select()
      .single()

    // DEBUG: Log what was returned after update
    console.log(`[Config PUT] After update, database returned:`, {
      system_prompt_length: config?.system_prompt?.length,
      system_prompt_preview: config?.system_prompt?.substring(0, 200),
      updated_at: config?.updated_at,
    })

    if (error) {
      console.error('Error updating config:', error)
      const response = NextResponse.json({ error: 'Kan configuratie niet bijwerken' }, { status: 500 })
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      return response
    }

    const response = NextResponse.json(config)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response
  } catch (error) {
    console.error('Config PUT error:', error)
    const response = NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response
  }
}
