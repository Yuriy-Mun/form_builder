import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Create a response object to manipulate cookies
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Initialize Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    }
  )

  // Verify authenticated user using getUser which is more secure
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  // Only check admin routes (except login)
  if (req.nextUrl.pathname.startsWith('/admin') && 
      req.nextUrl.pathname !== '/admin/login') {
    
    if (!user || userError) {
      // No authenticated user - redirect to login
      const redirectUrl = new URL('/admin/login', req.url)
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    try {
      const userRole = (await supabase.from('users').select('role_id').eq('id', user.id).single()).data?.role_id
      console.log('userRole', userRole)
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
      console.error('Middleware permission check error:', error);
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
} 