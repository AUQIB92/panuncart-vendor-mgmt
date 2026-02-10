/**
 * Fix Vendor Login Refresh Token Issues
 * 
 * PROBLEM: AuthApiError: Invalid Refresh Token: Refresh Token Not Found
 * 
 * CAUSES:
 * 1. Refresh tokens expire after 30 days by default
 * 2. User signs out from another device/session
 * 3. Cookie corruption or mismatch
 * 4. Session timeout issues
 * 
 * SOLUTIONS IMPLEMENTED:
 * 1. Enhanced session management in middleware
 * 2. Better error handling for refresh token failures
 * 3. Automatic redirect to login on auth failures
 * 4. Improved cookie handling
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create Supabase client with enhanced error handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
      // Add auth error handling
      auth: {
        // Detect auth errors and handle gracefully
        detectSessionInUrl: true,
        flowType: 'pkce',
      }
    },
  )

  try {
    // Get user with error handling
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    // Handle auth errors
    if (authError) {
      console.log('Auth error detected:', authError.message)
      
      // Clear invalid session cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'sb-provider-token',
        'sb-provider-refresh-token'
      ]
      
      cookiesToClear.forEach(cookieName => {
        supabaseResponse.cookies.delete(cookieName)
      })
      
      // Redirect to login if accessing protected routes
      const isProtectedRoute = 
        request.nextUrl.pathname.startsWith('/vendor') ||
        request.nextUrl.pathname.startsWith('/admin') ||
        request.nextUrl.pathname.startsWith('/protected')
      
      if (isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        url.searchParams.set('error', 'session_expired')
        return NextResponse.redirect(url)
      }
    }

    const isVendorRoute = request.nextUrl.pathname.startsWith('/vendor')
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/protected')

    // Redirect unauthenticated users from protected routes
    if ((isVendorRoute || isAdminRoute || isProtectedRoute) && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      // Preserve the original destination for redirect after login
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    return supabaseResponse

  } catch (error) {
    console.error('Middleware error:', error)
    
    // On any error, clear auth cookies and redirect to login for protected routes
    const isProtectedRoute = 
      request.nextUrl.pathname.startsWith('/vendor') ||
      request.nextUrl.pathname.startsWith('/admin') ||
      request.nextUrl.pathname.startsWith('/protected')
    
    if (isProtectedRoute) {
      // Clear all auth-related cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'sb-provider-token',
        'sb-provider-refresh-token'
      ]
      
      cookiesToClear.forEach(cookieName => {
        supabaseResponse.cookies.delete(cookieName)
      })
      
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('error', 'authentication_failed')
      return NextResponse.redirect(url)
    }
    
    return supabaseResponse
  }
}
