import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
  }
} 