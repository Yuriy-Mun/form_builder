'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/components/admin/AuthProvider'
import { Skeleton } from '@/components/ui/skeleton'

export function AuthAwareUI({ 
  children,
  unauthenticatedFallback
}: { 
  children: ReactNode
  unauthenticatedFallback?: ReactNode
}) {
  const { user, session, loading } = useAuth()

  // Show loading state
  if (loading) {
    return <Skeleton className="h-full w-full" />
  }

  // If authenticated (has both user and session), show the children
  if (user && session) {
    return <>{children}</>
  }

  // If not authenticated, show fallback or nothing
  return unauthenticatedFallback ? <>{unauthenticatedFallback}</> : null
} 