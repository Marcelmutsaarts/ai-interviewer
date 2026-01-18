import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { updateProjectSchema } from '@/lib/validation/schemas'
import { getAdminFromSession } from '@/lib/auth/session'

// Helper to verify project ownership
async function verifyProjectOwnership(adminId: string, projectId: string) {
  const supabase = await createClient()
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('admin_id', adminId)
    .single()

  return project !== null
}

interface RouteParams {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId] - Get single project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const admin = await getAdminFromSession()

    if (!admin) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const supabase = await createClient()

    // Fetch project with configuration
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_config (*)
      `)
      .eq('id', projectId)
      .eq('admin_id', admin.id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 })
    }

    // Transform the response - project_config comes as an object due to one-to-one relationship
    const projectData = project as typeof project & {
      project_config: typeof project.project_config | Array<typeof project.project_config>
    }
    const configs = projectData.project_config
    const configuration = Array.isArray(configs) ? configs[0] : configs

    const response = {
      id: project.id,
      admin_id: project.admin_id,
      name: project.name,
      description: project.description,
      is_active: project.is_active,
      created_at: project.created_at,
      updated_at: project.updated_at,
      configuration: configuration || null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Kan project niet ophalen' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[projectId] - Update project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const admin = await getAdminFromSession()

    if (!admin) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    // Verify ownership
    const isOwner = await verifyProjectOwnership(admin.id, projectId)
    if (!isOwner) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 })
    }

    const body = await request.json()

    // Validate input
    const parseResult = updateProjectSchema.safeParse(body)
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    // Convert status to is_active if present
    const updateData: Record<string, unknown> = { ...parseResult.data }
    if ('status' in updateData) {
      updateData.is_active = updateData.status === 'active'
      delete updateData.status
    }
    if ('is_active' in parseResult.data) {
      updateData.is_active = parseResult.data.is_active
    }

    const supabase = await createClient()

    // Update the project
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single()

    if (error || !project) {
      console.error('Failed to update project:', error)
      return NextResponse.json(
        { error: 'Kan project niet bijwerken' },
        { status: 500 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Kan project niet bijwerken' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[projectId] - Delete project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const admin = await getAdminFromSession()

    if (!admin) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    // Verify ownership
    const isOwner = await verifyProjectOwnership(admin.id, projectId)
    if (!isOwner) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 })
    }

    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Delete in order: transcripts -> sessions -> config -> project
    // First get all sessions for this project
    const { data: sessions } = await supabase
      .from('interview_sessions')
      .select('id')
      .eq('project_id', projectId)

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map((s) => s.id)

      // Delete all transcripts (use admin client to bypass RLS)
      await adminClient
        .from('transcripts')
        .delete()
        .in('session_id', sessionIds)

      // Delete all sessions (use admin client to bypass RLS)
      await adminClient
        .from('interview_sessions')
        .delete()
        .eq('project_id', projectId)
    }

    // Delete configuration
    await supabase
      .from('project_config')
      .delete()
      .eq('project_id', projectId)

    // Delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Failed to delete project:', error)
      return NextResponse.json(
        { error: 'Kan project niet verwijderen' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Kan project niet verwijderen' },
      { status: 500 }
    )
  }
}
