'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Clock, User, UserCircle } from 'lucide-react'

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

type DayViewProps = {
  appointments: Appointment[]
  currentDate: Date
  onAppointmentClick?: (appointment: Appointment) => void
}

const statusColors = {
  scheduled: 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200',
  confirmed: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200',
  completed: 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200',
  cancelled: 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200',
  no_show: 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200',
}

export function DayView({ appointments, currentDate, onAppointmentClick }: DayViewProps) {
  // Filter appointments for the current day
  const dayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.start_time)
    return (
      aptDate.getDate() === currentDate.getDate() &&
      aptDate.getMonth() === currentDate.getMonth() &&
      aptDate.getFullYear() === currentDate.getFullYear()
    )
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  // Generate time slots from 8:00 to 20:00
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 8)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  const getAppointmentPosition = (startTime: string) => {
    const date = new Date(startTime)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const totalMinutes = (hours - 8) * 60 + minutes
    return (totalMinutes / 60) * 80 // 80px per hour
  }

  const getAppointmentHeight = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMinutes = (end.getTime() - start.getTime()) / 1000 / 60
    return (durationMinutes / 60) * 80 // 80px per hour
  }

  // Calculate overlapping appointments and assign columns
  const appointmentsWithLayout: Array<Appointment & { column: number; totalColumns: number }> = []

  for (let index = 0; index < dayAppointments.length; index++) {
    const apt = dayAppointments[index]
    const startTime = new Date(apt.start_time).getTime()
    const endTime = new Date(apt.end_time).getTime()

    // Find all appointments that overlap with this one
    const overlapping = dayAppointments.filter((other, otherIndex) => {
      if (index === otherIndex) return false
      const otherStart = new Date(other.start_time).getTime()
      const otherEnd = new Date(other.end_time).getTime()
      return startTime < otherEnd && endTime > otherStart
    })

    // Assign column based on overlapping appointments that came before
    let column = 0
    const usedColumns = new Set<number>()

    overlapping.forEach(other => {
      const otherIndex = dayAppointments.indexOf(other)
      if (otherIndex < index) {
        // This appointment comes before us, check its column
        const otherColumn = appointmentsWithLayout[otherIndex]?.column ?? 0
        usedColumns.add(otherColumn)
      }
    })

    // Find first available column
    while (usedColumns.has(column)) {
      column++
    }

    const totalColumns = Math.max(overlapping.length + 1, 1)

    appointmentsWithLayout.push({
      ...apt,
      column,
      totalColumns
    })
  }

  return (
    <Card>
      <CardContent className="p-0">
        {dayAppointments.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Keine Termine für diesen Tag</p>
          </div>
        ) : (
          <div className="relative">
            {/* Time grid */}
            <div className="flex">
              {/* Time labels */}
              <div className="w-20 flex-shrink-0 border-r">
                {timeSlots.map(hour => (
                  <div key={hour} className="h-20 border-b px-2 py-1 text-xs text-muted-foreground">
                    {hour}:00
                  </div>
                ))}
              </div>

              {/* Appointments area */}
              <div className="flex-1 relative" style={{ minHeight: `${timeSlots.length * 80}px` }}>
                {/* Hour lines */}
                {timeSlots.map((hour, index) => (
                  <div
                    key={hour}
                    className="absolute w-full border-b"
                    style={{ top: `${index * 80}px`, height: '80px' }}
                  />
                ))}

                {/* Appointments */}
                {appointmentsWithLayout.map(appointment => {
                  const widthPercent = 100 / appointment.totalColumns
                  const leftPercent = (appointment.column / appointment.totalColumns) * 100

                  return (
                    <div
                      key={appointment.id}
                      onClick={() => onAppointmentClick?.(appointment)}
                      className={`absolute rounded-lg border-l-4 p-2 shadow-sm cursor-pointer transition-all overflow-visible ${
                        statusColors[appointment.status as keyof typeof statusColors] ||
                        statusColors.scheduled
                      }`}
                      style={{
                        top: `${getAppointmentPosition(appointment.start_time)}px`,
                        minHeight: `${Math.max(getAppointmentHeight(appointment.start_time, appointment.end_time), 80)}px`,
                        left: `calc(${leftPercent}% + 8px)`,
                        width: `calc(${widthPercent}% - 16px)`
                      }}
                    >
                      <div className="font-semibold text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(new Date(appointment.start_time))} - {formatTime(new Date(appointment.end_time))}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <User className="w-3 h-3" />
                        <span className="text-sm">
                          {appointment.customers.first_name} {appointment.customers.last_name}
                        </span>
                      </div>
                      <div className="text-xs mt-1 opacity-75">
                        {appointment.services.name}
                      </div>
                      {appointment.employees && (
                        <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                          <UserCircle className="w-3 h-3" />
                          {appointment.employees.first_name} {appointment.employees.last_name}
                        </div>
                      )}
                      {appointment.customer_response === 'confirmed' && (
                        <div className="text-xs mt-1 font-semibold">✓ Bestätigt</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
