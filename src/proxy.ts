import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROLE_REDIRECTS, type UserRole } from '@/lib/types'

export async function proxy(request: NextRequest) {
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
      const { data: profile } = await supabase
        .from('user_profiles').select('role').eq('user_id', user.id).single()
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

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('user_id', user.id).single()

  if (!profile) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const role = profile.role as UserRole
  const allowedRoot = ROLE_REDIRECTS[role]

  if (pathname === '/') {
    return NextResponse.redirect(new URL(allowedRoot, request.url))
  }

  // Principal can access both /principal/* and /admin/* routes
  const allowedPrefixes =
    role === 'principal' ? ['/principal', '/admin'] : [allowedRoot]

  const isAllowed = allowedPrefixes.some(prefix => pathname.startsWith(prefix))
  if (!isAllowed) {
    return NextResponse.redirect(new URL(allowedRoot, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
