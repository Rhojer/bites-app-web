'use client'

import { useState } from 'react'
import {
  Users,
  Megaphone,
  Receipt
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { CustomersDirectory } from './customers-directory'
import { CreditAccountsView, CreditPaymentRecord } from './credit-accounts-view'
import { CampaignsList, CampaignRecord } from './campaigns-list'
import { CreateCustomerDialog } from './create-customer-dialog'
import { RecordCreditPaymentDialog } from './record-credit-payment-dialog'
import { CreateCampaignDialog } from './create-campaign-dialog'
import { CustomerProfile } from './customer-detail-sheet'

interface CRMViewProps {
  customers: CustomerProfile[]
  creditPayments: CreditPaymentRecord[]
  marketingCampaigns: CampaignRecord[]
  paymentMethods: { id: string; name: string; currency: string | null }[]
}

export function CRMView({
  customers,
  creditPayments,
  marketingCampaigns,
  paymentMethods,
}: CRMViewProps) {
  const [activeTab, setActiveTab] = useState('customers')

  // Top Metrics
  const totalCustomers = customers.length
  const debtors = customers.filter((c) => (c.current_debt || 0) > 0)
  const totalDebt = debtors.reduce((acc, c) => acc + (c.current_debt || 0), 0)

  const allCustomersForPayment = customers.map((c) => ({
    id: c.id,
    full_name: c.full_name,
    current_debt: c.current_debt,
    credit_limit: c.credit_limit,
  }))

  return (
    <div className="space-y-6">
      {/* Top Metric - Solo Cantidad de Clientes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Cantidad de Clientes</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">{totalCustomers}</p>
              <p className="text-[11px] text-muted-foreground">
                {totalCustomers === 1 ? '1 cliente registrado' : `${totalCustomers} clientes en total`}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b pb-3">
          <TabsList className="bg-muted/80 p-1">
            <TabsTrigger value="customers" className="gap-2 px-3 py-1.5 text-xs font-semibold">
              <Users className="size-3.5" />
              <span>Directorio de Clientes</span>
              <span className="ml-1 text-[10px] bg-background/80 px-1.5 py-0.2 rounded-full text-muted-foreground">
                {customers.length}
              </span>
            </TabsTrigger>

            <TabsTrigger value="credits" className="gap-2 px-3 py-1.5 text-xs font-semibold">
              <Receipt className="size-3.5" />
              <span>Cuentas con Deuda</span>
              <span className="ml-1 text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold font-mono">
                ${totalDebt.toFixed(2)}
              </span>
            </TabsTrigger>

            <TabsTrigger value="campaigns" className="gap-2 px-3 py-1.5 text-xs font-semibold">
              <Megaphone className="size-3.5" />
              <span>Campañas de Marketing</span>
              <span className="ml-1 text-[10px] bg-background/80 px-1.5 py-0.2 rounded-full text-muted-foreground">
                {marketingCampaigns.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Contextual Quick Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {activeTab === 'customers' && (
              <CreateCustomerDialog />
            )}

            {activeTab === 'credits' && (
              <RecordCreditPaymentDialog
                customers={allCustomersForPayment}
                paymentMethods={paymentMethods}
              />
            )}

            {activeTab === 'campaigns' && (
              <CreateCampaignDialog customers={customers} />
            )}
          </div>
        </div>

        {/* Tab 1: Directorio de Clientes */}
        <TabsContent value="customers" className="focus-visible:outline-none">
          <CustomersDirectory
            customers={customers}
            paymentMethods={paymentMethods}
          />
        </TabsContent>

        {/* Tab 2: Gestión de Créditos y Cuentas Corrientes */}
        <TabsContent value="credits" className="focus-visible:outline-none">
          <CreditAccountsView
            customers={customers}
            creditPayments={creditPayments}
            paymentMethods={paymentMethods}
          />
        </TabsContent>

        {/* Tab 3: Campañas de Marketing */}
        <TabsContent value="campaigns" className="focus-visible:outline-none">
          <CampaignsList
            campaigns={marketingCampaigns}
            customers={customers}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
