import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(req: NextRequest) {
  // Call updateSession to refresh the session cookie
  const res = await updateSession(req)

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.delete(name)
        },
      },
    }
  )

  // Get user - this is safe because we already refreshed the session above
  const { data: { user } } = await supabase.auth.getUser()
  console.log('user', user)
  // Only check admin routes (except login)
  if (req.nextUrl.pathname.startsWith('/admin') && 
      req.nextUrl.pathname !== '/admin/login') {
    
    if (!user) {
      // No authenticated user - redirect to login
      const redirectUrl = new URL('/admin/login', req.url)
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    try {
      const userRole = (await supabase.from('users').select('role_id').eq('id', user.id).single()).data?.role_id
      
      // Check if user has admin.access permission
      const { data: userRolePermissions, error: permissionError } = await supabase
        .from('roles_permissions')
        .select(`
          id,
          roles:role_id(id, name, code),
          permissions:permission_id(id, name, slug)
        `)
        .eq('role_id', userRole)
        .eq('permissions.slug', 'admin.access');
        
      if (permissionError || !userRolePermissions || userRolePermissions.length === 0) {
        // User doesn't have admin.access permission
        return NextResponse.redirect(new URL('/forbidden', req.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
} 