import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { getCachedRolePermissions, CACHE_TAGS } from '@/lib/cache'
import { revalidateTag } from 'next/cache'

// GET /api/roles/[id]/permissions - Get role permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthenticatedUser() // Ensure user is authenticated
    
    const permissions = await getCachedRolePermissions((await params).id)
    
    return NextResponse.json({ permissions })
  } catch (error) {
    console.error('Error fetching role permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/roles/[id]/permissions - Add permission to role
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthenticatedUser() // Ensure user is authenticated
    const body = await request.json()
    const supabase = await createClient()

    const { permission_id } = body

    if (!permission_id) {
      return NextResponse.json(
        { error: 'Permission ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('role_permissions')
      .insert({
        role_id: (await params).id,
        permission_id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate role permissions cache
    revalidateTag(CACHE_TAGS.ROLE_PERMISSIONS)
    revalidateTag(CACHE_TAGS.ROLE)

    return NextResponse.json({ role_permission: data })
  } catch (error) {
    console.error('Error adding permission to role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/roles/[id]/permissions - Remove permission from role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthenticatedUser() // Ensure user is authenticated
    const { searchParams } = new URL(request.url)
    const permissionId = searchParams.get('permission_id')
    const supabase = await createClient()

    if (!permissionId) {
      return NextResponse.json(
        { error: 'Permission ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', (await params).id)
      .eq('permission_id', permissionId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate role permissions cache
    revalidateTag(CACHE_TAGS.ROLE_PERMISSIONS)
    revalidateTag(CACHE_TAGS.ROLE)

    return NextResponse.json({ message: 'Permission removed from role successfully' })
  } catch (error) {
    console.error('Error removing permission from role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 