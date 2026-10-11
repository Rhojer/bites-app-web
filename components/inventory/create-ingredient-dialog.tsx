'use client'

import { useState } from 'react'
import { PlusCircle, Loader2 } from 'lucide-react'
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
import { createIngredientAction } from '@/app/inventory/actions'
import { CreateSupplierDialog } from '@/components/finances/create-supplier-dialog'

const CATEGORIES = [
  'Carnes & Aves',
  'Lácteos & Quesos',
  'Verduras & Frutas',
  'Panadería & Masas',
  'Salsas & Condimentos',
  'Abarrotes & Especias',
  'Bebidas & Licores',
  'Empaques & Desechables',
  'Limpieza & Otros',
]

const UNITS = [
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'gr', label: 'Gramos (gr)' },
  { value: 'mg', label: 'Miligramos (mg)' },
  { value: 'lt', label: 'Litros (lt)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'und', label: 'Unidades (und)' },
  { value: 'porcion', label: 'Porciones (porción)' },
]

export interface SupplierOption {
  id: string
  name: string
  tax_id?: string | null
  credit_days?: number | null
}

interface CreateIngredientDialogProps {
  suppliers?: SupplierOption[]
}

export function CreateIngredientDialog({ suppliers: initialSuppliers = [] }: CreateIngredientDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [suppliers, setSuppliers] = useState<SupplierOption[]>(initialSuppliers)
  const [isCredit, setIsCredit] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [creditDueDate, setCreditDueDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )

  const [unit, setUnit] = useState('kg')
  const [stock, setStock] = useState('0')
  const [unitCost, setUnitCost] = useState('')
  const [totalCost, setTotalCost] = useState('')
  const [lastEdited, setLastEdited] = useState<'unit' | 'total'>('unit')

  function handleSupplierChange(supId: string) {
    setSelectedSupplierId(supId)
    const sup = suppliers.find((s) => s.id === supId)
    if (sup && sup.credit_days) {
      const newDue = new Date(Date.now() + sup.credit_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      setCreditDueDate(newDue)
    }
  }

  function handleSupplierCreated(newSup: SupplierOption) {
    setSuppliers((prev) => [...prev, newSup])
    setSelectedSupplierId(newSup.id)
    if (newSup.credit_days) {
      const newDue = new Date(Date.now() + newSup.credit_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      setCreditDueDate(newDue)
    }
  }

  function handleStockChange(val: string) {
    setStock(val)
    const stockNum = parseFloat(val)
    if (isNaN(stockNum) || stockNum <= 0) return

    if (lastEdited === 'total' && totalCost !== '') {
      const totNum = parseFloat(totalCost)
      if (!isNaN(totNum)) {
        setUnitCost((totNum / stockNum).toFixed(4).replace(/\.?0+$/, ''))
      }
    } else if (lastEdited === 'unit' && unitCost !== '') {
      const uNum = parseFloat(unitCost)
      if (!isNaN(uNum)) {
        setTotalCost((stockNum * uNum).toFixed(2))
      }
    }
  }

  function handleUnitCostChange(val: string) {
    setLastEdited('unit')
    setUnitCost(val)
    const uNum = parseFloat(val)
    const stockNum = parseFloat(stock)
    if (!isNaN(uNum) && !isNaN(stockNum) && stockNum > 0) {
      setTotalCost((stockNum * uNum).toFixed(2))
    } else if (val === '') {
      setTotalCost('')
    }
  }

  function handleTotalCostChange(val: string) {
    setLastEdited('total')
    setTotalCost(val)
    const totNum = parseFloat(val)
    const stockNum = parseFloat(stock)
    if (!isNaN(totNum) && !isNaN(stockNum) && stockNum > 0) {
      setUnitCost((totNum / stockNum).toFixed(4).replace(/\.?0+$/, ''))
    } else if (val === '') {
      setUnitCost('')
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    try {
      await createIngredientAction(formData)
      setOpen(false)
      setStock('0')
      setUnitCost('')
      setTotalCost('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el insumo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5 shadow-xs">
            <PlusCircle className="size-4" />
            <span>Nuevo Insumo</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[540px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Insumo</DialogTitle>
            <DialogDescription>
              Añade un ingrediente o material al inventario para usarlo en escandallos y recetas.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs my-3">
              {error}
            </div>
          )}

          <div className="grid gap-4 py-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre del Insumo *</Label>
                <Input id="name" name="name" placeholder="Ej: Pechuga de Pollo" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code">Código / SKU</Label>
                <Input id="code" name="code" placeholder="Ej: POL-001" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category">Categoría</Label>
                <select
                  id="category"
                  name="category"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-popover text-popover-foreground">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unit">Unidad de Medida *</Label>
                <select
                  id="unit"
                  name="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value} className="bg-popover text-popover-foreground">
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="current_stock">Stock Inicial / Actual</Label>
                <Input
                  id="current_stock"
                  name="current_stock"
                  type="number"
                  step="0.001"
                  value={stock}
                  onChange={(e) => handleStockChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="min_stock">Stock Mínimo (Alerta)</Label>
                <Input
                  id="min_stock"
                  name="min_stock"
                  type="number"
                  step="0.001"
                  defaultValue="5"
                  required
                />
              </div>
            </div>

            {/* Costos Unitario y Total Sincronizados */}
            <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cost_per_unit" className="font-semibold text-foreground">
                      Costo Unitario ($ / {unit}) *
                    </Label>
                    {lastEdited === 'total' && totalCost && (
                      <span className="text-[10px] text-primary font-medium">Auto</span>
                    )}
                  </div>
                  <Input
                    id="cost_per_unit"
                    name="cost_per_unit"
                    type="number"
                    step="0.0001"
                    placeholder="0.00"
                    value={unitCost}
                    onChange={(e) => handleUnitCostChange(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="total_cost" className="font-semibold text-foreground">
                      Costo Total ($)
                    </Label>
                    {lastEdited === 'unit' && unitCost && (
                      <span className="text-[10px] text-primary font-medium">Auto</span>
                    )}
                  </div>
                  <Input
                    id="total_cost"
                    name="total_cost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={totalCost}
                    onChange={(e) => handleTotalCostChange(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Puedes ingresar el costo unitario o el costo total pagado; el otro se calculará automáticamente en base al stock.
              </p>
            </div>

            {/* Pregunta de Crédito con Proveedor */}
            <div className="p-3 rounded-lg border bg-muted/10 space-y-3">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="is_credit_create"
                  name="is_credit"
                  value="true"
                  checked={isCredit}
                  onChange={(e) => setIsCredit(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-input text-primary focus:ring-primary accent-primary"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="is_credit_create" className="font-semibold text-foreground cursor-pointer text-xs">
                    ¿Esta carga inicial proviene de un crédito con algún proveedor?
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Generará automáticamente una cuenta por pagar en Finanzas con la fecha de vencimiento y el monto de esta carga.
                  </p>
                </div>
              </div>

              {isCredit && (
                <div className="pt-2 border-t space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="supplier_id">Proveedor Asociado *</Label>
                      <CreateSupplierDialog
                        onSuccess={handleSupplierCreated}
                        trigger={
                          <button
                            type="button"
                            className="text-[10px] text-primary hover:underline font-medium"
                          >
                            + Nuevo Proveedor
                          </button>
                        }
                      />
                    </div>
                    {suppliers.length > 0 ? (
                      <select
                        id="supplier_id"
                        name="supplier_id"
                        required={isCredit}
                        value={selectedSupplierId}
                        onChange={(e) => handleSupplierChange(e.target.value)}
                        className="w-full h-8 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="" disabled>Selecciona un proveedor...</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id} className="bg-popover text-popover-foreground">
                            {s.name} {s.tax_id ? `(${s.tax_id})` : ''} {s.credit_days ? `· ${s.credit_days}d crédito` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-2 rounded border border-dashed text-center text-xs text-muted-foreground space-y-1">
                        <span>No hay proveedores registrados aún.</span>
                        <div>
                          <CreateSupplierDialog
                            onSuccess={handleSupplierCreated}
                            trigger={
                              <button type="button" className="text-primary font-semibold hover:underline text-[11px]">
                                + Crear primer proveedor
                              </button>
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="invoice_number">N° de Factura / Control</Label>
                      <Input
                        id="invoice_number"
                        name="invoice_number"
                        placeholder="Ej: FAC-889"
                        className="h-8 font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="due_date">Fecha Límite / Vencimiento</Label>
                      <Input
                        id="due_date"
                        name="due_date"
                        type="date"
                        value={creditDueDate}
                        onChange={(e) => setCreditDueDate(e.target.value)}
                        required={isCredit}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Ubicación en Cocina / Bodega</Label>
              <Input id="location" name="location" placeholder="Ej: Nevera 2 - Estante Carnes" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Insumo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
