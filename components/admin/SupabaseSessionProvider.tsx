'use client'

import { useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export function SupabaseSessionProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize Supabase auth
    const initializeSupabase = async () => {
      try {
        // This will refresh the session if needed and establish cookies correctly
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error initializing Supabase session:', error)
        }
      } catch (err) {
        console.error('Failed to initialize Supabase:', err)
      } finally {
        setIsInitialized(true)
      }
    }

    initializeSupabase()
  }, [])

  // Only render children after initialization to ensure session is set up
  if (!isInitialized) {
    return null // Or a loading indicator
  }

  return <>{children}</>
} 