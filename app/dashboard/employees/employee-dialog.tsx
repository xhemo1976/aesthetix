'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createEmployee, updateEmployee, type Employee } from '@/lib/actions/employees'
import { Plus } from 'lucide-react'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_NAMES = {
  monday: 'Montag',
  tuesday: 'Dienstag',
  wednesday: 'Mittwoch',
  thursday: 'Donnerstag',
  friday: 'Freitag',
  saturday: 'Samstag',
  sunday: 'Sonntag',
}

const ROLES = [
  { value: 'stylist', label: 'Stylist/Kosmetiker' },
  { value: 'receptionist', label: 'Rezeption' },
  { value: 'manager', label: 'Manager' },
  { value: 'other', label: 'Sonstige' },
]

export function EmployeeDialog({ employee, services }: { employee?: Employee; services: Array<{ id: string; name: string }> }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>(employee?.specialties || [])
  const [workSchedule, setWorkSchedule] = useState<Record<string, { start: string; end: string; enabled: boolean }>>(
    DAYS.reduce((acc, day) => {
      const existing = employee?.work_schedule?.[day]
      acc[day] = existing
        ? { ...existing, enabled: true }
        : { start: '09:00', end: '17:00', enabled: false }
      return acc
    }, {} as Record<string, { start: string; end: string; enabled: boolean }>)
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    // Add specialties
    formData.set('specialties', selectedServices.join(','))

    // Add work schedule (only enabled days)
    const activeSchedule = Object.entries(workSchedule).reduce((acc, [day, schedule]) => {
      if (schedule.enabled) {
        acc[day] = { start: schedule.start, end: schedule.end }
      }
      return acc
    }, {} as Record<string, { start: string; end: string }>)
    formData.set('work_schedule', JSON.stringify(activeSchedule))

    const result = employee
      ? await updateEmployee(employee.id, formData)
      : await createEmployee(formData)

    setLoading(false)

    if (!result.error) {
      setOpen(false)
    } else {
      alert('Fehler: ' + result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {employee ? (
          <Button variant="ghost" size="sm">
            Bearbeiten
          </Button>
        ) : (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Mitarbeiter hinzufügen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Vorname *</Label>
              <Input id="first_name" name="first_name" defaultValue={employee?.first_name} required />
            </div>
            <div>
              <Label htmlFor="last_name">Nachname *</Label>
              <Input id="last_name" name="last_name" defaultValue={employee?.last_name} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" name="email" type="email" defaultValue={employee?.email || ''} />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={employee?.phone || ''} />
            </div>
          </div>

          <div>
            <Label htmlFor="role">Rolle</Label>
            <Select name="role" defaultValue={employee?.role || 'stylist'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Spezialisierungen (Services)</Label>
            <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
              {services.map(service => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`service-${service.id}`}
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedServices([...selectedServices, service.id])
                      } else {
                        setSelectedServices(selectedServices.filter(id => id !== service.id))
                      }
                    }}
                  />
                  <label htmlFor={`service-${service.id}`} className="text-sm cursor-pointer">
                    {service.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hourly_rate">Stundensatz (€)</Label>
              <Input
                id="hourly_rate"
                name="hourly_rate"
                type="number"
                step="0.01"
                defaultValue={employee?.hourly_rate || 0}
              />
            </div>
            <div>
              <Label htmlFor="commission_percentage">Provision (%)</Label>
              <Input
                id="commission_percentage"
                name="commission_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={employee?.commission_percentage || 0}
              />
            </div>
          </div>

          <div>
            <Label>Arbeitszeiten</Label>
            <div className="border rounded-lg p-3 space-y-2">
              {DAYS.map(day => (
                <div key={day} className="flex items-center gap-3">
                  <Checkbox
                    id={`day-${day}`}
                    checked={workSchedule[day].enabled}
                    onCheckedChange={(checked) => {
                      setWorkSchedule({
                        ...workSchedule,
                        [day]: { ...workSchedule[day], enabled: !!checked }
                      })
                    }}
                  />
                  <label htmlFor={`day-${day}`} className="w-24 text-sm">
                    {DAY_NAMES[day as keyof typeof DAY_NAMES]}
                  </label>
                  {workSchedule[day].enabled && (
                    <>
                      <Input
                        type="time"
                        value={workSchedule[day].start}
                        onChange={(e) => {
                          setWorkSchedule({
                            ...workSchedule,
                            [day]: { ...workSchedule[day], start: e.target.value }
                          })
                        }}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">bis</span>
                      <Input
                        type="time"
                        value={workSchedule[day].end}
                        onChange={(e) => {
                          setWorkSchedule({
                            ...workSchedule,
                            [day]: { ...workSchedule[day], end: e.target.value }
                          })
                        }}
                        className="w-32"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="is_active" name="is_active" value="true" defaultChecked={employee?.is_active ?? true} />
            <label htmlFor="is_active" className="text-sm cursor-pointer">
              Aktiv
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
