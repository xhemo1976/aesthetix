import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getRevenueStats,
  getDailyRevenue,
  getServiceStats,
  getEmployeeStats,
  getCustomerStats
} from '@/lib/actions/analytics'
import { AnalyticsDashboard } from './analytics-dashboard'
import { BarChart3 } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all analytics data in parallel
  const [
    revenueResult,
    dailyRevenueResult,
    servicesResult,
    employeesResult,
    customersResult
  ] = await Promise.all([
    getRevenueStats('month'),
    getDailyRevenue('month'),
    getServiceStats('month'),
    getEmployeeStats('month'),
    getCustomerStats('month')
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          Analytics
        </h2>
        <p className="text-muted-foreground">
          Übersicht über Umsatz, Services und Performance
        </p>
      </div>

      <AnalyticsDashboard
        revenueStats={revenueResult.stats}
        dailyRevenue={dailyRevenueResult.data}
        serviceStats={servicesResult.services}
        employeeStats={employeesResult.employees}
        customerStats={customersResult.stats}
      />
    </div>
  )
}
