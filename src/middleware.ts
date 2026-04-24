import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROLE_REDIRECTS, type UserRole } from '@/lib/types'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    if (user) {
      // Already logged in — redirect to their dashboard
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      if (profile) {
        return NextResponse.redirect(
          new URL(ROLE_REDIRECTS[profile.role as UserRole], request.url)
        )
      }
    }
    return supabaseResponse
  }

  // Protected routes — require auth
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role guard: ensure user only accesses their own dashboard root
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const allowedRoot = ROLE_REDIRECTS[profile.role as UserRole]
  if (!pathname.startsWith(allowedRoot) && pathname !== '/') {
    return NextResponse.redirect(new URL(allowedRoot, request.url))
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL(allowedRoot, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
