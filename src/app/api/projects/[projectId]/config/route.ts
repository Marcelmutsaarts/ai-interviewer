import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminFromSession } from '@/lib/auth/session'
import { updateConfigurationSchema } from '@/lib/validation/schemas'

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET configuration
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

    // Get configuration
    const { data: config, error } = await supabase
      .from('project_config')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (error) {
      console.error('Error fetching config:', error)
      return NextResponse.json({ error: 'Kan configuratie niet ophalen' }, { status: 500 })
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
    return NextResponse.json({
      ...config,
      is_complete: isComplete,
      goal: config.interview_goal, // Alias for backward compatibility
    })
  } catch (error) {
    console.error('Config GET error:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}

// PUT update configuration
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const admin = await getAdminFromSession()

    if (!admin) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const body = await request.json()

    // Validate
    const result = updateConfigurationSchema.safeParse(body)
    if (!result.success) {
      const firstError = result.error.issues[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
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

    // Map camelCase to snake_case for database
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (result.data.systemPrompt !== undefined) updateData.system_prompt = result.data.systemPrompt
    if (result.data.goal !== undefined) updateData.interview_goal = result.data.goal
    if (result.data.toneOfVoice !== undefined) updateData.tone_of_voice = result.data.toneOfVoice
    if (result.data.maxQuestions !== undefined) updateData.max_questions = result.data.maxQuestions
    if (result.data.welcomeMessage !== undefined) updateData.welcome_message = result.data.welcomeMessage
    if (result.data.closingMessage !== undefined) updateData.closing_message = result.data.closingMessage
    // Note: topics and additional_instructions are not in the current database schema
    // They may need to be stored in a different way or the schema needs to be updated

    // Update configuration
    const { data: config, error } = await supabase
      .from('project_config')
      .update(updateData)
      .eq('project_id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Error updating config:', error)
      return NextResponse.json({ error: 'Kan configuratie niet bijwerken' }, { status: 500 })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Config PUT error:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
