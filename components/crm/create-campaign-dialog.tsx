'use client'

import { useState } from 'react'
import {
  Megaphone,
  Loader2,
  Send,
  MessageSquare,
  Smartphone,
  Gift,
  Flame,
  Crown,
  Sparkles,
  Users,
  CheckCheck,
  Calendar,
  Layers,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { createMarketingCampaignAction } from '@/app/crm/actions'

interface CustomerMetric {
  id: string
  birth_date: string | null
  total_spent: number | null
  total_orders_count: number | null
}

interface CreateCampaignDialogProps {
  customers: CustomerMetric[]
  triggerButton?: React.ReactElement
  onCampaignCreated?: () => void
}

const TEMPLATES = [
  {
    name: '🎂 Cumpleaños Feliz',
    segment: 'birthday',
    channel: 'whatsapp',
    title: 'Campaña Cumpleañeros del Mes',
    text: '¡Hola {nombre}! 🎉 En Bites Restaurant queremos celebrar tu cumpleaños contigo. Ven este mes con tu familia y llévate tu postre de autor o bebida favorita totalmente GRATIS 🍰🥂. ¡Te esperamos!',
  },
  {
    name: '🔥 Promo Fin de Semana',
    segment: 'all',
    channel: 'whatsapp',
    title: 'Promo 2x1 Hamburguesas Bites',
    text: '¡Hola {nombre}! 🔥 Este fin de semana tenemos 2x1 en nuestras mejores hamburguesas y combos especiales. Muestra este mensaje en caja y disfruta del mejor sabor de la ciudad 🍔🍟.',
  },
  {
    name: '👋 Te Extrañamos (20% OFF)',
    segment: 'inactive_30',
    channel: 'whatsapp',
    title: 'Reactivación de Clientes Inactivos',
    text: '¡Hola {nombre}! Hace días que no te vemos por Bites App y te extrañamos. Queremos invitarte con un 20% de DESCUENTO en tu próxima visita con el cupón: VUELVE20 🎟️. ¡Válido por 7 días!',
  },
  {
    name: '⭐ Beneficio Exclusivo VIP',
    segment: 'vip',
    channel: 'whatsapp',
    title: 'Noche de Degustación VIP',
    text: 'Estimado/a {nombre}, como uno de nuestros clientes más selectos en Bites, queremos invitarte a la degustación exclusiva de nuestra nueva carta con cóctel de bienvenida de cortesía 🥂🍽️. Reserva tu mesa hoy.',
  },
]

export function CreateCampaignDialog({
  customers,
  triggerButton,
  onCampaignCreated,
}: CreateCampaignDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('Promo Especial Fin de Semana')
  const [targetAudience, setTargetAudience] = useState<'all' | 'birthday' | 'inactive_30' | 'vip'>('all')
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp')
  const [message, setMessage] = useState(
    '¡Hola {nombre}! 🎉 En Bites Restaurant queremos consentirte con una promoción especial de 15% de descuento en todo el menú este fin de semana 🍔🍟. ¡Te esperamos!'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calcular número de destinatarios estimados en vivo
  const currentMonth = new Date().getMonth() + 1
  let estimatedRecipients = 0
  if (targetAudience === 'all') {
    estimatedRecipients = customers.length
  } else if (targetAudience === 'birthday') {
    estimatedRecipients = customers.filter((c) => {
      if (!c.birth_date) return false
      try {
        const d = new Date(c.birth_date)
        return d.getMonth() + 1 === currentMonth
      } catch {
        return false
      }
    }).length
  } else if (targetAudience === 'vip') {
    estimatedRecipients = customers.filter(
      (c) => (c.total_spent || 0) >= 100 || (c.total_orders_count || 0) >= 5
    ).length
  } else if (targetAudience === 'inactive_30') {
    estimatedRecipients = customers.filter(
      (c) => (c.total_orders_count || 0) === 0 || (c.total_spent || 0) === 0
    ).length
  }

  // Previsualización dinámica con reemplazo de variable de muestra
  const previewMessage = message
    .replace(/{nombre}/g, 'Carlos Mendoza')
    .replace(/{negocio}/g, 'Bites App')
    .replace(/{descuento}/g, '20% OFF')

  function handleSelectTemplate(tmpl: (typeof TEMPLATES)[number]) {
    setName(tmpl.title)
    setTargetAudience(tmpl.segment as 'all' | 'birthday' | 'inactive_30' | 'vip')
    setChannel(tmpl.channel as 'whatsapp' | 'sms' | 'email')
    setMessage(tmpl.text)
  }

  function handleInsertVariable(variable: string) {
    setMessage((prev) => `${prev} ${variable}`)
  }

  async function handleSave(sendNow: boolean) {
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('type', channel)
    formData.append('target_audience', targetAudience)
    formData.append('message', message)
    formData.append('send_now', sendNow ? 'true' : 'false')

    try {
      await createMarketingCampaignAction(formData)
      setOpen(false)
      if (onCampaignCreated) onCampaignCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la campaña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          (triggerButton ? (
            triggerButton
          ) : (
            <Button size="sm" className="gap-1.5 shadow-xs font-semibold bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700 text-white">
              <Megaphone className="size-4" />
              <span>Crear Campaña</span>
            </Button>
          )) as React.ReactElement
        }
      />
      <DialogContent className="sm:max-w-[840px] max-h-[92vh] overflow-y-auto">
        <div>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-orange-500" />
              <span>Generador de Campañas de Marketing & Fidelización</span>
            </DialogTitle>
            <DialogDescription>
              Crea mensajes masivos y segmentados por WhatsApp o SMS para atraer más visitas y fidelizar a tus clientes.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs my-3 border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          {/* Selector de Plantillas Rápidas */}
          <div className="my-3 p-3 bg-muted/40 rounded-xl border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                Plantillas Pre-diseñadas:
              </span>
              <span className="text-[11px] text-muted-foreground">Haz clic para cargar plantilla</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl)}
                  className="p-2 text-left rounded-lg border bg-card hover:bg-muted/80 transition-all text-xs space-y-1 hover:border-primary/50 shadow-xs cursor-pointer"
                >
                  <p className="font-semibold text-foreground line-clamp-1">{tmpl.name}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{tmpl.title}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 py-2">
            {/* Form Column */}
            <div className="lg:col-span-7 space-y-4 text-xs">
              {/* Campaign Name */}
              <div className="space-y-1.5">
                <Label htmlFor="camp_name">Nombre de la Campaña *</Label>
                <Input
                  id="camp_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Promo San Valentín 2026"
                  className="text-xs h-9"
                  required
                />
              </div>

              {/* Segment & Channel */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="target_audience">Segmento de Clientes *</Label>
                  <select
                    id="target_audience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="all" className="bg-popover text-popover-foreground">
                      👥 Todos los Clientes ({customers.length})
                    </option>
                    <option value="birthday" className="bg-popover text-popover-foreground">
                      🎂 Cumpleañeros del Mes
                    </option>
                    <option value="vip" className="bg-popover text-popover-foreground">
                      ⭐ Clientes VIP (+100$ o +5 visitas)
                    </option>
                    <option value="inactive_30" className="bg-popover text-popover-foreground">
                      👋 Clientes Inactivos (+30 días)
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="channel">Canal de Envío *</Label>
                  <select
                    id="channel"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="whatsapp" className="bg-popover text-popover-foreground">
                      📱 WhatsApp Mensaje
                    </option>
                    <option value="sms" className="bg-popover text-popover-foreground">
                      💬 SMS Notificación
                    </option>
                    <option value="email" className="bg-popover text-popover-foreground">
                      ✉️ Correo Electrónico
                    </option>
                  </select>
                </div>
              </div>

              {/* Target audience estimate card */}
              <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  <span className="text-muted-foreground">Destinatarios estimados en este segmento:</span>
                </div>
                <Badge variant="default" className="font-bold">
                  {estimatedRecipients} clientes
                </Badge>
              </div>

              {/* Message Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="message">Mensaje de la Campaña *</Label>
                  <span className="text-[11px] text-muted-foreground">{message.length} caracteres</span>
                </div>
                <Textarea
                  id="message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Redacta el mensaje promocional aquí..."
                  className="text-xs resize-none"
                  required
                />
              </div>

              {/* Variable Pills */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-muted-foreground font-medium">Insertar variable dinámica:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleInsertVariable('{nombre}')}
                    className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-[11px] font-mono border text-foreground transition-colors cursor-pointer"
                  >
                    +{'{nombre}'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertVariable('{negocio}')}
                    className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-[11px] font-mono border text-foreground transition-colors cursor-pointer"
                  >
                    +{'{negocio}'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertVariable('{descuento}')}
                    className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-[11px] font-mono border text-foreground transition-colors cursor-pointer"
                  >
                    +{'{descuento}'}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Phone Simulator Preview */}
            <div className="lg:col-span-5 flex flex-col items-center justify-start">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Smartphone className="size-3.5" /> Vista Previa Móvil ({channel.toUpperCase()})
              </span>

              {/* Mockup Frame */}
              <div className="w-full max-w-[280px] bg-card border-4 border-muted-foreground/30 rounded-3xl p-3 shadow-lg space-y-3 flex flex-col justify-between min-h-[340px]">
                {/* Header of simulated chat */}
                <div className="flex items-center gap-2 border-b pb-2">
                  <div className="size-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                    B
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground leading-tight truncate">Bites Restaurant</p>
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-400 leading-tight">En línea</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">
                    {channel}
                  </Badge>
                </div>

                {/* Chat area */}
                <div className="flex-1 py-2 flex flex-col justify-end space-y-2">
                  <div className="self-center bg-muted/60 text-muted-foreground text-[9px] px-2 py-0.5 rounded-full">
                    Hoy
                  </div>
                  <div className="bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 p-2.5 rounded-2xl rounded-tr-xs text-[11px] text-foreground leading-relaxed shadow-xs space-y-1">
                    <p className="whitespace-pre-wrap">{previewMessage}</p>
                    <div className="flex items-center justify-end gap-1 text-[9px] text-muted-foreground pt-0.5">
                      <span>12:00 PM</span>
                      <CheckCheck className="size-3 text-emerald-500" />
                    </div>
                  </div>
                </div>

                {/* Simulated Input Bar */}
                <div className="pt-2 border-t flex items-center gap-1.5 text-muted-foreground text-[10px]">
                  <div className="h-6 flex-1 bg-muted/50 rounded-full px-2 flex items-center text-[10px]">
                    Escribe un mensaje...
                  </div>
                  <div className="size-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Send className="size-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSave(false)}
              disabled={loading}
              className="text-xs"
            >
              Guardar Borrador
            </Button>
            <Button
              type="button"
              onClick={() => handleSave(true)}
              disabled={loading || estimatedRecipients === 0}
              className="gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Enviando Campaña...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span>Lanzar Campaña ({estimatedRecipients})</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
