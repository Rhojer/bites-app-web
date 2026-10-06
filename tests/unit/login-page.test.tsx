import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/login/page'

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: vi.fn().mockImplementation((key: string) => (key === 'redirect' ? '/pos' : null)),
  }),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fill,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

// Mock Supabase client
const mockSignInWithPassword = vi.fn()
const mockSignInWithOAuth = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}))

describe('LoginPage - Vista de Autenticación BITES Street Food', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza correctamente todos los elementos de marca, campos y títulos según Stitch', () => {
    render(<LoginPage />)

    // Título de sección de login
    expect(screen.getByRole('heading', { name: /INICIAR SESIÓN/i })).toBeInTheDocument()

    // Elementos de marca BITES y badges
    expect(screen.getByText(/STAFF POS/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Street Kitchen • Flagship Hub/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/STREET FOOD/i).length).toBeGreaterThanOrEqual(1)

    // Campos del formulario
    expect(screen.getByLabelText(/Usuario o Correo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Contraseña$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mantener sesión iniciada en este equipo/i)).toBeInTheDocument()

    // Botones de acción
    expect(screen.getByRole('button', { name: /ENTRAR AL SISTEMA/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /PIN \/ Huella POS/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Google Work/i })).toBeInTheDocument()

    // Chips y Footer de estado
    expect(screen.getByText(/24 DE JULIO/i)).toBeInTheDocument()
    expect(screen.getByText(/BITES Hub v2.4/i)).toBeInTheDocument()
    expect(screen.getByText(/SSL Activo/i)).toBeInTheDocument()
  })

  it('permite alternar la visibilidad de la contraseña con el botón del ojo', () => {
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText(/^Contraseña$/i)
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleButton = screen.getByLabelText(/Mostrar u ocultar contraseña/i)
    fireEvent.click(toggleButton)

    expect(passwordInput).toHaveAttribute('type', 'text')

    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('autentica con éxito al enviar credenciales válidas y redirige', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { session: { access_token: 'fake-token' }, user: { id: 'usr-1' } },
      error: null,
    })

    render(<LoginPage />)

    const userInput = screen.getByLabelText(/Usuario o Correo/i)
    const passwordInput = screen.getByLabelText(/^Contraseña$/i)
    const submitButton = screen.getByRole('button', { name: /ENTRAR AL SISTEMA/i })

    fireEvent.change(userInput, { target: { value: 'admin@bitesfood.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'admin@bitesfood.com',
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/pos')
    })
  })

  it('completa el dominio corporativo automáticamente si se ingresa solo el nombre de usuario', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { session: { access_token: 'fake-token' }, user: { id: 'usr-2' } },
      error: null,
    })

    render(<LoginPage />)

    const userInput = screen.getByLabelText(/Usuario o Correo/i)
    const passwordInput = screen.getByLabelText(/^Contraseña$/i)
    const submitButton = screen.getByRole('button', { name: /ENTRAR AL SISTEMA/i })

    fireEvent.change(userInput, { target: { value: 'cajero1' } })
    fireEvent.change(passwordInput, { target: { value: 'clave456' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'cajero1@bitesfood.com',
        password: 'clave456',
      })
    })
  })

  it('muestra un mensaje de error si las credenciales son inválidas', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials' },
    })

    render(<LoginPage />)

    const userInput = screen.getByLabelText(/Usuario o Correo/i)
    const passwordInput = screen.getByLabelText(/^Contraseña$/i)
    const submitButton = screen.getByRole('button', { name: /ENTRAR AL SISTEMA/i })

    fireEvent.change(userInput, { target: { value: 'incorrecto@bitesfood.com' } })
    fireEvent.change(passwordInput, { target: { value: 'clavemalo' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /Credenciales inválidas. Verifica tu usuario y contraseña de turno./i
      )
    })
  })

  it('abre el modal de PIN de turno POS y permite validar PIN', async () => {
    render(<LoginPage />)

    const pinButton = screen.getByRole('button', { name: /PIN \/ Huella POS/i })
    fireEvent.click(pinButton)

    expect(screen.getByText(/Acceso PIN de Turno/i)).toBeInTheDocument()

    // Pulsar botones del teclado numérico: 1, 2, 3, 4
    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: '3' }))
    fireEvent.click(screen.getByRole('button', { name: '4' }))

    await waitFor(
      () => {
        expect(screen.getByText(/¡PIN verificado!/i)).toBeInTheDocument()
      },
      { timeout: 1500 }
    )
  })

  it('abre el modal de soporte al hacer clic en Ayuda', () => {
    render(<LoginPage />)

    const helpButton = screen.getByRole('button', { name: /Ayuda/i })
    fireEvent.click(helpButton)

    expect(screen.getByText(/Soporte y Asistencia Operativa/i)).toBeInTheDocument()
    expect(screen.getByText(/Supervisor de Turno/i)).toBeInTheDocument()
  })
})
