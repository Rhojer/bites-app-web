import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqvdopbegosjggkxamoo.supabase.co'
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdmRvcGJlZ29zamdna3hhbW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjE1MTksImV4cCI6MjEwMjczNzUxOX0.6QwwCBOp711RUakYcEHFofpwF9AFnNNHyEa8GGEJSHk'

  const isHttps = request.nextUrl.protocol === 'https:'

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, {
            ...options,
            path: '/',
            sameSite: 'lax',
            secure: isHttps,
          })
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const hasPosSession = request.cookies.get('bites_pos_session')?.value === 'active'
  const isAuthenticated = Boolean(user || hasPosSession)

  // Normalizar el pathname removiendo un posible prefijo de subpath como /bites-app-web
  const cleanPath = pathname.replace(/^\/bites-app-web/, '') || '/'

  // Rutas públicas que no deben ser redirigidas a login
  const isPublic =
    cleanPath === '/login' ||
    cleanPath.startsWith('/auth') ||
    cleanPath.startsWith('/api') ||
    cleanPath.startsWith('/images') ||
    cleanPath === '/favicon.ico' ||
    cleanPath === '/manifest.json' ||
    cleanPath === '/sw.js' ||
    cleanPath.endsWith('.json') ||
    cleanPath.endsWith('.js')

  // Si no está autenticado y trata de entrar a cualquier página protegida, redirige de una a /login
  if (!isAuthenticated && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    if (cleanPath !== '/') {
      url.searchParams.set('redirect', cleanPath)
    } else {
      url.searchParams.delete('redirect')
    }
    return NextResponse.redirect(url)
  }

  // Si ya está autenticado y trata de entrar a /login, redirige al inicio /
  if (isAuthenticated && cleanPath === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.delete('redirect')
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

