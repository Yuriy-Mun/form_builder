import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { getCachedForm, CACHE_TAGS } from '@/lib/cache'
import { revalidateTag } from 'next/cache'

// GET /api/forms/[id] - Get specific form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.time('getAuthenticatedUser')
    const user = await getAuthenticatedUser()
    console.timeEnd('getAuthenticatedUser')
    
    console.time('getCachedForm')
    const form = await getCachedForm((await params).id, user.id)
    console.timeEnd('getCachedForm')
    return NextResponse.json({ form })
  } catch (error) {
    console.error('Error fetching form:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/forms/[id] - Update form
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('forms')
      .update(body)
      .eq('id', (await params).id)
      .eq('created_by', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate form and forms cache
    revalidateTag(CACHE_TAGS.FORM)
    revalidateTag(CACHE_TAGS.FORMS)
    revalidateTag(CACHE_TAGS.PUBLIC_FORM)

    return NextResponse.json({ form: data })
  } catch (error) {
    console.error('Error updating form:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/forms/[id] - Delete form
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = await createClient()

    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', (await params).id)
      .eq('created_by', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate form, forms, and related caches
    revalidateTag(CACHE_TAGS.FORM)
    revalidateTag(CACHE_TAGS.FORMS)
    revalidateTag(CACHE_TAGS.FORM_FIELDS)
    revalidateTag(CACHE_TAGS.FORM_RESPONSES)
    revalidateTag(CACHE_TAGS.PUBLIC_FORM)

    return NextResponse.json({ message: 'Form deleted successfully' })
  } catch (error) {
    console.error('Error deleting form:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 