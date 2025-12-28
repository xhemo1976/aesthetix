'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Clock, Euro } from 'lucide-react'
import { ServiceDialog } from './service-dialog'
import { deleteService, toggleServiceStatus } from '@/lib/actions/services'

type Service = {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number
  duration_minutes: number
  is_active: boolean
}

export function ServicesList({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState(initialServices)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Möchtest du diese Behandlung wirklich löschen?')) return

    const result = await deleteService(id)
    if (!result.error) {
      setServices(services.filter(s => s.id !== id))
    }
  }

  async function handleToggleStatus(id: string, isActive: boolean) {
    await toggleServiceStatus(id, isActive)
    setServices(services.map(s =>
      s.id === id ? { ...s, is_active: !isActive } : s
    ))
  }

  function handleEdit(service: Service) {
    setEditingService(service)
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditingService(null)
    setDialogOpen(true)
  }

  function handleDialogClose() {
    setDialogOpen(false)
    setEditingService(null)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-muted-foreground">
          {services.length} Behandlung{services.length !== 1 ? 'en' : ''}
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Neue Behandlung
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="mb-4">Noch keine Behandlungen angelegt</p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Erste Behandlung erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.category && (
                      <CardDescription className="text-xs mt-1">
                        {service.category}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {service.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Euro className="w-4 h-4" />
                    <span className="font-semibold">{service.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration_minutes} Min</span>
                  </div>
                </div>
                <Button
                  variant={service.is_active ? "outline" : "default"}
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => handleToggleStatus(service.id, service.is_active)}
                >
                  {service.is_active ? 'Deaktivieren' : 'Aktivieren'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServiceDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        service={editingService}
      />
    </div>
  )
}
