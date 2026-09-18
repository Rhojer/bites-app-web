'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  UtensilsCrossed,
  Check,
  X,
  AlertCircle,
  SlidersHorizontal,
  Flame,
  ChefHat,
  Sparkles
} from 'lucide-react'
import { formatCulinaryExclusions } from '@/lib/domain/pos'

export interface CustomizeItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: {
    id: string
    recipe_id: string
    name: string
    quantity: number
    notes?: string
  } | null
  ingredients?: string[]
  onSaveCustomization: (itemId: string, notes: string, applyMode: 'single' | 'all') => void
}

const DEFAULT_INGREDIENTS = [
  'Cebolla',
  'Tomate',
  'Lechuga',
  'Pepinillos',
  'Queso',
  'Salsa de la casa',
  'Mayonesa',
  'Mostaza',
  'Sal'
]

const QUICK_CULINARY_NOTES = [
  'Término medio',
  'Bien cocido',
  'Salsa aparte',
  'Extra queso',
  'Poco picante',
  'Para llevar'
]

export function CustomizeItemDialog({
  open,
  onOpenChange,
  item,
  ingredients = [],
  onSaveCustomization,
}: CustomizeItemDialogProps) {
  const [applyMode, setApplyMode] = useState<'single' | 'all'>('single')
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([])
  const [extraNotes, setExtraNotes] = useState('')

  // Lista efectiva de ingredientes a mostrar
  const effectiveIngredients = ingredients.length > 0 ? ingredients : DEFAULT_INGREDIENTS

  // Sincronizar estado cuando se abre el diálogo para un ítem
  useEffect(() => {
    if (item && open) {
      // Si el ítem tiene quantity > 1, sugerir por defecto 'single' para no alterar todas
      setApplyMode(item.quantity > 1 ? 'single' : 'all')

      // Detectar notas previas del ítem para inicializar exclusiones
      const currentNotes = item.notes || ''
      const detectedExclusions: string[] = []
      const remainingNotesParts: string[] = []

      currentNotes.split(',').map((p) => p.trim()).filter(Boolean).forEach((part) => {
        const lower = part.toLowerCase()
        const matchedIng = effectiveIngredients.find(
          (ing) => lower === `sin ${ing.toLowerCase()}` || lower === ing.toLowerCase()
        )
        if (matchedIng) {
          detectedExclusions.push(matchedIng)
        } else {
          remainingNotesParts.push(part)
        }
      })

      setExcludedIngredients(detectedExclusions)
      setExtraNotes(remainingNotesParts.join(', '))
    }
  }, [item, open])

  if (!item) return null

  const isMultiple = item.quantity > 1

  function toggleExcludeIngredient(ing: string) {
    setExcludedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    )
  }

  function appendQuickNote(note: string) {
    setExtraNotes((prev) => {
      const parts = prev.split(',').map((p) => p.trim()).filter(Boolean)
      if (parts.includes(note)) {
        return parts.filter((p) => p !== note).join(', ')
      }
      return parts.length > 0 ? `${prev}, ${note}` : note
    })
  }

  const generatedNote = formatCulinaryExclusions(excludedIngredients, extraNotes)

  function handleSave() {
    if (!item) return
    onSaveCustomization(item.id, generatedNote, isMultiple ? applyMode : 'all')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-5 rounded-2xl">
        <DialogHeader className="pb-3 border-b shrink-0">
          <div className="flex items-center gap-2 text-primary">
            <SlidersHorizontal className="size-4" />
            <DialogTitle className="text-base font-extrabold text-foreground">
              Personalizar / Quitar Ingredientes
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Plato: <strong className="text-foreground">{item.name}</strong> ({item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'} en comanda)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          
          {/* Selector de Alcance si hay más de 1 unidad */}
          {isMultiple && (
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>¿A cuántas hamburguesas aplica este cambio?</span>
                </span>
                <Badge variant="outline" className="bg-background text-primary font-mono text-[11px] font-bold">
                  {item.quantity} unidades
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setApplyMode('single')}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                    applyMode === 'single'
                      ? 'border-primary bg-background shadow-xs ring-1 ring-primary'
                      : 'border-border/60 bg-background/50 hover:bg-background text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-foreground">🎯 Solo a 1 unidad</span>
                    {applyMode === 'single' && <Check className="size-3.5 text-primary" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Separa 1 plato con esta receta; los otros {item.quantity - 1} seguirán normales.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setApplyMode('all')}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                    applyMode === 'all'
                      ? 'border-primary bg-background shadow-xs ring-1 ring-primary'
                      : 'border-border/60 bg-background/50 hover:bg-background text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-foreground">👥 A todas ({item.quantity})</span>
                    {applyMode === 'all' && <Check className="size-3.5 text-primary" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Modifica el grupo completo de {item.quantity} platos.
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Selector de Ingredientes a Quitar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ChefHat className="size-3.5 text-primary" />
                <span>Ingredientes de la Receta (Toca para quitar):</span>
              </label>
              {excludedIngredients.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExcludedIngredients([])}
                  className="text-[11px] text-muted-foreground hover:text-primary"
                >
                  Restablecer todos
                </button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Los ingredientes marcados en rojo no serán agregados por cocina.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {effectiveIngredients.map((ing) => {
                const isExcluded = excludedIngredients.includes(ing)
                return (
                  <button
                    key={ing}
                    type="button"
                    onClick={() => toggleExcludeIngredient(ing)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all active:scale-95 border flex items-center gap-1.5 ${
                      isExcluded
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 line-through font-semibold shadow-2xs'
                        : 'bg-muted/50 hover:bg-muted text-foreground border-border hover:border-primary/40'
                    }`}
                  >
                    {isExcluded ? (
                      <X className="size-3 text-rose-600 dark:text-rose-400 shrink-0" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                    <span>{isExcluded ? `Sin ${ing}` : ing}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Opciones culinarias rápidas */}
          <div className="space-y-2 pt-1 border-t">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Opciones adicionales de cocina:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_CULINARY_NOTES.map((q) => {
                const isSelected = extraNotes.includes(q)
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => appendQuickNote(q)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary font-bold shadow-2xs'
                        : 'bg-card text-muted-foreground hover:text-foreground border-input hover:border-primary/30'
                    }`}
                  >
                    + {q}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Campo de texto libre para notas específicas */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-semibold text-muted-foreground">
              Otra nota o instrucción especial:
            </label>
            <Input
              placeholder="Ej. Poco tostado, alérgico a la mostaza, salsa aparte..."
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              className="h-8 text-xs bg-muted/20"
            />
          </div>

          {/* Vista Previa de la Comanda para Cocina */}
          <div className="p-3 rounded-xl bg-muted/40 border space-y-1">
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
              Vista previa en comanda de cocina:
            </span>
            {generatedNote ? (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <span>⚠️ {generatedNote}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Preparación estándar (todos los ingredientes incluidos)
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="pt-3 border-t shrink-0 flex items-center justify-between sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            className="text-xs font-bold gap-1.5 shadow-xs bg-primary text-primary-foreground"
          >
            <Check className="size-4" />
            <span>
              {isMultiple && applyMode === 'single'
                ? 'Aplicar a Solo 1 Hamburguesa'
                : 'Guardar Personalización'}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
