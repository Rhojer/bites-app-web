import { AdminShell } from '@/components/layout/admin-shell'
import { Navbar } from '@/components/layout/navbar'
import { KitchenDisplay } from '@/components/kitchen/kitchen-display'
import { getKitchenOrdersAction } from '@/app/kitchen/actions'
import { UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function KitchenPage() {
  const initialOrders = await getKitchenOrdersAction()

  return (
    <AdminShell>
      <Navbar
        title="Cocina en Vivo"
        description="Comandas activas, tiempos de preparación y platos listos para servir"
        actions={
          <Link href="/pos">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs shadow-2xs">
              <UtensilsCrossed className="size-3.5" />
              Tomar Nuevo Pedido
            </Button>
          </Link>
        }
      />

      <main className="p-6 max-w-7xl">
        <KitchenDisplay initialOrders={initialOrders} />
      </main>
    </AdminShell>
  )
}
