import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { getCachedDashboards, CACHE_TAGS } from '@/lib/cache'
import { revalidateTag } from 'next/cache'

// GET /api/dashboards - Get all dashboards for the authenticated user
export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    
    const dashboards = await getCachedDashboards(user.id)
    
    return NextResponse.json({ dashboards })
  } catch (error) {
    console.error('Error fetching dashboards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/dashboards - Create new dashboard
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const body = await request.json()
    const supabase = await createClient()

    const { title, description, config, active = true } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('dashboards')
      .insert({
        title,
        description,
        config,
        active,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate dashboards cache
    revalidateTag(CACHE_TAGS.DASHBOARDS)

    return NextResponse.json({ dashboard: data })
  } catch (error) {
    console.error('Error creating dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 