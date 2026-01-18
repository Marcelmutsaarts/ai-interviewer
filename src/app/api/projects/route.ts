import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProjectSchema } from '@/lib/validation/schemas'
import { getAdminFromSession } from '@/lib/auth/session'

// GET /api/projects - List all projects for current admin
export async function GET() {
  try {
    const admin = await getAdminFromSession()

    if (!admin) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const supabase = await createClient()

    // Fetch projects with session counts
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        interview_sessions (
          id,
          status
        )
      `)
      .eq('admin_id', admin.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch projects:', error)
      return NextResponse.json(
        { error: 'Kan projecten niet ophalen' },
        { status: 500 }
      )
    }

    // Transform to include session counts and convert is_active to status for frontend compatibility
    const projectsWithStats = projects.map((project) => {
      const sessions = project.interview_sessions || []
      return {
        id: project.id,
        admin_id: project.admin_id,
        name: project.name,
        description: project.description,
        is_active: project.is_active,
        created_at: project.created_at,
        updated_at: project.updated_at,
        totalSessions: sessions.length,
        completedSessions: sessions.filter((s) => s.status === 'completed').length,
      }
    })

    return NextResponse.json(projectsWithStats)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Kan projecten niet ophalen' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromSession()

    if (!admin) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const parseResult = createProjectSchema.safeParse(body)
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    const { name, description } = parseResult.data

    const supabase = await createClient()

    // Create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        admin_id: admin.id,
        name,
        description: description || null,
        is_active: true,
      })
      .select()
      .single()

    if (projectError || !project) {
      console.error('Failed to create project:', projectError)
      return NextResponse.json(
        { error: 'Kan project niet aanmaken' },
        { status: 500 }
      )
    }

    // Create default configuration for the project
    const { error: configError } = await supabase
      .from('project_config')
      .insert({
        project_id: project.id,
        system_prompt: '',
        interview_goal: '',
        tone_of_voice: 'friendly',
        max_questions: 8,
        language: 'nl',
      })

    if (configError) {
      console.error('Failed to create configuration:', configError)
      // Rollback: delete the project
      await supabase.from('projects').delete().eq('id', project.id)
      return NextResponse.json(
        { error: 'Kan project configuratie niet aanmaken' },
        { status: 500 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Kan project niet aanmaken' },
      { status: 500 }
    )
  }
}
