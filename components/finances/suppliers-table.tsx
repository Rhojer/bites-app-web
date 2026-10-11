'use client'

import { useState } from 'react'
import {
  Building2,
  Search,
  Phone,
  Mail,
  Calendar,
  Trash2,
  FileText,
  AlertCircle,
  Plus,
  Loader2,
  UserCheck,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CreateSupplierDialog } from './create-supplier-dialog'
import { deleteSupplierAction } from '@/app/finances/actions'
import { BillItem } from './bills-payable-table'

export interface SupplierItem {
  id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  tax_id: string | null
  credit_days: number | null
  notes: string | null
  created_at?: string
}

interface SuppliersTableProps {
  suppliers: SupplierItem[]
  bills?: BillItem[]
}

export function SuppliersTable({ suppliers, bills = [] }: SuppliersTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Calcular facturas pendientes por proveedor
  const billsBySupplier = suppliers.reduce((acc, sup) => {
    const supBills = bills.filter((b) => b.supplier_id === sup.id)
    const pendingBills = supBills.filter((b) => b.status === 'pending')
    const pendingAmount = pendingBills.reduce((sum, b) => sum + (b.amount || 0), 0)
    acc[sup.id] = {
      totalCount: supBills.length,
      pendingCount: pendingBills.length,
      pendingAmount,
    }
    return acc
  }, {} as Record<string, { totalCount: number; pendingCount: number; pendingAmount: number }>)

  const filtered = suppliers.filter((sup) => {
    const q = searchTerm.toLowerCase()
    return (
      sup.name.toLowerCase().includes(q) ||
      (sup.contact_name && sup.contact_name.toLowerCase().includes(q)) ||
      (sup.tax_id && sup.tax_id.toLowerCase().includes(q)) ||
      (sup.phone && sup.phone.toLowerCase().includes(q)) ||
      (sup.email && sup.email.toLowerCase().includes(q))
    )
  })

  async function handleConfirmDelete() {
    if (!deletingSupplier) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteSupplierAction(deletingSupplier.id)
      setDeletingSupplier(null)
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar el proveedor')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa, RIF, contacto o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <CreateSupplierDialog />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Empresa / RIF</th>
                <th className="py-3.5 px-4">Contacto</th>
                <th className="py-3.5 px-4">Comunicación</th>
                <th className="py-3.5 px-4 text-center">Crédito Habitual</th>
                <th className="py-3.5 px-4 text-right">Facturas Pendientes</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-muted-foreground">
                    <Building2 className="size-10 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="font-semibold text-sm text-foreground">No hay proveedores registrados</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchTerm
                        ? 'No se encontraron proveedores con ese criterio.'
                        : 'Utiliza el botón "+ Nuevo Proveedor" para dar de alta a tus distribuidores comerciales.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((sup) => {
                  const billInfo = billsBySupplier[sup.id] || { totalCount: 0, pendingCount: 0, pendingAmount: 0 }
                  const hasBills = billInfo.totalCount > 0

                  return (
                    <tr key={sup.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-primary shrink-0" />
                          <span>{sup.name}</span>
                        </div>
                        {sup.tax_id && (
                          <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                            RIF: {sup.tax_id}
                          </div>
                        )}
                        {sup.notes && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-xs mt-0.5" title={sup.notes}>
                            {sup.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {sup.contact_name ? (
                          <div className="flex items-center gap-1.5 text-foreground">
                            <UserCheck className="size-3.5 text-muted-foreground shrink-0" />
                            <span>{sup.contact_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">No especificado</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {sup.phone ? (
                            <div className="flex items-center gap-1.5 text-foreground font-mono">
                              <Phone className="size-3 text-muted-foreground shrink-0" />
                              <span>{sup.phone}</span>
                            </div>
                          ) : null}
                          {sup.email ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="size-3 shrink-0" />
                              <span className="truncate max-w-[160px]">{sup.email}</span>
                            </div>
                          ) : null}
                          {!sup.phone && !sup.email && (
                            <span className="text-muted-foreground italic text-[11px]">Sin datos</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="outline" className="font-mono text-[11px] gap-1">
                          <Calendar className="size-3 text-muted-foreground" />
                          {sup.credit_days ? `${sup.credit_days} días` : 'Contado (0 d)'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {billInfo.pendingCount > 0 ? (
                          <div>
                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                              ${billInfo.pendingAmount.toFixed(2)}
                            </span>
                            <div className="text-[10px] text-muted-foreground">
                              {billInfo.pendingCount} factura(s) por pagar
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-medium">Al día ($0.00)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            setDeleteError(null)
                            setDeletingSupplier(sup)
                          }}
                          className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                          title="Eliminar proveedor"
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog for Deletion */}
      <Dialog
        open={Boolean(deletingSupplier)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSupplier(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              Eliminar Proveedor
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar al proveedor{' '}
              <strong className="text-foreground">{deletingSupplier?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs my-2">
              {deleteError}
            </div>
          )}

          {deletingSupplier && billsBySupplier[deletingSupplier.id]?.totalCount > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs my-2 flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div>
                Este proveedor tiene{' '}
                <strong>{billsBySupplier[deletingSupplier.id].totalCount} factura(s)</strong> asociadas en el sistema.
                Para proteger la integridad contable, primero debes eliminar o liquidar sus facturas antes de poder removerlo.
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Los insumos que tengan asignado este proveedor continuarán en el inventario, pero quedarán sin proveedor asignado.
          </p>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingSupplier(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Eliminar Proveedor
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
