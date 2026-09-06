import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/layout/admin-shell'
import { Navbar } from '@/components/layout/navbar'
import { CRMView } from '@/components/crm/crm-view'
import { CreateCustomerDialog } from '@/components/crm/create-customer-dialog'
import { RecordCreditPaymentDialog } from '@/components/crm/record-credit-payment-dialog'
import { CreateCampaignDialog } from '@/components/crm/create-campaign-dialog'

export default async function CRMPage() {
  const supabase = await createClient()

  // 1. Obtener clientes (profiles)
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const customers = profilesData || []

  // 2. Obtener métodos de pago
  const { data: paymentMethodsData } = await supabase
    .from('payment_methods')
    .select('*')
    .order('name', { ascending: true })

  const paymentMethods = paymentMethodsData || []

  // 3. Obtener historial de abonos a crédito
  const { data: creditPaymentsData } = await supabase
    .from('credit_payments')
    .select('*')
    .order('created_at', { ascending: false })

  const creditPayments = creditPaymentsData || []

  // 4. Obtener campañas de marketing
  const { data: marketingCampaignsData } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  const marketingCampaigns = marketingCampaignsData || []

  const allCustomersForPayment = customers.map((c) => ({
    id: c.id,
    full_name: c.full_name,
    current_debt: c.current_debt,
    credit_limit: c.credit_limit,
  }))

  return (
    <AdminShell>
      <Navbar
        title="CRM, Clientes & Créditos"
        description="Directorio de clientes, cuentas corrientes, líneas de crédito y campañas de fidelización"
        actions={
          <div className="flex items-center gap-2">
            <RecordCreditPaymentDialog
              customers={allCustomersForPayment}
              paymentMethods={paymentMethods}
            />
            <CreateCustomerDialog />
          </div>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl">
        <CRMView
          customers={customers}
          creditPayments={creditPayments}
          marketingCampaigns={marketingCampaigns}
          paymentMethods={paymentMethods}
        />
      </main>
    </AdminShell>
  )
}
