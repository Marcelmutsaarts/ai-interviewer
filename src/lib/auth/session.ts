import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Admin } from '@/types/database'

/**
 * Retrieves the admin from the current session cookie.
 * Returns null if no valid session exists or admin is not found.
 */
export async function getAdminFromSession(): Promise<Admin | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')

  if (!sessionCookie?.value) {
    return null
  }

  const supabase = await createClient()
  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('id', sessionCookie.value)
    .single()

  return admin
}
