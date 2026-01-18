import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validation/schemas'
import { loginRateLimiter, getClientIp } from '@/lib/utils/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 attempts per IP per minute
    const clientIp = getClientIp(request)
    if (!loginRateLimiter.isAllowed(clientIp)) {
      return NextResponse.json(
        { error: 'Te veel inlogpogingen. Probeer het over een minuut opnieuw.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate input
    const parseResult = loginSchema.safeParse(body)
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { name } = parseResult.data

    // TESTING BYPASS: Password validation is disabled for testing purposes.
    // Any password will be accepted. Remove this bypass before production deployment.
    // Original code checked password against ADMIN_PASSWORD_HASH environment variable.

    // Find or create admin in database
    const supabase = await createClient()

    // Try to find existing admin
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id, name')
      .eq('name', name)
      .single()

    let admin: { id: string; name: string }

    if (existingAdmin) {
      // Update last login time
      await supabase
        .from('admins')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', existingAdmin.id)

      admin = existingAdmin
    } else {
      // Create new admin
      const { data: newAdmin, error: createError } = await supabase
        .from('admins')
        .insert({
          name,
          last_login_at: new Date().toISOString(),
        })
        .select('id, name')
        .single()

      if (createError || !newAdmin) {
        console.error('Failed to create admin:', createError)
        return NextResponse.json(
          { error: 'Aanmaken beheerder mislukt' },
          { status: 500 }
        )
      }

      admin = newAdmin
    }

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('admin_session', admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return NextResponse.json({
      admin: {
        id: admin.id,
        name: admin.name,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Inloggen mislukt' },
      { status: 500 }
    )
  }
}
