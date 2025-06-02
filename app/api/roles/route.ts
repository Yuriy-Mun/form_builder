import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { getCachedRoles, CACHE_TAGS } from '@/lib/cache'
import { revalidateTag } from 'next/cache'

// GET /api/roles - Get all roles
export async function GET() {
  try {
    await getAuthenticatedUser() // Ensure user is authenticated
    
    const roles = await getCachedRoles()
    
    return NextResponse.json({ roles })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    await getAuthenticatedUser() // Ensure user is authenticated
    const body = await request.json()
    const supabase = await createClient()

    const { name, description, active = true } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('roles')
      .insert({
        name,
        description,
        active,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate roles cache
    revalidateTag(CACHE_TAGS.ROLES)

    return NextResponse.json({ role: data })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 