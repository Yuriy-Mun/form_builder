import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { getCachedPermission, CACHE_TAGS } from '@/lib/cache'
import { revalidateTag } from 'next/cache'

// GET /api/permissions/[id] - Get specific permission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthenticatedUser() // Ensure user is authenticated
    
    const permission = await getCachedPermission((await params).id)
    
    return NextResponse.json({ permission })
  } catch (error) {
    console.error('Error fetching permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/permissions/[id] - Update permission
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthenticatedUser() // Ensure user is authenticated
    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('permissions')
      .update(body)
      .eq('id', (await params).id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate permission and permissions cache
    revalidateTag(CACHE_TAGS.PERMISSION)
    revalidateTag(CACHE_TAGS.PERMISSIONS)

    return NextResponse.json({ permission: data })
  } catch (error) {
    console.error('Error updating permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/permissions/[id] - Delete permission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthenticatedUser() // Ensure user is authenticated
    const supabase = await createClient()

    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', (await params).id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate permission, permissions, and related caches
    revalidateTag(CACHE_TAGS.PERMISSION)
    revalidateTag(CACHE_TAGS.PERMISSIONS)
    revalidateTag(CACHE_TAGS.ROLE_PERMISSIONS)

    return NextResponse.json({ message: 'Permission deleted successfully' })
  } catch (error) {
    console.error('Error deleting permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 