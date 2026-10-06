import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Mock createServerClient
const mockGetUser = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}))

describe('Middleware Auth Gatekeeper (updateSession)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake-supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake-anon-key'
  })

  it('redirige a /login inmediatamente cuando un usuario no autenticado entra a la raíz /', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })

    const request = new NextRequest('http://localhost:3000/')
    const response = await updateSession(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/login')
  })

  it('redirige a /login con parámetro redirect cuando entra a una ruta protegida como /pos', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })

    const request = new NextRequest('http://localhost:3000/pos')
    const response = await updateSession(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Fpos')
  })

  it('permite el acceso sin redirección si la ruta es pública (/login)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })

    const request = new NextRequest('http://localhost:3000/login')
    const response = await updateSession(request)

    // Código 200 (NextResponse.next)
    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('permite el acceso si tiene la cookie de sesión rápida de turno POS (bites_pos_session=active)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })

    const request = new NextRequest('http://localhost:3000/', {
      headers: {
        cookie: 'bites_pos_session=active',
      },
    })
    const response = await updateSession(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('redirige de /login al dashboard / si el usuario ya está autenticado', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'usr-123', email: 'cajero@bitesfood.com' } },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/login')
    const response = await updateSession(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/')
  })
})
