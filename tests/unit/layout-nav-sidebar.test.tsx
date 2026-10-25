import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Navbar } from '@/components/layout/navbar'
import { SidebarContent } from '@/components/layout/sidebar'

const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => '/',
}))

const mockSignOut = vi.fn().mockResolvedValue({ error: null })
const mockSelect = vi.fn().mockReturnValue({
  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
})

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
    from: () => ({
      select: mockSelect,
    }),
  }),
}))

describe('Navbar y Sidebar Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('el Navbar no muestra el bloque de Administrador ni el botón de salir superior', () => {
    render(<Navbar title="Dashboard de Pruebas" />)

    // No debe existir el texto 'Admin General' en el Navbar superior
    expect(screen.queryByText('Admin General')).toBeNull()
    // Debe existir el título
    expect(screen.getByText('Dashboard de Pruebas')).toBeDefined()
    // Debe tener el botón de notificaciones habilitado
    expect(screen.getByLabelText('Abrir panel de notificaciones')).toBeDefined()
  })

  it('el botón de notificaciones abre y cierra el panel interactivo', async () => {
    render(<Navbar title="Dashboard" />)

    const notifBtn = screen.getByLabelText('Abrir panel de notificaciones')
    fireEvent.click(notifBtn)

    // El panel de notificaciones se muestra
    expect(screen.getByText('Notificaciones')).toBeDefined()
    expect(screen.getByText('Tasa BCV Sincronizada')).toBeDefined()

    // Permite marcar todas como leídas
    const markAllBtn = screen.getByText('Leer todas')
    fireEvent.click(markAllBtn)
    expect(screen.getByText('Al día')).toBeDefined()
  })

  it('el Sidebar contiene los datos de Administrador y el botón de Cerrar Sesión al final', async () => {
    render(<SidebarContent />)

    // El sidebar debe contener al Administrador
    expect(screen.getByText('Administrador')).toBeDefined()
    expect(screen.getByText('Admin General')).toBeDefined()

    // El botón de Cerrar Sesión debe estar presente
    const logoutBtn = screen.getByRole('button', { name: /Cerrar Sesión/i })
    expect(logoutBtn).toBeDefined()

    // Al hacer click llama a signOut y redirige a /login
    fireEvent.click(logoutBtn)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('el Sidebar cuenta con píldora indicadora deslizante y botones tipo píldora', () => {
    render(<SidebarContent />)

    // Verifica que la píldora indicadora exista
    const indicator = screen.getByTestId('sidebar-pill-indicator')
    expect(indicator).toBeDefined()
    expect(indicator.style.transform).toBe('translate3d(0, 0px, 0)')

    // Verifica que los botones de navegación tengan el estilo de píldora rounded-full
    const resumenLink = screen.getByText('Resumen').closest('a')
    expect(resumenLink?.className).toContain('rounded-full')

    // Al hacer clic en otro ítem (ej: 'Tomar Pedidos' que es índice 1), la píldora se mueve
    const posLink = screen.getByText('Tomar Pedidos')
    fireEvent.click(posLink)

    expect(indicator.style.transform).toBe('translate3d(0, 50px, 0)')
  })
})
