import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getEmployees } from '@/lib/actions/employees'
import { getServices } from '@/lib/actions/services'
import { EmployeeDialog } from './employee-dialog'
import { EmployeesList } from './employees-list'
import { Users } from 'lucide-react'

export default async function EmployeesPage() {
  const { employees, error } = await getEmployees()
  const { services } = await getServices()

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-destructive">
          <p>Fehler beim Laden der Mitarbeiter: {error}</p>
        </div>
      </div>
    )
  }

  const activeEmployees = employees?.filter(e => e.is_active).length || 0
  const inactiveEmployees = employees?.filter(e => !e.is_active).length || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mitarbeiter</h1>
          <p className="text-muted-foreground">
            {activeEmployees} aktiv{inactiveEmployees > 0 ? `, ${inactiveEmployees} inaktiv` : ''}
          </p>
        </div>
        <EmployeeDialog services={services || []} />
      </div>

      <div className="grid gap-6 mb-8 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-muted-foreground" />
              <div className="text-3xl font-bold">{employees?.length || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Aktive Mitarbeiter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-green-600">{activeEmployees}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Inaktive Mitarbeiter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-muted-foreground">{inactiveEmployees}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <EmployeesList employees={employees || []} services={services || []} />
    </div>
  )
}
