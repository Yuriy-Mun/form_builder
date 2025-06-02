// This API route has been removed for security reasons.
// 
// Cache revalidation should be done server-side using:
// 1. Direct revalidateTag() calls in API routes after mutations
// 2. Server Actions from lib/cache-actions.ts for manual revalidation
// 3. Webhook endpoints with proper authentication for external integrations
//
// If you need webhook-based revalidation, create a specific endpoint
// with proper authentication and rate limiting.

import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getAuthenticatedUser } from '@/lib/supabase/server'

// Secret key for webhook-based revalidation (optional)
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint has been disabled for security reasons',
      message: 'Use server actions for cache revalidation instead'
    },
    { status: 410 } // Gone
  )
}

// GET method for query parameter based revalidation (also secured)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint has been disabled for security reasons',
      message: 'Use server actions for cache revalidation instead'
    },
    { status: 410 } // Gone
  )
} 