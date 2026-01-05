import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServices } from '@/lib/actions/services'
import { ServicesList } from './services-list'
import { getBusinessTypeConfig } from '@/lib/config/business-types'

export default async function ServicesPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get tenant info including business_type
  const { data: profile } = await adminClient
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single() as { data: { tenant_id: string } | null }

  let businessType = 'beauty_clinic'
  if (profile?.tenant_id) {
    const { data: tenant } = await adminClient
      .from('tenants')
      .select('business_type')
      .eq('id', profile.tenant_id)
      .single() as { data: { business_type: string } | null }

    if (tenant?.business_type) {
      businessType = tenant.business_type
    }
  }

  const config = getBusinessTypeConfig(businessType)
  const { services } = await getServices()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{config.labels.services}</h1>
        <p className="text-muted-foreground">
          {businessType === 'gastronomy'
            ? 'Verwalte deine Speisekarte, Preise und Allergene'
            : 'Verwalte deine Behandlungen, Preise und Verfügbarkeit'
          }
        </p>
      </div>

      <ServicesList initialServices={services || []} businessType={businessType} />
    </div>
  )
}
