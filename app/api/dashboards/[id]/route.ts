import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { getCachedDashboard, CACHE_TAGS } from '@/lib/cache'
import { revalidateTag } from 'next/cache'

// GET /api/dashboards/[id] - Get specific dashboard
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    
    const dashboard = await getCachedDashboard((await params).id, user.id)
    
    return NextResponse.json({ dashboard })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/dashboards/[id] - Update dashboard
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('dashboards')
      .update(body)
      .eq('id', (await params).id)
      .eq('created_by', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate dashboard and dashboards cache
    revalidateTag(CACHE_TAGS.DASHBOARD)
    revalidateTag(CACHE_TAGS.DASHBOARDS)

    return NextResponse.json({ dashboard: data })
  } catch (error) {
    console.error('Error updating dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/dashboards/[id] - Delete dashboard
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = await createClient()

    const { error } = await supabase
      .from('dashboards')
      .delete()
      .eq('id', (await params).id)
      .eq('created_by', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate dashboard and dashboards cache
    revalidateTag(CACHE_TAGS.DASHBOARD)
    revalidateTag(CACHE_TAGS.DASHBOARDS)

    return NextResponse.json({ message: 'Dashboard deleted successfully' })
  } catch (error) {
    console.error('Error deleting dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 