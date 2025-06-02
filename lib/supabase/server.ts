import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { cache } from 'react';

/**
 * Creates a Supabase client configured for server-side usage with cookies
 */
export async function createClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase client with service role key for admin operations
 * This bypasses RLS and should only be used for admin operations
 */
export function createServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * Validates JWT token locally without making network requests
 * Requires SUPABASE_JWT_SECRET environment variable
 * @param token - JWT token to validate
 * @returns User object or null if validation fails
 */
async function validateJWTLocally(token: string) {
  try {
    if (!process.env.SUPABASE_JWT_SECRET) {
      return null; // Fall back to server validation
    }

    const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return {
      id: payload.sub || '',
      email: payload.email,
      // Add other user properties as needed
    };
  } catch {
    return null;
  }
}

/**
 * Request-scoped cached version - safe for concurrent users
 * Uses React's cache() to ensure data is only cached within a single request
 * This prevents user data leakage between different users
 */
const getCachedUser = cache(async (useLocalValidation: boolean = false) => {
  // Try local JWT validation first if enabled and JWT secret is available
  if (useLocalValidation && process.env.SUPABASE_JWT_SECRET) {
    try {
      const cookieStore = await cookies();
      // Supabase uses different cookie names - try common patterns
      const accessToken = cookieStore.get('sb-access-token')?.value || 
                         cookieStore.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`)?.value ||
                         cookieStore.getAll().find(cookie => cookie.name.includes('auth-token'))?.value;
      
      if (accessToken) {
        const localUser = await validateJWTLocally(accessToken);
        if (localUser) {
          return localUser;
        }
      }
    } catch {
      // Fall through to server validation
    }
  }

    // Fall back to server validation
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  
  return user;
});

/**
 * Gets authenticated user with request-scoped caching
 * Safe for concurrent users - data is only cached within a single request
 * @param useLocalValidation - Whether to try local JWT validation first (requires SUPABASE_JWT_SECRET)
 * @returns Authenticated user object
 * @throws Error if user is not authenticated
 */
export async function getAuthenticatedUser(useLocalValidation = false) {
  return getCachedUser(useLocalValidation);
}

/**
 * Gets authenticated user without caching - always makes fresh request
 * Use this for critical operations where you need the most up-to-date user data
 * @param useLocalValidation - Whether to try local JWT validation first (requires SUPABASE_JWT_SECRET)
 * @returns Authenticated user object
 * @throws Error if user is not authenticated
 */
export async function getAuthenticatedUserFresh(useLocalValidation = false) {
  // Try local JWT validation first if enabled and JWT secret is available
  if (useLocalValidation && process.env.SUPABASE_JWT_SECRET) {
    try {
      const cookieStore = await cookies();
      // Supabase uses different cookie names - try common patterns
      const accessToken = cookieStore.get('sb-access-token')?.value || 
                         cookieStore.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`)?.value ||
                         cookieStore.getAll().find(cookie => cookie.name.includes('auth-token'))?.value;
      
      if (accessToken) {
        console.time('localJWTValidation')
        const localUser = await validateJWTLocally(accessToken);
        console.timeEnd('localJWTValidation')
        if (localUser) {
          return localUser;
        }
      }
    } catch {
      // Fall through to server validation
    }
  }

  // Fall back to server validation
  console.time('supabaseClient')
  const supabase = await createClient();
  console.timeEnd('supabaseClient')
  console.time('supabase.auth.getUser')
  const { data: { user }, error } = await supabase.auth.getUser();
  console.timeEnd('supabase.auth.getUser')
  
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  
  return user;
}

/**
 * For compatibility with existing code
 * @deprecated Use createClient() instead
 */
export async function createServerComponentClient() {
  return await createClient();
} 