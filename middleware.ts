import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(req: NextRequest) {
  console.time('updateSession')
  // Call updateSession to refresh the session cookie and get user
  const { response: res, user, supabase } = await updateSession(req)
  console.timeEnd('updateSession')

  console.time('checkAdminRoutes')
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
  console.timeEnd('checkAdminRoutes')
  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
} 