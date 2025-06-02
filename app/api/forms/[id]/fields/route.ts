import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { getCachedFormFields, CACHE_TAGS } from '@/lib/cache'
import { revalidateTag } from 'next/cache'

// GET /api/forms/[id]/fields - Get form fields
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    
    const fields = await getCachedFormFields((await params).id, user.id)
    
    return NextResponse.json({ fields })
  } catch (error) {
    console.error('Error fetching form fields:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/forms/[id]/fields - Create form field
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    const body = await request.json()
    const supabase = await createClient()

    // First verify form ownership
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id')
      .eq('id', (await params).id)
      .eq('created_by', user.id)
      .single()

    if (formError) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('form_fields')
      .insert({
        ...body,
        form_id: (await params).id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate form fields cache
    revalidateTag(CACHE_TAGS.FORM_FIELDS)
    revalidateTag(CACHE_TAGS.FORM)
    revalidateTag(CACHE_TAGS.PUBLIC_FORM)

    return NextResponse.json({ field: data })
  } catch (error) {
    console.error('Error creating form field:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/forms/[id]/fields - Bulk update fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    const { fields } = await request.json()
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

    const formId = (await params).id
    const { data, error } = await supabase
      .from('form_fields')
      .upsert(fields.map((field: any) => ({ ...field, form_id: formId })))
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Revalidate form fields cache
    revalidateTag(CACHE_TAGS.FORM_FIELDS)
    revalidateTag(CACHE_TAGS.FORM)
    revalidateTag(CACHE_TAGS.PUBLIC_FORM)

    return NextResponse.json({ fields: data })
  } catch (error) {
    console.error('Error updating form fields:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 