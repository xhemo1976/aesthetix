'use server'

import { createClient } from '@/lib/supabase/server'

export type PeriodType = 'today' | 'week' | 'month' | 'year'

export type RevenueStats = {
  total: number
  completed: number
  pending: number
  canceled: number
  appointmentCount: number
  completedCount: number
  canceledCount: number
  noShowCount: number
}

export type ServiceStats = {
  id: string
  name: string
  bookingCount: number
  revenue: number
  averagePrice: number
}

export type DailyRevenue = {
  date: string
  revenue: number
  count: number
}

export type EmployeeStats = {
  id: string
  name: string
  appointmentCount: number
  revenue: number
  completedCount: number
}

export type CustomerStats = {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  averageSpent: number
}

/**
 * Get date range for a period
 */
function getDateRange(period: PeriodType): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  switch (period) {
    case 'today':
      // Already set to today
      break
    case 'week':
      start.setDate(start.getDate() - 7)
      break
    case 'month':
      start.setMonth(start.getMonth() - 1)
      break
    case 'year':
      start.setFullYear(start.getFullYear() - 1)
      break
  }

  return { start, end }
}

/**
 * Get revenue statistics for a period
 */
export async function getRevenueStats(period: PeriodType = 'month'): Promise<{
  stats: RevenueStats | null
  error: string | null
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { stats: null, error: 'Nicht authentifiziert' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { stats: null, error: 'Kein Tenant gefunden' }
  }

  const { start, end } = getDateRange(period)

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, status, price, total_paid')
    .eq('tenant_id', profile.tenant_id)
    .gte('start_time', start.toISOString())
    .lte('start_time', end.toISOString())

  if (error) {
    return { stats: null, error: error.message }
  }

  const stats: RevenueStats = {
    total: 0,
    completed: 0,
    pending: 0,
    canceled: 0,
    appointmentCount: appointments?.length || 0,
    completedCount: 0,
    canceledCount: 0,
    noShowCount: 0
  }

  for (const apt of appointments || []) {
    const price = apt.price || 0

    switch (apt.status) {
      case 'completed':
        stats.completed += price
        stats.total += price
        stats.completedCount++
        break
      case 'scheduled':
      case 'confirmed':
        stats.pending += price
        stats.total += price
        break
      case 'canceled':
        stats.canceled += price
        stats.canceledCount++
        break
      case 'no_show':
        stats.noShowCount++
        break
    }
  }

  return { stats, error: null }
}

/**
 * Get daily revenue for charts
 */
export async function getDailyRevenue(period: PeriodType = 'month'): Promise<{
  data: DailyRevenue[]
  error: string | null
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: [], error: 'Nicht authentifiziert' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { data: [], error: 'Kein Tenant gefunden' }
  }

  const { start, end } = getDateRange(period)

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('start_time, price, status')
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'completed')
    .gte('start_time', start.toISOString())
    .lte('start_time', end.toISOString())
    .order('start_time', { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  // Group by date
  const dailyMap = new Map<string, { revenue: number; count: number }>()

  for (const apt of appointments || []) {
    const date = new Date(apt.start_time).toISOString().split('T')[0]
    const existing = dailyMap.get(date) || { revenue: 0, count: 0 }
    dailyMap.set(date, {
      revenue: existing.revenue + (apt.price || 0),
      count: existing.count + 1
    })
  }

  // Convert to array and fill missing dates
  const result: DailyRevenue[] = []
  const current = new Date(start)

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    const dayData = dailyMap.get(dateStr) || { revenue: 0, count: 0 }
    result.push({
      date: dateStr,
      revenue: dayData.revenue,
      count: dayData.count
    })
    current.setDate(current.getDate() + 1)
  }

  return { data: result, error: null }
}

/**
 * Get service statistics
 */
