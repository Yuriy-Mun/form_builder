import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { getCachedForms, CACHE_TAGS } from '@/lib/cache'
import { revalidateTag } from 'next/cache'

// GET /api/forms - Get all forms for the authenticated user
export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    console.time('getCachedForms')
    const forms = await getCachedForms(user.id)
    console.timeEnd('getCachedForms')
    return NextResponse.json({ forms })
  } catch (error) {
    console.error('Error fetching forms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/forms - Create new form
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const body = await request.json()
    const supabase = await createClient()

    const { title, description, active = true } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('forms')
      .insert({
        title,
        description,
        active,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate forms cache
    revalidateTag(CACHE_TAGS.FORMS)
    revalidateTag(CACHE_TAGS.PUBLIC_FORM)

    return NextResponse.json({ form: data })
  } catch (error) {
    console.error('Error creating form:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 