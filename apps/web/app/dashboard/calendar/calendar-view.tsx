'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, User } from 'lucide-react'
import { DayView } from './day-view'
import { WeekView } from './week-view'
import { MonthView } from './month-view'
import { ResourceView } from './resource-view'
import { AppointmentDialog } from '../appointments/appointment-dialog'

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
  customer_response: string | null
  customers: Customer
  services: Service
  employees: Employee | null
}

type CalendarViewProps = {
  initialAppointments: Appointment[]
  customers: Customer[]
  services: Service[]
  employees: Employee[]
}

type ViewMode = 'day' | 'week' | 'month' | 'resource'

export function CalendarView({ initialAppointments, customers, services, employees }: CalendarViewProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all')

  // Filter appointments by selected employee
  const filteredAppointments = useMemo(() => {
    if (selectedEmployeeId === 'all') {
      return initialAppointments
    }
    if (selectedEmployeeId === 'unassigned') {
      return initialAppointments.filter(apt => !apt.employee_id)
    }
    return initialAppointments.filter(apt => apt.employee_id === selectedEmployeeId)
  }, [initialAppointments, selectedEmployeeId])

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedAppointment(null)
    router.refresh()
  }

  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getDateRangeText = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      return `${startOfWeek.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long'
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Navigation and View Switcher */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="min-w-[200px] text-center">
              <h3 className="font-semibold text-sm sm:text-base">{getDateRangeText()}</h3>
            </div>

            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={goToToday}>
              <CalendarIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Heute</span>
            </Button>
          </div>

          {/* Employee Filter & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Employee Filter */}
            {viewMode !== 'resource' && (
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="w-[180px]">
                  <User className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Mitarbeiter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                  <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* View Mode Switcher */}
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Tag
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Woche
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Monat
              </Button>
              <Button
                variant={viewMode === 'resource' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('resource')}
                title="Mitarbeiter-Spalten"
              >
                <Users className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar View */}
      {viewMode === 'day' && (
        <DayView
          appointments={filteredAppointments}
          currentDate={currentDate}
          onAppointmentClick={handleAppointmentClick}
        />
      )}
      {viewMode === 'week' && (
        <WeekView
          appointments={filteredAppointments}
          currentDate={currentDate}
          onAppointmentClick={handleAppointmentClick}
        />
      )}
      {viewMode === 'month' && (
        <MonthView appointments={filteredAppointments} currentDate={currentDate} />
      )}
      {viewMode === 'resource' && (
        <ResourceView
          appointments={initialAppointments}
          employees={employees}
          currentDate={currentDate}
          onAppointmentClick={handleAppointmentClick}
        />
      )}

      {/* Edit Appointment Dialog */}
      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        appointment={selectedAppointment}
        customers={customers}
        services={services}
        employees={employees}
        existingAppointments={initialAppointments.map(a => ({
          id: a.id,
          employee_id: a.employee_id,
          start_time: a.start_time,
          end_time: a.end_time,
          status: a.status
        }))}
      />
    </div>
  )
}
