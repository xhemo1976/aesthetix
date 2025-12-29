'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Clock, User, UserCircle } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

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

type ResourceViewProps = {
  appointments: Appointment[]
  employees: Employee[]
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

export function ResourceView({ appointments, employees, currentDate, onAppointmentClick }: ResourceViewProps) {
  // Filter appointments for the current day
  const dayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.start_time)
    return (
      aptDate.getDate() === currentDate.getDate() &&
      aptDate.getMonth() === currentDate.getMonth() &&
      aptDate.getFullYear() === currentDate.getFullYear()
    )
  })

  // Include "Unassigned" as a virtual employee column
  const columnsWithUnassigned = [
    ...employees,
    { id: 'unassigned', first_name: 'Nicht', last_name: 'zugewiesen', role: '', specialties: [], is_active: true, work_schedule: {} }
  ]

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

  // Get appointments for a specific employee
  const getEmployeeAppointments = (employeeId: string) => {
    if (employeeId === 'unassigned') {
      return dayAppointments.filter(apt => !apt.employee_id)
    }
    return dayAppointments.filter(apt => apt.employee_id === employeeId)
  }

  // Get day name for work schedule
  const getDayName = (date: Date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.getDay()]
  }

  // Check if employee works on this day
  const getWorkHours = (employee: Employee) => {
    const dayName = getDayName(currentDate)
    return employee.work_schedule?.[dayName] || null
  }

  // Column width
  const columnWidth = 200

  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div className="flex min-w-max">
            {/* Time labels column */}
            <div className="w-20 flex-shrink-0 border-r bg-muted/30 sticky left-0 z-10">
              {/* Header for time column */}
              <div className="h-16 border-b flex items-center justify-center text-sm font-medium text-muted-foreground bg-muted/50">
                Zeit
              </div>
              {/* Time slots */}
              {timeSlots.map(hour => (
                <div key={hour} className="h-20 border-b px-2 py-1 text-xs text-muted-foreground bg-muted/30">
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Employee columns */}
            {columnsWithUnassigned.map(employee => {
              const employeeAppointments = getEmployeeAppointments(employee.id)
              const workHours = employee.id !== 'unassigned' ? getWorkHours(employee as Employee) : null
              const isWorking = employee.id === 'unassigned' || workHours !== null

              return (
                <div
                  key={employee.id}
                  className="flex-shrink-0 border-r"
                  style={{ width: `${columnWidth}px` }}
                >
                  {/* Employee header */}
                  <div className={`h-16 border-b px-3 py-2 ${employee.id === 'unassigned' ? 'bg-muted/50' : 'bg-primary/5'}`}>
                    <div className="flex items-center gap-2">
                      <UserCircle className={`w-8 h-8 ${employee.id === 'unassigned' ? 'text-muted-foreground' : 'text-primary'}`} />
                      <div>
                        <p className="font-medium text-sm">
                          {employee.first_name} {employee.last_name}
                        </p>
                        {workHours && (
                          <p className="text-xs text-muted-foreground">
                            {workHours.start} - {workHours.end}
                          </p>
                        )}
                        {employee.id !== 'unassigned' && !workHours && (
                          <p className="text-xs text-orange-600">Frei</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Time grid with appointments */}
                  <div className="relative" style={{ height: `${timeSlots.length * 80}px` }}>
                    {/* Hour lines */}
                    {timeSlots.map((hour, index) => (
                      <div
                        key={hour}
                        className={`absolute w-full border-b ${!isWorking ? 'bg-muted/20' : ''}`}
                        style={{ top: `${index * 80}px`, height: '80px' }}
                      />
                    ))}

                    {/* Work hours indicator */}
                    {workHours && (
                      <div
                        className="absolute w-full bg-primary/5 border-l-2 border-primary/20"
                        style={{
                          top: `${((parseInt(workHours.start.split(':')[0]) - 8) * 80)}px`,
                          height: `${(parseInt(workHours.end.split(':')[0]) - parseInt(workHours.start.split(':')[0])) * 80}px`
                        }}
                      />
                    )}

                    {/* Appointments */}
                    {employeeAppointments.map(appointment => (
                      <div
                        key={appointment.id}
                        onClick={() => onAppointmentClick?.(appointment)}
                        className={`absolute rounded-lg border-l-4 p-2 shadow-sm cursor-pointer transition-all overflow-hidden ${
                          statusColors[appointment.status as keyof typeof statusColors] ||
                          statusColors.scheduled
                        }`}
                        style={{
                          top: `${getAppointmentPosition(appointment.start_time)}px`,
                          minHeight: `${Math.max(getAppointmentHeight(appointment.start_time, appointment.end_time), 60)}px`,
                          left: '4px',
                          right: '4px',
                          width: 'calc(100% - 8px)'
                        }}
                      >
                        <div className="font-semibold text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(new Date(appointment.start_time))}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          <span className="text-xs truncate">
                            {appointment.customers.first_name} {appointment.customers.last_name}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5 opacity-75 truncate">
                          {appointment.services.name}
                        </div>
                        {appointment.customer_response === 'confirmed' && (
                          <div className="text-xs mt-0.5 font-semibold">✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
