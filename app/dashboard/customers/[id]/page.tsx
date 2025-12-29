import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCustomerById, getCustomerAppointments, getCustomerStats } from '@/lib/actions/customers'
import { getTenantSettings } from '@/lib/actions/settings'
import { CustomerDetail } from './customer-detail'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ customer }, { appointments }, { stats }, { settings }] = await Promise.all([
    getCustomerById(id),
    getCustomerAppointments(id),
    getCustomerStats(id),
    getTenantSettings(),
  ])

  if (!customer) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboard/customers">
        <Button variant="ghost" size="sm" className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Zurück zur Übersicht
        </Button>
      </Link>

      <CustomerDetail
        customer={customer}
        appointments={appointments as any[]}
        stats={stats}
        clinicWhatsApp={settings?.whatsapp_number || null}
        clinicName={settings?.name || 'Ihre Klinik'}
      />
    </div>
  )
}
