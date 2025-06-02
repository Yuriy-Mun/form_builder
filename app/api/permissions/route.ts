import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { getCachedPermissions, CACHE_TAGS } from '@/lib/cache'
import { revalidateTag } from 'next/cache'

// GET /api/permissions - Get all permissions
export async function GET() {
  try {
    await getAuthenticatedUser() // Ensure user is authenticated
    
    const permissions = await getCachedPermissions()
    
    return NextResponse.json({ permissions })
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/permissions - Create new permission
export async function POST(request: NextRequest) {
  try {
    await getAuthenticatedUser() // Ensure user is authenticated
    const body = await request.json()
    const supabase = await createClient()

    const { name, slug, description, active = true } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('permissions')
      .insert({
        name,
        slug,
        description,
        active,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate permissions cache
    revalidateTag(CACHE_TAGS.PERMISSIONS)

    return NextResponse.json({ permission: data })
  } catch (error) {
    console.error('Error creating permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 