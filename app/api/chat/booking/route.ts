'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ServiceInfo {
  id: string
  name: string
  price: number
  duration_minutes: number
  category: string | null
}

interface SlotRequest {
  action: 'get_services' | 'get_slots' | 'create_booking'
  tenantSlug: string
  serviceId?: string
  date?: string
  customerData?: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
  }
  time?: string
}

// Generate random confirmation token
function generateConfirmationToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const body: SlotRequest = await request.json()
    const { action, tenantSlug } = body

    const adminClient = createAdminClient()

    // Get tenant
    const { data: tenant } = await adminClient
      .from('tenants')
      .select('id, name, slug')
      .ilike('slug', `${tenantSlug}%`)
      .limit(1)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant nicht gefunden' }, { status: 404 })
    }

    // Get services
    if (action === 'get_services') {
      const { data: services } = await adminClient
        .from('services')
        .select('id, name, price, duration_minutes, category')
        .eq('tenant_id', (tenant as { id: string }).id)
        .eq('is_active', true)
        .order('category')
        .order('name')

      return NextResponse.json({
        services: (services as ServiceInfo[] | null) || []
      })
    }

    // Get available slots
    if (action === 'get_slots') {
      const { serviceId, date } = body

      if (!serviceId || !date) {
        return NextResponse.json({ error: 'serviceId und date erforderlich' }, { status: 400 })
      }

      // Get service duration
      const { data: service } = await adminClient
        .from('services')
        .select('duration_minutes')
        .eq('id', serviceId)
        .single()

      if (!service) {
        return NextResponse.json({ error: 'Service nicht gefunden' }, { status: 404 })
      }

      const durationMinutes = (service as { duration_minutes: number }).duration_minutes

      // Get all active employees
      const { data: employees } = await adminClient
        .from('employees')
        .select('id, work_schedule')
        .eq('tenant_id', (tenant as { id: string }).id)
        .eq('is_active', true)

      if (!employees || employees.length === 0) {
        return NextResponse.json({ slots: [] })
      }

      // Get day of week
      const dateObj = new Date(date)
      const dayOfWeek = dateObj.getDay()
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = dayNames[dayOfWeek]

      // Get existing appointments for the date
      const startOfDay = new Date(`${date}T00:00:00`).toISOString()
      const endOfDay = new Date(`${date}T23:59:59`).toISOString()

      const { data: existingAppointments } = await adminClient
        .from('appointments')
        .select('employee_id, start_time, end_time')
        .eq('tenant_id', (tenant as { id: string }).id)
        .neq('status', 'canceled')
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)

      const appointments = (existingAppointments as Array<{ employee_id: string; start_time: string; end_time: string }>) || []

      // Calculate available slots
      const availableSlots = new Set<string>()

      for (const employee of employees) {
        const emp = employee as { id: string; work_schedule: Record<string, { start: string; end: string }> | null }
        const schedule = emp.work_schedule?.[dayName]

        if (!schedule || !schedule.start || !schedule.end) {
          continue
        }

        const [startHour, startMinute] = schedule.start.split(':').map(Number)
        const [endHour, endMinute] = schedule.end.split(':').map(Number)

        const workStartMinutes = startHour * 60 + startMinute
        const workEndMinutes = endHour * 60 + endMinute

        for (let slotStart = workStartMinutes; slotStart + durationMinutes <= workEndMinutes; slotStart += 30) {
          const slotHour = Math.floor(slotStart / 60)
          const slotMinute = slotStart % 60
          const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`

          const slotStartDate = new Date(`${date}T${slotTime}:00`)
          const slotEndDate = new Date(slotStartDate.getTime() + durationMinutes * 60000)

          const hasConflict = appointments.some(apt => {
            if (apt.employee_id !== emp.id) return false
            const aptStart = new Date(apt.start_time)
            const aptEnd = new Date(apt.end_time)
            return slotStartDate < aptEnd && slotEndDate > aptStart
          })

          if (!hasConflict) {
            availableSlots.add(slotTime)
          }
        }
      }

      const sortedSlots = Array.from(availableSlots).sort()

      return NextResponse.json({ slots: sortedSlots })
    }

    // Create booking
    if (action === 'create_booking') {
      const { serviceId, date, time, customerData } = body

      if (!serviceId || !date || !time || !customerData) {
        return NextResponse.json({ error: 'Alle Felder erforderlich' }, { status: 400 })
      }

      const { firstName, lastName, email, phone } = customerData

      if (!firstName || !lastName || (!email && !phone)) {
        return NextResponse.json({ error: 'Name und Kontakt erforderlich' }, { status: 400 })
      }

      // Get service
      const { data: service } = await adminClient
        .from('services')
        .select('duration_minutes, price, name')
        .eq('id', serviceId)
        .single()

      if (!service) {
        return NextResponse.json({ error: 'Service nicht gefunden' }, { status: 404 })
      }

      const svc = service as { duration_minutes: number; price: number; name: string }

      // Calculate times
      const startTime = new Date(`${date}T${time}`)
      const endTime = new Date(startTime.getTime() + svc.duration_minutes * 60000)

      // Find or create customer
      let customerId: string

      // Try to find existing customer
      let existingCustomer = null
      if (email) {
        const { data } = await adminClient
          .from('customers')
          .select('id')
          .eq('tenant_id', (tenant as { id: string }).id)
          .eq('email', email)
          .single()
        existingCustomer = data
      }

      if (!existingCustomer && phone) {
        const { data } = await adminClient
          .from('customers')
          .select('id')
          .eq('tenant_id', (tenant as { id: string }).id)
          .eq('phone', phone)
          .single()
        existingCustomer = data
      }

      if (existingCustomer) {
        customerId = (existingCustomer as { id: string }).id
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await adminClient
          .from('customers')
          .insert({
            tenant_id: (tenant as { id: string }).id,
            first_name: firstName,
            last_name: lastName,
            email: email || null,
            phone: phone || null,
          } as never)
          .select('id')
          .single()

        if (customerError || !newCustomer) {
          return NextResponse.json({ error: 'Fehler beim Erstellen des Kunden' }, { status: 500 })
        }

        customerId = (newCustomer as { id: string }).id
      }

      // Get first available employee
      const { data: employees } = await adminClient
        .from('employees')
        .select('id')
        .eq('tenant_id', (tenant as { id: string }).id)
        .eq('is_active', true)
        .limit(1)

      const employeeId = employees && employees.length > 0 ? (employees[0] as { id: string }).id : null

      // Generate confirmation token
      const confirmationToken = generateConfirmationToken()

      // Create appointment
      const { data: appointment, error: appointmentError } = await adminClient
        .from('appointments')
        .insert({
          tenant_id: (tenant as { id: string }).id,
          customer_id: customerId,
          service_id: serviceId,
          employee_id: employeeId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          price: svc.price,
          status: 'scheduled',
          confirmation_token: confirmationToken,
        } as never)
        .select('id')
        .single()

      if (appointmentError || !appointment) {
        console.error('Appointment error:', appointmentError)
        return NextResponse.json({ error: 'Fehler beim Erstellen des Termins' }, { status: 500 })
      }

      const formattedDate = startTime.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })

      return NextResponse.json({
        success: true,
        booking: {
          id: (appointment as { id: string }).id,
          confirmationToken,
          service: svc.name,
          date: formattedDate,
          time,
          price: svc.price,
        }
      })
    }

    return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 })

  } catch (error) {
    console.error('Chat booking error:', error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
