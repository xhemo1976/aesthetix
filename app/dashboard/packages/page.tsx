import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPackages, getCustomerPackages } from '@/lib/actions/packages'
import { getServices } from '@/lib/actions/services'
import { getCustomers } from '@/lib/actions/customers'
import { PackagesManager } from './packages-manager'

export default async function PackagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [
    { packages },
    { customerPackages },
    { services },
    { customers }
  ] = await Promise.all([
    getPackages(),
    getCustomerPackages(),
    getServices(),
    getCustomers(),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Pakete & Angebote</h2>
        <p className="text-muted-foreground">
          Erstelle Paketangebote und Mehrfachkarten für deine Kunden
        </p>
      </div>

      <PackagesManager
        initialPackages={packages}
        customerPackages={customerPackages}
        services={services || []}
        customers={customers || []}
      />
    </div>
  )
}
