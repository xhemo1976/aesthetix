'use client'

import { Card, CardContent } from '@/components/ui/card'

type Appointment = {
  id: string
  start_time: string
  status: string
  customer_response: string | null
}

const statusColors = {
  scheduled: 'bg-blue-500',
  confirmed: 'bg-green-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-500',
  no_show: 'bg-orange-500',
}

export function MonthView({ appointments, currentDate }: { appointments: Appointment[]; currentDate: Date }) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Get day of week for first day (0 = Sunday, adjust to Monday = 0)
  let startDay = firstDay.getDay() - 1
  if (startDay === -1) startDay = 6

  // Total cells needed
  const totalDays = lastDay.getDate()
  const totalCells = Math.ceil((totalDays + startDay) / 7) * 7

  // Generate calendar cells
  const calendarDays: (Date | null)[] = []

  for (let i = 0; i < totalCells; i++) {
    if (i < startDay || i >= startDay + totalDays) {
      calendarDays.push(null)
    } else {
      calendarDays.push(new Date(year, month, i - startDay + 1))
    }
  }

  const getAppointmentsForDay = (date: Date | null) => {
    if (!date) return []

    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time)
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-7">
          {/* Weekday headers */}
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center font-semibold border-b bg-muted/50 text-sm">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            const dayAppointments = getAppointmentsForDay(date)
            const today = isToday(date)

            return (
              <div
                key={index}
                className={`min-h-[100px] border-r border-b p-2 ${
                  date ? (today ? 'bg-primary/10' : 'hover:bg-muted/30') : 'bg-muted/10'
                }`}
              >
                {date && (
                  <>
                    <div className={`text-sm font-semibold mb-1 ${today ? 'text-primary' : 'text-muted-foreground'}`}>
                      {date.getDate()}
                    </div>

                    {/* Appointment dots */}
                    <div className="space-y-0.5">
                      {dayAppointments.slice(0, 3).map(apt => (
                        <div
                          key={apt.id}
                          className={`h-1.5 rounded-full ${
                            statusColors[apt.status as keyof typeof statusColors] || statusColors.scheduled
                          } ${apt.customer_response === 'confirmed' ? 'ring-2 ring-green-300' : ''}`}
                          title={`${apt.status}${apt.customer_response === 'confirmed' ? ' - Bestätigt' : ''}`}
                        />
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">
                          +{dayAppointments.length - 3} weitere
                        </div>
                      )}
                    </div>

                    {dayAppointments.length > 0 && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {dayAppointments.length} Termin{dayAppointments.length !== 1 ? 'e' : ''}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
