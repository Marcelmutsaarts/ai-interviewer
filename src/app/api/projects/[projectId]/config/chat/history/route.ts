import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminFromSession } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ projectId: string }>
}

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

    // Get chat history
    const { data: messages, error } = await supabase
      .from('config_chat_history')
      .select('id, role, content, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching chat history:', error)
      return NextResponse.json({ error: 'Kan chatgeschiedenis niet ophalen' }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Chat history GET error:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}

// DELETE chat history (for resetting conversation)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Delete chat history
    const { error } = await supabase
      .from('config_chat_history')
      .delete()
      .eq('project_id', projectId)

    if (error) {
      console.error('Error deleting chat history:', error)
      return NextResponse.json({ error: 'Kan chatgeschiedenis niet verwijderen' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Chat history DELETE error:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
