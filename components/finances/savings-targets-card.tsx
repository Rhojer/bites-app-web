'use client'

import { useState } from 'react'
import {
  Target,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  DollarSign,
  Calendar,
  Settings2,
  CheckCircle2,
  PieChart
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface SavingsTargetsCardProps {
  currentSales: number
  pendingBillsAmount: number
  currentFoodCostPct?: number
  defaultSalesTarget?: number
  defaultReserveTarget?: number
}

export function SavingsTargetsCard({
  currentSales,
  pendingBillsAmount,
  currentFoodCostPct = 31.2,
  defaultSalesTarget = 6000,
  defaultReserveTarget = 1500,
}: SavingsTargetsCardProps) {
  const [salesTarget, setSalesTarget] = useState(defaultSalesTarget)
  const [reserveTarget, setReserveTarget] = useState(defaultReserveTarget)
  const [editOpen, setEditOpen] = useState(false)

  // Temp form state
  const [tempSalesTarget, setTempSalesTarget] = useState(salesTarget.toString())
  const [tempReserveTarget, setTempReserveTarget] = useState(reserveTarget.toString())

  // Cálculos de progreso
  const salesPct = Math.min(100, Math.round((currentSales / (salesTarget || 1)) * 100))
  const remainingSales = Math.max(0, salesTarget - currentSales)

  // Días restantes en el mes actual
  const today = new Date()
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysLeft = Math.max(1, lastDayOfMonth - today.getDate())
  const requiredDailyPace = remainingSales / daysLeft

  // Fondo de reserva vs facturas pendientes
  const reserveCoveragePct = reserveTarget > 0 ? Math.min(100, Math.round((pendingBillsAmount / reserveTarget) * 100)) : 0

  function handleSaveTargets() {
    const s = parseFloat(tempSalesTarget) || salesTarget
    const r = parseFloat(tempReserveTarget) || reserveTarget
    setSalesTarget(s)
    setReserveTarget(r)
    setEditOpen(false)
  }

  return (
    <Card className="border shadow-xs rounded-2xl overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Target className="size-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Metas Financieras & Objetivos de Ahorro (Savings Targets)
              </CardTitle>
              <CardDescription className="text-xs">
                Seguimiento de meta de ventas, fondo de reserva y control de costo
              </CardDescription>
            </div>
          </div>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" size="xs" className="text-xs gap-1.5 h-8 px-2.5 rounded-xl">
                  <Settings2 className="size-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Ajustar Metas</span>
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[400px] p-5 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold">Ajustar Metas del Mes</DialogTitle>
                <DialogDescription className="text-xs">
                  Modifica los objetivos financieros del restaurante para este período.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Meta de Ventas del Mes ($ USD):</label>
                  <Input
                    type="number"
                    value={tempSalesTarget}
                    onChange={(e) => setTempSalesTarget(e.target.value)}
                    className="h-9 font-mono"
                    placeholder="6000.00"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Fondo de Reserva para Proveedores ($ USD):</label>
                  <Input
                    type="number"
                    value={tempReserveTarget}
                    onChange={(e) => setTempReserveTarget(e.target.value)}
                    className="h-9 font-mono"
                    placeholder="1500.00"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)} className="text-xs h-9 rounded-xl">
                  Cancelar
                </Button>
                <Button onClick={handleSaveTargets} className="text-xs font-bold h-9 rounded-xl">
                  Guardar Metas
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Target 1: Meta de Ventas Mensual */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-primary" /> Meta de Ventas Mensual
              </span>
              <Badge variant={salesPct >= 100 ? 'default' : 'outline'} className="text-[10px] font-mono font-bold">
                {salesPct}%
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-mono font-extrabold text-base text-foreground">
                  ${currentSales.toFixed(2)}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  de ${salesTarget.toFixed(2)}
                </span>
              </div>
              <Progress value={salesPct} className="h-2" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <span>{daysLeft} días restantes</span>
              <span className="font-mono font-medium text-foreground">
                ${requiredDailyPace.toFixed(2)} / día
              </span>
            </div>
          </div>

          {/* Target 2: Fondo de Reserva para Proveedores */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Reserva Proveedores
              </span>
              <Badge
                variant={pendingBillsAmount <= reserveTarget ? 'outline' : 'destructive'}
                className="text-[10px] font-mono"
              >
                {pendingBillsAmount <= reserveTarget ? 'Cubierto' : 'Riesgo'}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-mono font-extrabold text-base text-foreground">
                  ${pendingBillsAmount.toFixed(2)}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  fondo: ${reserveTarget.toFixed(2)}
                </span>
              </div>
              <Progress
                value={reserveCoveragePct}
                className="h-2"
                indicatorClassName={pendingBillsAmount > reserveTarget ? 'bg-rose-500' : 'bg-emerald-500'}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <span>Capacidad de cobertura</span>
              <span className="font-mono font-bold text-foreground">
                {reserveCoveragePct}%
              </span>
            </div>
          </div>

          {/* Target 3: Meta de Eficiencia Food Cost */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <PieChart className="size-3.5 text-orange-500" /> Food Cost Objetivo
              </span>
              <Badge
                variant={currentFoodCostPct <= 32 ? 'outline' : 'destructive'}
                className="text-[10px] font-mono font-bold"
              >
                {currentFoodCostPct.toFixed(1)}% Real
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-mono font-extrabold text-base text-foreground">
                  {currentFoodCostPct.toFixed(1)}%
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Límite máx: 35.0%
                </span>
              </div>
              <Progress
                value={Math.min(100, (currentFoodCostPct / 35) * 100)}
                className="h-2"
                indicatorClassName={currentFoodCostPct > 35 ? 'bg-destructive' : 'bg-amber-500'}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <span>Margen bruto resultante</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {(100 - currentFoodCostPct).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
