'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmployeeDialog } from './employee-dialog'
import { deleteEmployee, type Employee } from '@/lib/actions/employees'
import { Phone, Mail, Clock, TrendingUp, Trash2, User } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  stylist: 'Stylist/Kosmetiker',
  receptionist: 'Rezeption',
  manager: 'Manager',
  other: 'Sonstige',
}

export function EmployeesList({
  employees,
  services,
}: {
  employees: Employee[]
  services: Array<{ id: string; name: string }>
}) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Möchten Sie ${name} wirklich löschen?`)) return

    setDeleting(id)
    const result = await deleteEmployee(id)
    setDeleting(null)

    if (result.error) {
      alert('Fehler: ' + result.error)
    }
  }

  const getServiceNames = (specialtyIds: string[]) => {
    return specialtyIds
      .map(id => services.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ')
  }

  const formatWorkSchedule = (schedule: Record<string, { start: string; end: string }>) => {
    const days = Object.keys(schedule).length
    if (days === 0) return 'Keine Arbeitszeiten'
    return `${days} Tag${days !== 1 ? 'e' : ''}/Woche`
  }

  return (
    <div className="space-y-4">
      {employees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Noch keine Mitarbeiter angelegt</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map(employee => (
            <Card key={employee.id} className={!employee.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    {employee.profile_image_url ? (
                      <img
                        src={employee.profile_image_url}
                        alt={`${employee.first_name} ${employee.last_name}`}
                        className="w-16 h-16 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                        <User className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {employee.first_name} {employee.last_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{ROLE_LABELS[employee.role] || employee.role}</p>
                      </div>
                      {!employee.is_active && (
                        <Badge variant="secondary">Inaktiv</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {employee.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                )}

                {employee.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{employee.phone}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs">{formatWorkSchedule(employee.work_schedule)}</span>
                </div>

                {employee.commission_percentage > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs">{employee.commission_percentage}% Provision</span>
                  </div>
                )}

                {employee.specialties.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-semibold mb-1">Spezialisierungen:</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {getServiceNames(employee.specialties) || 'Keine'}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <EmployeeDialog employee={employee} services={services} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(employee.id, `${employee.first_name} ${employee.last_name}`)}
                    disabled={deleting === employee.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
