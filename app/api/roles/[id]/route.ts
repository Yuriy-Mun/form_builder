import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { getCachedRole, CACHE_TAGS } from '@/lib/cache'
import { revalidateTag } from 'next/cache'

// GET /api/roles/[id] - Get specific role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthenticatedUser() // Ensure user is authenticated
    
    const role = await getCachedRole((await params).id)
    
    return NextResponse.json({ role })
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/roles/[id] - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthenticatedUser() // Ensure user is authenticated
    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('roles')
      .update(body)
      .eq('id', (await params).id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate role and roles cache
    revalidateTag(CACHE_TAGS.ROLE)
    revalidateTag(CACHE_TAGS.ROLES)

    return NextResponse.json({ role: data })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/roles/[id] - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthenticatedUser() // Ensure user is authenticated
    const supabase = await createClient()

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', (await params).id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate role, roles, and related caches
    revalidateTag(CACHE_TAGS.ROLE)
    revalidateTag(CACHE_TAGS.ROLES)
    revalidateTag(CACHE_TAGS.ROLE_PERMISSIONS)

    return NextResponse.json({ message: 'Role deleted successfully' })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 