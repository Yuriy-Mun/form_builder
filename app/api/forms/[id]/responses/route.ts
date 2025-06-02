import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { getCachedFormResponses, CACHE_TAGS } from '@/lib/cache'
import { revalidateTag } from 'next/cache'

// GET /api/forms/[id]/responses - Get form responses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    
    const responses = await getCachedFormResponses((await params).id, user.id)
    
    return NextResponse.json({ responses })
  } catch (error) {
    console.error('Error fetching form responses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/forms/[id]/responses - Create form response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const formId = (await params).id
    console.log('formId', formId)
    // Verify form exists and is active, and get fields
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select(`
        id, 
        active, 
        require_login,
        fields:form_fields(*)
      `)
      .eq('id', formId)
      .single()
    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (!form.active) {
      return NextResponse.json({ error: 'Form is not active' }, { status: 400 })
    }

    // Check if login is required
    let userId = null;
    if (form.require_login) {
      try {
        const user = await getAuthenticatedUser()
        userId = user.id
      } catch (error) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
    }

    const filteredValues = body.response_data || {}
    const fields = form.fields || []

    // First, create the main form response record
    const { data: responseData, error: responseError } = await supabase
      .from('form_responses')
      .insert({
        form_id: formId,
        user_id: userId,
        completed_at: new Date().toISOString(),
        data: filteredValues, // Store as JSONB for backup/reference
        metadata: {
          user_agent: request.headers.get('user-agent') || '',
          timestamp: new Date().toISOString()
        }
      })
      .select('id, completed_at')
      .single()

    if (responseError) {
      return NextResponse.json({ error: responseError.message }, { status: 400 })
    }

    const responseId = responseData.id

    // Then, save each field value individually in form_response_values
    const responseValues = []

    for (const [fieldId, value] of Object.entries(filteredValues as Record<string, any>)) {
      // Skip empty values
      if (value === '' || value === null || value === undefined) continue

      // Find the field to get its type
      const field = fields.find(f => f.id === fieldId)
      if (!field) continue

      let processedValue = value
      let numericValue = null
      let booleanValue = null

      // Process value based on field type
      switch (field.type) {
        case 'number':
          numericValue = typeof value === 'number' ? value : parseFloat(value)
          processedValue = String(value)
          break
        case 'switch':
        case 'toggle':
          booleanValue = Boolean(value)
          processedValue = String(value)
          break
        case 'checkbox':
          // For checkboxes, create separate entries for each selected option
          if (Array.isArray(value) && value.length > 0) {
            for (const option of value) {
              responseValues.push({
                response_id: responseId,
                field_id: fieldId,
                value: option,
                numeric_value: null,
                boolean_value: null
              })
            }
            continue // Skip the main entry for checkbox arrays
          }
          break
        case 'radio':
        case 'select':
        case 'text':
        case 'email':
        case 'url':
        case 'tel':
        case 'textarea':
        case 'date':
        case 'time':
        case 'file':
        default:
          processedValue = String(value)
          break
      }

      // Add the main entry (skip if it was a checkbox array)
      if (field.type !== 'checkbox' || !Array.isArray(value)) {
        responseValues.push({
          response_id: responseId,
          field_id: fieldId,
          value: processedValue,
          numeric_value: numericValue,
          boolean_value: booleanValue
        })
      }
    }

    // Insert all response values
    if (responseValues.length > 0) {
      const { error: valuesError } = await supabase
        .from('form_response_values')
        .insert(responseValues)

      if (valuesError) {
        return NextResponse.json({ error: valuesError.message }, { status: 400 })
      }
    }

    // Revalidate form responses cache
    revalidateTag(CACHE_TAGS.FORM_RESPONSES)

    return NextResponse.json({ 
      response: {
        id: responseId,
        form_id: formId,
        user_id: userId,
        completed_at: responseData.completed_at
      }
    })
  } catch (error) {
    console.error('Error creating form response:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 