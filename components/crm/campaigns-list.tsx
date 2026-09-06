'use client'

import { useState } from 'react'
import {
  Megaphone,
  MessageSquare,
  Smartphone,
  Mail,
  Send,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Copy,
  Check,
  Share2,
  Filter
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreateCampaignDialog } from './create-campaign-dialog'
import { CustomerProfile } from './customer-detail-sheet'

export interface CampaignRecord {
  id: string
  created_at: string
  name: string
  type: string | null
  message: string
  target_audience: string | null
  status: string | null
  sent_at: string | null
  recipients_count: number | null
}

interface CampaignsListProps {
  campaigns: CampaignRecord[]
  customers: CustomerProfile[]
}

export function CampaignsList({ campaigns, customers }: CampaignsListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filterChannel, setFilterChannel] = useState<string>('ALL')

  const totalCampaigns = campaigns.length
  const totalRecipientsReached = campaigns
    .filter((c) => c.status === 'sent')
    .reduce((acc, c) => acc + (c.recipients_count || 0), 0)
  const sentCampaignsCount = campaigns.filter((c) => c.status === 'sent').length

  const filteredCampaigns = campaigns.filter((c) => {
    if (filterChannel === 'ALL') return true
    return c.type === filterChannel
  })

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const audienceLabels: Record<string, { label: string; color: string }> = {
    all: { label: 'Todos los Clientes', color: 'bg-primary/10 text-primary border-primary/20' },
    birthday: { label: '🎂 Cumpleañeros', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
    vip: { label: '⭐ Clientes VIP', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    inactive_30: { label: '👋 Inactivos +30d', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with creator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-foreground">Campañas de Comunicación & Marketing</h2>
          <p className="text-xs text-muted-foreground">
            Lanza promociones segmentadas por WhatsApp, SMS y Email para fidelizar y aumentar la frecuencia de consumo.
          </p>
        </div>
        <CreateCampaignDialog
          customers={customers}
          triggerButton={
            <Button size="sm" className="gap-1.5 font-semibold bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700 text-white shadow-xs">
              <Megaphone className="size-4" />
              <span>Nueva Campaña</span>
            </Button>
          }
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Campañas Creadas</p>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">{totalCampaigns}</p>
              <p className="text-[11px] text-muted-foreground">{sentCampaignsCount} lanzadas exitosamente</p>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Megaphone className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Impacto / Destinatarios</p>
              <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                {totalRecipientsReached}
              </p>
              <p className="text-[11px] text-muted-foreground">Clientes alcanzados en total</p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Canales Habilitados</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">WhatsApp & SMS</p>
              <p className="text-[11px] text-muted-foreground">Con variables de personalización</p>
            </div>
            <div className="size-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Sparkles className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Button
          size="xs"
          variant={filterChannel === 'ALL' ? 'default' : 'outline'}
          onClick={() => setFilterChannel('ALL')}
          className="text-xs h-7"
        >
          Todas ({campaigns.length})
        </Button>
        <Button
          size="xs"
          variant={filterChannel === 'whatsapp' ? 'default' : 'outline'}
          onClick={() => setFilterChannel('whatsapp')}
          className="text-xs h-7 gap-1"
        >
          <Smartphone className="size-3 text-emerald-600" />
          <span>WhatsApp ({campaigns.filter((c) => c.type === 'whatsapp').length})</span>
        </Button>
        <Button
          size="xs"
          variant={filterChannel === 'sms' ? 'default' : 'outline'}
          onClick={() => setFilterChannel('sms')}
          className="text-xs h-7 gap-1"
        >
          <MessageSquare className="size-3 text-blue-600" />
          <span>SMS ({campaigns.filter((c) => c.type === 'sms').length})</span>
        </Button>
        <Button
          size="xs"
          variant={filterChannel === 'email' ? 'default' : 'outline'}
          onClick={() => setFilterChannel('email')}
          className="text-xs h-7 gap-1"
        >
          <Mail className="size-3 text-purple-600" />
          <span>Email ({campaigns.filter((c) => c.type === 'email').length})</span>
        </Button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCampaigns.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-card rounded-xl border border-dashed text-muted-foreground">
            <Megaphone className="size-10 mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-sm text-foreground">No hay campañas en este canal</p>
            <p className="text-xs max-w-sm mx-auto mt-1">
              Crea tu primera campaña automatizada para felicitar a cumpleañeros o reactivar clientes inactivos.
            </p>
            <div className="mt-4">
              <CreateCampaignDialog
                customers={customers}
                triggerButton={
                  <Button size="sm" className="gap-1.5 text-xs font-semibold">
                    <Megaphone className="size-3.5" />
                    <span>Crear Primera Campaña</span>
                  </Button>
                }
              />
            </div>
          </div>
        ) : (
          filteredCampaigns.map((camp) => {
            const isSent = camp.status === 'sent'
            const audInfo = audienceLabels[camp.target_audience || 'all'] || {
              label: 'General',
              color: 'bg-muted text-foreground',
            }

            return (
              <Card key={camp.id} className="border shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
                <CardContent className="p-4 space-y-3">
                  {/* Header: Title & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-foreground line-clamp-1">{camp.name}</h3>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${audInfo.color}`}>
                          {audInfo.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase">
                          {camp.type || 'WhatsApp'}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      {isSent ? (
                        <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                          <CheckCircle2 className="size-3" /> Enviada
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] gap-1 text-muted-foreground">
                          <Clock className="size-3" /> Borrador
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Message Bubble Box */}
                  <div className="p-3 rounded-lg bg-muted/40 border text-xs text-foreground font-normal leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {camp.message}
                  </div>

                  {/* Metrics footer */}
                  <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="size-3 text-primary" />
                      <span>
                        <strong>{camp.recipients_count || 0}</strong> destinatarios
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <Calendar className="size-3" />
                      <span>
                        {new Date(camp.sent_at || camp.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>

                {/* Card Actions Footer */}
                <div className="px-4 py-2.5 bg-muted/20 border-t flex items-center justify-between">
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-[11px] h-7 gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopy(camp.id, camp.message)}
                  >
                    {copiedId === camp.id ? (
                      <>
                        <Check className="size-3 text-emerald-600" />
                        <span className="text-emerald-600">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>Copiar Mensaje</span>
                      </>
                    )}
                  </Button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(camp.message.replace(/{nombre}/g, 'Cliente').replace(/{negocio}/g, 'Bites App'))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"
                  >
                    <Share2 className="size-3" /> Difundir
                  </a>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
