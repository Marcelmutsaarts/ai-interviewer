import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET /api/interview/project/[projectId] - Get public project info for interview
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is vereist' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get project with configuration (using actual database schema)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        is_active,
        project_config (
          interview_goal,
          welcome_message,
          system_prompt
        )
      `)
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 })
    }

    // Type the configuration properly
    const config = Array.isArray(project.project_config)
      ? project.project_config[0]
      : project.project_config

    // Return public info only
    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      isActive: project.is_active === true,
      goal: config?.interview_goal || null,
      welcomeMessage: config?.welcome_message || null,
      isConfigured: !!config?.system_prompt,
    })
  } catch (error) {
    console.error('Project info error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
