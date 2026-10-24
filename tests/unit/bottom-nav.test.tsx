import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BottomNav } from '@/components/layout/bottom-nav'

let currentMockPathname = '/pos'

vi.mock('next/navigation', () => ({
  usePathname: () => currentMockPathname,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('BottomNav - Navegación Móvil Estilo iOS con Píldoras', () => {
  beforeEach(() => {
    currentMockPathname = '/pos'
    vi.clearAllMocks()
  })

  it('renderiza correctamente los 5 botones de navegación', () => {
    render(<BottomNav />)

    expect(screen.getByText('POS')).toBeDefined()
    expect(screen.getByText('Cocina')).toBeDefined()
    expect(screen.getByText('Caja')).toBeDefined()
    expect(screen.getByText('Clientes')).toBeDefined()
    expect(screen.getByText('Más')).toBeDefined()
  })

  it('posiciona la píldora indicadora en la pestaña activa según la ruta', () => {
    currentMockPathname = '/pos'
    const { rerender } = render(<BottomNav />)
    let indicator = screen.getByTestId('bottom-nav-pill-indicator')
    expect(indicator.style.transform).toBe('translate3d(0%, 0, 0)')

    currentMockPathname = '/kitchen'
    rerender(<BottomNav />)
    indicator = screen.getByTestId('bottom-nav-pill-indicator')
    expect(indicator.style.transform).toBe('translate3d(100%, 0, 0)')

    currentMockPathname = '/cash-register'
    rerender(<BottomNav />)
    indicator = screen.getByTestId('bottom-nav-pill-indicator')
    expect(indicator.style.transform).toBe('translate3d(200%, 0, 0)')

    currentMockPathname = '/crm'
    rerender(<BottomNav />)
    indicator = screen.getByTestId('bottom-nav-pill-indicator')
    expect(indicator.style.transform).toBe('translate3d(300%, 0, 0)')

    // Ruta de módulo secundario (ej: /sales o resumen /) activa la píldora en "Más" (índice 4)
    currentMockPathname = '/sales'
    rerender(<BottomNav />)
    indicator = screen.getByTestId('bottom-nav-pill-indicator')
    expect(indicator.style.transform).toBe('translate3d(400%, 0, 0)')

    currentMockPathname = '/'
    rerender(<BottomNav />)
    indicator = screen.getByTestId('bottom-nav-pill-indicator')
    expect(indicator.style.transform).toBe('translate3d(400%, 0, 0)')
  })

  it('actualiza de forma optimista e inmediata la píldora al hacer clic en otra pestaña', () => {
    currentMockPathname = '/pos'
    render(<BottomNav />)

    const indicator = screen.getByTestId('bottom-nav-pill-indicator')
    expect(indicator.style.transform).toBe('translate3d(0%, 0, 0)')

    // Al hacer clic en Caja, la píldora salta inmediatamente al slot 2 (200%)
    const cajaBtn = screen.getByText('Caja')
    fireEvent.click(cajaBtn)

    expect(indicator.style.transform).toBe('translate3d(200%, 0, 0)')
  })

  it('abre el drawer de módulos al hacer clic en Más', () => {
    currentMockPathname = '/pos'
    render(<BottomNav />)

    const moreTrigger = screen.getByLabelText('Más módulos')
    fireEvent.click(moreTrigger)

    expect(screen.getByText('Todos los Módulos')).toBeDefined()
    expect(screen.getByText('Historial de Ventas')).toBeDefined()
    expect(screen.getByText('Menú y Costos')).toBeDefined()
    expect(screen.getByText('Inventario')).toBeDefined()
    expect(screen.getByText('Finanzas')).toBeDefined()
  })
})
