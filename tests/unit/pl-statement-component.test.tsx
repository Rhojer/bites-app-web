import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PLStatement, PLData } from '@/components/finances/pl-statement'

describe('Component: PLStatement UI Rendering', () => {
  const mockData: PLData = {
    totalRevenue: 1000.0,
    foodCost: 280.0,
    wasteCost: 20.0,
    totalFoodCost: 300.0,
    grossProfit: 700.0,
    grossMarginPct: 70.0,
    fixedExpenses: 300.0,
    variableExpenses: 100.0,
    totalExpenses: 400.0,
    bankCommissions: 25.0,
    netProfit: 275.0,
    netMarginPct: 27.5,
    ordersCount: 42,
  }

  it('debe renderizar los KPIs principales de ingresos, food cost, margen bruto y utilidad neta', () => {
    render(<PLStatement data={mockData} />)

    // Ingresos
    expect(screen.getByText('1. Ingresos Totales')).toBeInTheDocument()
    expect(screen.getAllByText('$1000.00').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('42 órdenes registradas')).toBeInTheDocument()

    // Food Cost
    expect(screen.getByText('2. Costo Insumos')).toBeInTheDocument()
    expect(screen.getAllByText('-$300.00').length).toBeGreaterThanOrEqual(1)

    // Utilidad Bruta
    expect(screen.getByText('3. Utilidad Bruta')).toBeInTheDocument()
    expect(screen.getAllByText('$700.00').length).toBeGreaterThanOrEqual(1)

    // Utilidad Neta Real
    expect(screen.getByText('5. Utilidad Neta Real')).toBeInTheDocument()
    expect(screen.getAllByText('+$275.00').length).toBeGreaterThanOrEqual(1)
  })

  it('debe mostrar el diagnóstico de salud financiera óptimo cuando food cost <= 32% y margen neto >= 15%', () => {
    render(<PLStatement data={mockData} />)

    expect(screen.getByText(/30.0% — Óptimo/i)).toBeInTheDocument()
    expect(screen.getByText(/27.5% — Excelente Rentabilidad/i)).toBeInTheDocument()
  })

  it('debe mostrar alerta de pérdida operativa cuando netProfit < 0', () => {
    const lossData: PLData = {
      ...mockData,
      totalRevenue: 500.0,
      totalExpenses: 800.0,
      netProfit: -325.0,
      netMarginPct: -65.0,
    }

    render(<PLStatement data={lossData} />)

    expect(screen.getAllByText('-$325.00').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/-65.0% — Pérdida Operativa/i)).toBeInTheDocument()
  })
})
