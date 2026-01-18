import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ admin: null }, { status: 401 })
    }

    const adminId = sessionCookie.value
    const supabase = await createClient()

    // Fetch admin from database
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, name')
      .eq('id', adminId)
      .single()

    if (error || !admin) {
      // Invalid session, clear cookie
      cookieStore.set('admin_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      })
      return NextResponse.json({ admin: null }, { status: 401 })
    }

    return NextResponse.json({
      admin: {
        id: admin.id,
        name: admin.name,
      },
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ admin: null }, { status: 401 })
  }
}
