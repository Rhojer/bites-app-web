'use client'

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Percent,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Building2,
  Zap,
  ArrowRight,
  ShieldCheck,
  Flame,
  ReceiptText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface PLData {
  totalRevenue: number
  foodCost: number
  wasteCost: number
  totalFoodCost: number
  grossProfit: number
  grossMarginPct: number
  fixedExpenses: number
  variableExpenses: number
  totalExpenses: number
  bankCommissions: number
  netProfit: number
  netMarginPct: number
  ordersCount: number
}

interface PLStatementProps {
  data: PLData
}

export function PLStatement({ data }: PLStatementProps) {
  const {
    totalRevenue,
    foodCost,
    wasteCost,
    totalFoodCost,
    grossProfit,
    grossMarginPct,
    fixedExpenses,
    variableExpenses,
    totalExpenses,
    bankCommissions,
    netProfit,
    netMarginPct,
    ordersCount,
  } = data

  const foodCostRatio = totalRevenue > 0 ? (totalFoodCost / totalRevenue) * 100 : 0
  const opexRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0
  const isProfitable = netProfit >= 0

  // Diagnósticos automáticos basados en KPIs gastronómicos estándar
  function getFoodCostHealth(pct: number) {
    if (pct <= 32) {
      return {
        status: 'Óptimo',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        note: 'Costo de insumos dentro del rango estándar óptimo (28% - 32%).',
      }
    }
    if (pct <= 38) {
      return {
        status: 'Moderado',
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        note: 'Monitorear mermas y porcionamiento para evitar sobrecostos.',
      }
    }
    return {
      status: 'Crítico',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      note: 'Food cost elevado (>38%). Se recomienda revisar escandallos o renegociar precios con proveedores.',
    }
  }

  function getNetMarginHealth(pct: number) {
    if (pct >= 15) {
      return {
        status: 'Excelente Rentabilidad',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        note: 'Margen neto saludable superior al 15% del total de ventas.',
      }
    }
    if (pct > 0) {
      return {
        status: 'Aceptable',
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        note: 'Negocio con utilidad positiva pero margen ajustado (<15%).',
      }
    }
    return {
      status: 'Pérdida Operativa',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      note: 'Los costos y gastos superan los ingresos generados en este período.',
    }
  }

  const foodCostHealth = getFoodCostHealth(foodCostRatio)
  const netMarginHealth = getNetMarginHealth(netMarginPct)

  return (
    <div className="space-y-6">
      {/* 5 KPIs Clave en Cascada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Ingresos */}
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">1. Ingresos Totales</span>
              <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-foreground">
                ${totalRevenue.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">{ordersCount} órdenes registradas</p>
            </div>
            <div className="pt-1.5 border-t text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              100% Base de facturación
            </div>
          </CardContent>
        </Card>

        {/* 2. Food Cost */}
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">2. Costo Insumos</span>
              <div className="size-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Flame className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                -${totalFoodCost.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Recetas: ${foodCost.toFixed(2)} | Mermas: ${wasteCost.toFixed(2)}
              </p>
            </div>
            <div className="pt-1.5 border-t text-[10px] font-mono text-muted-foreground">
              Food Cost: <span className="font-bold text-foreground">{foodCostRatio.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Utilidad Bruta */}
        <Card className="border shadow-xs bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                3. Utilidad Bruta
              </span>
              <div className="size-7 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                ${grossProfit.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">Ventas menos Food Cost</p>
            </div>
            <div className="pt-1.5 border-t text-[10px] font-mono text-blue-700 dark:text-blue-300 font-semibold">
              Margen Bruto: {grossMarginPct.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        {/* 4. Gastos Operativos (Opex) */}
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">4. Gastos Operativos</span>
              <div className="size-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <TrendingDown className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                -${(totalExpenses + bankCommissions).toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Fijos: ${fixedExpenses.toFixed(2)} | Var: ${variableExpenses.toFixed(2)}
              </p>
            </div>
            <div className="pt-1.5 border-t text-[10px] font-mono text-muted-foreground">
              Comisiones: ${bankCommissions.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* 5. Utilidad Neta Real */}
        <Card
          className={`border shadow-xs ${
            isProfitable
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-rose-500/10 border-rose-500/30'
          }`}
        >
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold ${
                  isProfitable ? 'text-emerald-900 dark:text-emerald-200' : 'text-rose-900 dark:text-rose-200'
                }`}
              >
                5. Utilidad Neta Real
              </span>
              <div
                className={`size-7 rounded-lg text-white flex items-center justify-center ${
                  isProfitable ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {isProfitable ? <ShieldCheck className="size-4" /> : <AlertTriangle className="size-4" />}
              </div>
            </div>
            <div>
              <p
                className={`text-xl font-bold tracking-tight font-mono ${
                  isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isProfitable ? `+$${netProfit.toFixed(2)}` : `-$${Math.abs(netProfit).toFixed(2)}`}
              </p>
              <p className="text-[11px] text-muted-foreground">Resultado neto del período</p>
            </div>
            <div
              className={`pt-1.5 border-t text-[10px] font-mono font-bold ${
                isProfitable ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              Margen Neto: {netMarginPct.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Desglosada del Estado de Resultados (P&L Cascada) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReceiptText className="size-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Estado de Pérdidas y Ganancias (P&L Detallado)
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                USD
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Estructura contable estándar con desglose de márgenes brutos y operativos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-medium border-b border-t">
                  <tr>
                    <th className="py-2.5 px-4">Concepto Financiero</th>
                    <th className="py-2.5 px-4 text-center">Tipo</th>
                    <th className="py-2.5 px-4 text-right">% s/ Ventas</th>
                    <th className="py-2.5 px-4 text-right">Importe ($ USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {/* INGRESOS */}
                  <tr className="bg-emerald-500/5 font-semibold">
                    <td className="py-3 px-4 text-foreground flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      (+) Ingresos por Ventas (Total POS & Salón)
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        Ingreso
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">100.0%</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      ${totalRevenue.toFixed(2)}
                    </td>
                  </tr>

                  {/* FOOD COST */}
                  <tr className="text-muted-foreground hover:bg-muted/20">
                    <td className="py-2.5 px-4 pl-8">
                      (-) Costo de Insumos / Recetas Vendidas
                    </td>
                    <td className="py-2.5 px-4 text-center text-[11px]">COGS</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {totalRevenue > 0 ? ((foodCost / totalRevenue) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-500">
                      -${foodCost.toFixed(2)}
                    </td>
                  </tr>

                  <tr className="text-muted-foreground hover:bg-muted/20">
                    <td className="py-2.5 px-4 pl-8">
                      (-) Mermas y Desperdicios de Cocina
                    </td>
                    <td className="py-2.5 px-4 text-center text-[11px]">Merma</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {totalRevenue > 0 ? ((wasteCost / totalRevenue) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-500">
                      -${wasteCost.toFixed(2)}
                    </td>
                  </tr>

                  {/* UTILIDAD BRUTA */}
                  <tr className="bg-blue-500/5 font-semibold border-t-2 border-b-2">
                    <td className="py-3 px-4 text-blue-900 dark:text-blue-200 flex items-center gap-2">
                      <span className="size-2 rounded-full bg-blue-500" />
                      (=) UTILIDAD BRUTA (Margen de Contribución)
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                        Subtotal
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {grossMarginPct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      ${grossProfit.toFixed(2)}
                    </td>
                  </tr>

                  {/* GASTOS FIJOS */}
                  <tr className="text-muted-foreground hover:bg-muted/20">
                    <td className="py-2.5 px-4 pl-8 flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-muted-foreground" />
                      (-) Gastos Fijos (Alquiler, Nómina, Servicios)
                    </td>
                    <td className="py-2.5 px-4 text-center text-[11px]">Fijo</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {totalRevenue > 0 ? ((fixedExpenses / totalRevenue) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-500">
                      -${fixedExpenses.toFixed(2)}
                    </td>
                  </tr>

                  {/* GASTOS VARIABLES */}
                  <tr className="text-muted-foreground hover:bg-muted/20">
                    <td className="py-2.5 px-4 pl-8 flex items-center gap-1.5">
                      <Zap className="size-3.5 text-muted-foreground" />
                      (-) Gastos Variables (Mantenimiento, Marketing, Egresos)
                    </td>
                    <td className="py-2.5 px-4 text-center text-[11px]">Variable</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {totalRevenue > 0 ? ((variableExpenses / totalRevenue) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-500">
                      -${variableExpenses.toFixed(2)}
                    </td>
                  </tr>

                  {/* COMISIONES BANCARIAS */}
                  <tr className="text-muted-foreground hover:bg-muted/20">
                    <td className="py-2.5 px-4 pl-8">
                      (-) Comisiones Bancarias & Pasarelas POS
                    </td>
                    <td className="py-2.5 px-4 text-center text-[11px]">Financiero</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {totalRevenue > 0 ? ((bankCommissions / totalRevenue) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-500">
                      -${bankCommissions.toFixed(2)}
                    </td>
                  </tr>

                  {/* UTILIDAD NETA */}
                  <tr
                    className={`font-bold border-t-2 text-sm ${
                      isProfitable
                        ? 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-100'
                        : 'bg-rose-500/10 text-rose-900 dark:text-rose-100'
                    }`}
                  >
                    <td className="py-3.5 px-4 flex items-center gap-2">
                      <span
                        className={`size-2.5 rounded-full ${
                          isProfitable ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      (=) UTILIDAD NETA REAL
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          isProfitable
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        Resultado Neto
                      </Badge>
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-mono ${
                        isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {netMarginPct.toFixed(1)}%
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-mono text-base ${
                        isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isProfitable ? `+$${netProfit.toFixed(2)}` : `-$${Math.abs(netProfit).toFixed(2)}`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Diagnóstico y Ratios de Salud Financiera Gastronómica */}
        <div className="space-y-4">
          <Card className="border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PieChart className="size-4 text-primary" />
                Ratios de Eficiencia & Rentabilidad
              </CardTitle>
              <CardDescription className="text-xs">
                Métricas estándar de la industria gastronómica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Food Cost Ratio */}
              <div className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Food Cost Ratio:</span>
                  <Badge variant="outline" className={`text-[10px] font-bold ${foodCostHealth.badgeColor}`}>
                    {foodCostRatio.toFixed(1)}% — {foodCostHealth.status}
                  </Badge>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      foodCostRatio <= 32
                        ? 'bg-emerald-500'
                        : foodCostRatio <= 38
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, foodCostRatio)}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{foodCostHealth.note}</p>
              </div>

              {/* Margen Bruto */}
              <div className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Margen de Contribución:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {grossMarginPct.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${Math.min(100, Math.max(0, grossMarginPct))}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Porcentaje restante para cubrir gastos fijos y generar beneficio neto.
                </p>
              </div>

              {/* Utilidad Neta Ratio */}
              <div className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Margen Neto Real:</span>
                  <Badge variant="outline" className={`text-[10px] font-bold ${netMarginHealth.badgeColor}`}>
                    {netMarginPct.toFixed(1)}% — {netMarginHealth.status}
                  </Badge>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      isProfitable ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, netMarginPct))}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{netMarginHealth.note}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
