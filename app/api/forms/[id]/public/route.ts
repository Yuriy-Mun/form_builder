import { NextRequest, NextResponse } from 'next/server'
import { getCachedPublicForm } from '@/lib/cache'

// GET /api/forms/[id]/public - Get public form data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await getCachedPublicForm(id)
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching public form:', error)
    return NextResponse.json(
      { error: error.message || 'Form not found' }, 
      { status: 404 }
    )
  }
} 