export async function getServiceStats(period: PeriodType = 'month'): Promise<{
  services: ServiceStats[]
  error: string | null
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { services: [], error: 'Nicht authentifiziert' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { services: [], error: 'Kein Tenant gefunden' }
  }

  const { start, end } = getDateRange(period)

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      service_id,
      price,
      status,
      services (
        id,
        name
      )
    `)
    .eq('tenant_id', profile.tenant_id)
    .in('status', ['completed', 'scheduled', 'confirmed'])
    .gte('start_time', start.toISOString())
    .lte('start_time', end.toISOString())

  if (error) {
    return { services: [], error: error.message }
  }

  // Group by service
  const serviceMap = new Map<string, ServiceStats>()

  for (const apt of appointments || []) {
    const service = Array.isArray(apt.services) ? apt.services[0] : apt.services
    if (!service) continue

    const serviceId = (service as { id: string }).id
    const serviceName = (service as { name: string }).name
    const existing = serviceMap.get(serviceId) || {
      id: serviceId,
      name: serviceName,
      bookingCount: 0,
      revenue: 0,
      averagePrice: 0
    }

    existing.bookingCount++
    existing.revenue += apt.price || 0
    serviceMap.set(serviceId, existing)
  }

  // Calculate averages and sort by booking count
  const services = Array.from(serviceMap.values())
    .map(s => ({
      ...s,
      averagePrice: s.bookingCount > 0 ? s.revenue / s.bookingCount : 0
    }))
    .sort((a, b) => b.bookingCount - a.bookingCount)

  return { services, error: null }
}

/**
 * Get employee statistics
 */
export async function getEmployeeStats(period: PeriodType = 'month'): Promise<{
  employees: EmployeeStats[]
  error: string | null
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { employees: [], error: 'Nicht authentifiziert' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { employees: [], error: 'Kein Tenant gefunden' }
  }

  const { start, end } = getDateRange(period)

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      employee_id,
      price,
      status,
      employees (
        id,
        first_name,
        last_name
      )
    `)
    .eq('tenant_id', profile.tenant_id)
    .not('employee_id', 'is', null)
    .gte('start_time', start.toISOString())
    .lte('start_time', end.toISOString())

  if (error) {
    return { employees: [], error: error.message }
  }

  // Group by employee
  const employeeMap = new Map<string, EmployeeStats>()

  for (const apt of appointments || []) {
    if (!apt.employee_id) continue

    const employee = Array.isArray(apt.employees) ? apt.employees[0] : apt.employees
    if (!employee) continue

    const emp = employee as { id: string; first_name: string; last_name: string }
    const existing = employeeMap.get(apt.employee_id) || {
      id: apt.employee_id,
      name: `${emp.first_name} ${emp.last_name}`,
      appointmentCount: 0,
      revenue: 0,
      completedCount: 0
    }

    existing.appointmentCount++
    if (apt.status === 'completed') {
      existing.revenue += apt.price || 0
      existing.completedCount++
    }
    employeeMap.set(apt.employee_id, existing)
  }

  const employees = Array.from(employeeMap.values())
    .sort((a, b) => b.revenue - a.revenue)

  return { employees, error: null }
}

/**
 * Get customer statistics
 */
export async function getCustomerStats(period: PeriodType = 'month'): Promise<{
  stats: CustomerStats | null
  error: string | null
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { stats: null, error: 'Nicht authentifiziert' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return { stats: null, error: 'Kein Tenant gefunden' }
  }

  const { start, end } = getDateRange(period)

  // Get total customers
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant_id)

  // Get new customers (created in period)
  const { count: newCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant_id)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())

  // Get customers with appointments in period
  const { data: appointmentCustomers } = await supabase
    .from('appointments')
    .select('customer_id, price, status')
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'completed')
    .gte('start_time', start.toISOString())
    .lte('start_time', end.toISOString())

  // Calculate returning customers (more than 1 appointment)
  const customerAppointments = new Map<string, number>()
  let totalRevenue = 0

  for (const apt of appointmentCustomers || []) {
    const count = customerAppointments.get(apt.customer_id) || 0
    customerAppointments.set(apt.customer_id, count + 1)
    totalRevenue += apt.price || 0
  }

  const returningCustomers = Array.from(customerAppointments.values())
    .filter(count => count > 1).length

  const stats: CustomerStats = {
    totalCustomers: totalCustomers || 0,
    newCustomers: newCustomers || 0,
    returningCustomers,
    averageSpent: customerAppointments.size > 0 ? totalRevenue / customerAppointments.size : 0
  }

  return { stats, error: null }
}
