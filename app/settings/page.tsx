import { AdminShell } from '@/components/layout/admin-shell'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Settings,
  Store,
  ChefHat,
  Volume2,
  Printer,
  ShieldCheck,
  Database,
  Sparkles,
  SlidersHorizontal,
  Bell,
  CheckCircle2
} from 'lucide-react'

export default function SettingsPage() {
  return (
    <AdminShell>
      <Navbar
        title="Configuración del Sistema"
        description="Parámetros operativos del restaurante, preferencias de KDS y punto de venta"
      />

      <main className="p-4 sm:p-6 space-y-6 max-w-5xl">
        {/* Identidad del Establecimiento */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Store className="size-4 text-primary" />
              <CardTitle className="text-sm font-bold">Perfil del Restaurante</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Datos comerciales para encabezados de comandas, reportes y punto de venta
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nombre Comercial</label>
                <Input defaultValue="Bites Gastro & Lounge" className="text-xs h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">RIF / Identificación Fiscal</label>
                <Input defaultValue="J-50123456-0" className="text-xs h-9 font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Dirección Principal</label>
                <Input defaultValue="Av. Principal Gastronómica, Local 4" className="text-xs h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Moneda Principal</label>
                <Input defaultValue="USD ($)" disabled className="text-xs h-9 font-mono bg-muted/50" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferencias del Monitor de Cocina (KDS) */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <ChefHat className="size-4 text-orange-500" />
              <CardTitle className="text-sm font-bold">Monitor de Cocina (KDS)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Tiempos de alerta, alertas sonoras y configuración visual para pantallas de cocina
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 space-y-1">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Tiempo Óptimo (Verde)</p>
                <p className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-200">&lt; 10 min</p>
                <p className="text-[10px] text-muted-foreground">Comandas a tiempo</p>
              </div>

              <div className="p-3 rounded-xl border bg-amber-500/5 border-amber-500/20 space-y-1">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Alerta Amarilla</p>
                <p className="text-xl font-bold font-mono text-amber-800 dark:text-amber-200">10 – 20 min</p>
                <p className="text-[10px] text-muted-foreground">Tiempo de atención</p>
              </div>

              <div className="p-3 rounded-xl border bg-rose-500/5 border-rose-500/20 space-y-1">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">Alerta Roja / Demora</p>
                <p className="text-xl font-bold font-mono text-rose-800 dark:text-rose-200">&gt; 20 min</p>
                <p className="text-[10px] text-muted-foreground">Prioridad urgente con pulso</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t">
              <div className="flex items-center gap-2.5">
                <Volume2 className="size-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Alerta Sonora por Comanda Nueva</p>
                  <p className="text-[11px] text-muted-foreground">Reproduce un timbre sintetizado web audio al recibir órdenes</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                Activada por Defecto
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Base de Datos y Estado Cloud */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Database className="size-4 text-blue-500" />
              <CardTitle className="text-sm font-bold">Estado del Servidor & Base de Datos</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Conexión en tiempo real con Supabase PostgreSQL
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border text-xs">
              <div className="flex items-center gap-2.5">
                <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-foreground">Supabase Realtime Engine</span>
              </div>
              <Badge variant="outline" className="text-[11px] text-emerald-600 border-emerald-500/30 font-mono">
                Conectado &bull; 0ms latencia
              </Badge>
            </div>
          </CardContent>
        </Card>
      </main>
    </AdminShell>
  )
}
