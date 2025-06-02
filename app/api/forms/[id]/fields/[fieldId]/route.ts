import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { CACHE_TAGS } from '@/lib/cache'
import { revalidateTag } from 'next/cache'

// PUT /api/forms/[id]/fields/[fieldId] - Update specific field
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    const body = await request.json()
    const supabase = await createClient()

    // First verify the form belongs to the user
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id')
      .eq('id', (await params).id)
      .eq('created_by', user.id)
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('form_fields')
      .update(body)
      .eq('id', (await params).fieldId)
      .eq('form_id', (await params).id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate form fields cache
    revalidateTag(CACHE_TAGS.FORM_FIELDS)
    revalidateTag(CACHE_TAGS.FORM)

    return NextResponse.json({ field: data })
  } catch (error) {
    console.error('Error updating form field:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/forms/[id]/fields/[fieldId] - Delete specific field
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = await createClient()

    // First verify the form belongs to the user
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id')
      .eq('id', (await params).id)
      .eq('created_by', user.id)
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('form_fields')
      .delete()
      .eq('id', (await params).fieldId)
      .eq('form_id', (await params).id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate form fields cache
    revalidateTag(CACHE_TAGS.FORM_FIELDS)
    revalidateTag(CACHE_TAGS.FORM)

    return NextResponse.json({ message: 'Field deleted successfully' })
  } catch (error) {
    console.error('Error deleting form field:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 