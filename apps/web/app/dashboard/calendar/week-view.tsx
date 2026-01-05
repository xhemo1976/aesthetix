'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Clock, UserCircle } from 'lucide-react'

type Customer = {
  id: string
  first_name: string
  last_name: string
  phone: string | null
}

type Service = {
  id: string
  name: string
  duration_minutes: number
}

type Employee = {
  id: string
  first_name: string
  last_name: string
  role: string
  specialties: string[]
  is_active: boolean
  work_schedule: Record<string, { start: string; end: string }>
}

type Appointment = {
  id: string
  customer_id: string
  service_id: string
  employee_id: string | null
  start_time: string
  end_time: string
  status: string
  customer_notes: string | null
  confirmation_token: string | null
  customers: Customer
  services: Service
  employees: Employee | null
  customer_response: string | null
}

type WeekViewProps = {
  appointments: Appointment[]
  currentDate: Date
  onAppointmentClick?: (appointment: Appointment) => void
}

const statusColors = {
  scheduled: 'bg-blue-500 hover:bg-blue-600',
  confirmed: 'bg-green-500 hover:bg-green-600',
  completed: 'bg-gray-500 hover:bg-gray-600',
  cancelled: 'bg-red-500 hover:bg-red-600',
  no_show: 'bg-orange-500 hover:bg-orange-600',
}

export function WeekView({ appointments, currentDate, onAppointmentClick }: WeekViewProps) {
  // Get week start (Monday)
  const weekStart = new Date(currentDate)
  const day = weekStart.getDay()
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
  weekStart.setDate(diff)
  weekStart.setHours(0, 0, 0, 0)

  // Generate 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return date
  })

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time)
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      )
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 divide-x">
          {weekDays.map((date, index) => {
            const dayAppointments = getAppointmentsForDay(date)
            const today = isToday(date)

            return (
              <div key={index} className={`min-h-[500px] ${today ? 'bg-primary/5' : ''}`}>
                {/* Day header */}
                <div className={`p-3 border-b text-center ${today ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
                  <div className="text-xs font-medium">
                    {date.toLocaleDateString('de-DE', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-bold ${today ? '' : 'text-muted-foreground'}`}>
                    {date.getDate()}
                  </div>
                </div>

                {/* Appointments */}
                <div className="p-2 space-y-1">
                  {dayAppointments.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      Keine Termine
                    </div>
                  ) : (
                    dayAppointments.map(apt => (
                      <div
                        key={apt.id}
                        onClick={() => onAppointmentClick?.(apt)}
                        className={`p-2 rounded text-xs text-white cursor-pointer transition-colors ${
                          statusColors[apt.status as keyof typeof statusColors] || statusColors.scheduled
                        }`}
                      >
                        <div className="font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(new Date(apt.start_time))}
                        </div>
                        <div className="truncate mt-1">
                          {apt.customers.first_name} {apt.customers.last_name}
                        </div>
                        <div className="truncate opacity-90">
                          {apt.services.name}
                        </div>
                        {apt.employees && (
                          <div className="truncate flex items-center gap-1 opacity-90">
                            <UserCircle className="w-3 h-3" />
                            {apt.employees.first_name} {apt.employees.last_name}
                          </div>
                        )}
                        {apt.customer_response === 'confirmed' && (
                          <div className="mt-1 text-[10px]">✓ Bestätigt</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
