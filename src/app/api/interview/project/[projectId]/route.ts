import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Disable caching for this route to ensure fresh configuration data
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET /api/interview/project/[projectId] - Get public project info for interview
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params

    if (!projectId) {
      const response = NextResponse.json({ error: 'Project ID is vereist' }, { status: 400 })
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      return response
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
      const response = NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 })
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      return response
    }

    // Type the configuration properly
    const config = Array.isArray(project.project_config)
      ? project.project_config[0]
      : project.project_config

    // Return public info only
    const response = NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      isActive: project.is_active === true,
      goal: config?.interview_goal || null,
      welcomeMessage: config?.welcome_message || null,
      isConfigured: !!config?.system_prompt,
    })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response
  } catch (error) {
    console.error('Project info error:', error)
    const response = NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response
  }
}
