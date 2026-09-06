'use client'

import { useState } from 'react'
import {
  Users,
  CreditCard,
  Megaphone,
  UserPlus,
  Receipt,
  Sparkles,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowDownLeft
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  const totalCreditLimit = customers.reduce((acc, c) => acc + (c.credit_limit || 0), 0)
  const totalRecovered = creditPayments.reduce((acc, p) => acc + p.amount, 0)
  const totalSpentAll = customers.reduce((acc, c) => acc + (c.total_spent || 0), 0)

  const allCustomersForPayment = customers.map((c) => ({
    id: c.id,
    full_name: c.full_name,
    current_debt: c.current_debt,
    credit_limit: c.credit_limit,
  }))

  return (
    <div className="space-y-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clientes */}
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Directorio de Clientes</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">{totalCustomers}</p>
              <p className="text-[11px] text-muted-foreground">
                ${totalSpentAll.toFixed(2)} consumido en total
              </p>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Deuda Total / Cuentas por Cobrar */}
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Cuentas por Cobrar (Deuda)</p>
              <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-mono">
                ${totalDebt.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {debtors.length} clientes con balance deudor
              </p>
            </div>
            <div className="size-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Cartera de Crédito Asignada */}
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Líneas de Crédito Activas</p>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                ${totalCreditLimit.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {customers.filter((c) => (c.credit_limit || 0) > 0).length} clientes autorizados
              </p>
            </div>
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CreditCard className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Abonos Recuperados */}
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Abonos Cobrados</p>
              <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                ${totalRecovered.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {creditPayments.length} transacciones registradas
              </p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="size-5" />
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
              <CreditCard className="size-3.5" />
              <span>Cuentas de Crédito & Abonos</span>
              {debtors.length > 0 && (
                <span className="ml-1 text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                  {debtors.length}
                </span>
              )}
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
