import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCustomers } from '@/lib/actions/customers'
import { CustomersList } from './customers-list'

export default async function CustomersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { customers } = await getCustomers()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Kunden</h2>
        <p className="text-muted-foreground">
          Verwalte deine Kundendaten und Kontaktinformationen
        </p>
      </div>

      <CustomersList initialCustomers={customers || []} />
    </div>
  )
}
