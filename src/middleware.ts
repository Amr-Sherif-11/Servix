import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { locales, defaultLocale } from '@/i18n/config'

// --- Security headers applied to every response ---
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co https://translate.googleapis.com https://*.facebook.com https://graph.facebook.com",
      "frame-ancestors 'none'",
    ].join('; ')
  )
  return response
}

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
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // --- Block unauthenticated access to ALL /api/* routes ---
  if (pathname.startsWith('/api/')) {
    // Allow auth-related API routes without authentication
    const publicApiPaths = ['/api/auth/', '/api/translate']
    const isPublicApi = publicApiPaths.some(p => pathname.startsWith(p))

    if (!user && !isPublicApi) {
      return addSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    }

    // Authenticated API requests pass through with security headers
    return addSecurityHeaders(supabaseResponse)
  }

  // Handle locale routing
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // Public routes that don't need auth
  const publicPaths = ['/onboarding', '/auth/role-select', '/auth/login', '/auth/register']
  const isPublicPath = publicPaths.some(p => pathname.startsWith(p))

  // Redirect unauthenticated users trying to access protected routes
  if (!user && !isPublicPath && !pathnameHasLocale && pathname !== '/') {
    return addSecurityHeaders(
      NextResponse.redirect(new URL('/auth/login', request.url))
    )
  }

  // Redirect root to onboarding or home
  if (pathname === '/') {
    if (user) {
      let locale = request.cookies.get('NEXT_LOCALE')?.value || defaultLocale
      if (!locales.includes(locale as any)) {
        locale = defaultLocale
      }
      return addSecurityHeaders(
        NextResponse.redirect(new URL(`/${locale}/home`, request.url))
      )
    } else {
      return addSecurityHeaders(
        NextResponse.redirect(new URL('/onboarding', request.url))
      )
    }
  }

  // Locale-prefixed routes require auth
  if (pathnameHasLocale && !user) {
    return addSecurityHeaders(
      NextResponse.redirect(new URL('/auth/login', request.url))
    )
  }

  return addSecurityHeaders(supabaseResponse)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
