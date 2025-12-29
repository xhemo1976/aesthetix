'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  MapPin,
  Plus,
  Phone,
  Mail,
  Users,
  Sparkles,
  Star,
  Pencil,
  Trash2,
  MessageCircle,
  ExternalLink
} from 'lucide-react'
import {
  createLocation,
  updateLocation,
  deleteLocation,
  setLocationAsPrimary,
  type LocationWithEmployees
} from '@/lib/actions/locations'

type LocationsListProps = {
  initialLocations: LocationWithEmployees[]
}

export function LocationsList({ initialLocations }: LocationsListProps) {
  const router = useRouter()
  const [locations, setLocations] = useState(initialLocations)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<LocationWithEmployees | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    if (editingLocation) {
      const { error } = await updateLocation(editingLocation.id, formData)
      if (error) {
        alert(error)
      }
    } else {
      const { error } = await createLocation(formData)
      if (error) {
        alert(error)
      }
    }

    setIsLoading(false)
    setIsDialogOpen(false)
    setEditingLocation(null)
    router.refresh()
  }

  const handleDelete = async (locationId: string) => {
    if (!confirm('Möchtest du diesen Standort wirklich löschen?')) return

    const { error } = await deleteLocation(locationId)
    if (error) {
      alert(error)
    } else {
      router.refresh()
    }
  }

  const handleSetPrimary = async (locationId: string) => {
    const { error } = await setLocationAsPrimary(locationId)
    if (error) {
      alert(error)
    } else {
      router.refresh()
    }
  }

  const openEditDialog = (location: LocationWithEmployees) => {
    setEditingLocation(location)
    setIsDialogOpen(true)
  }

  const openNewDialog = () => {
    setEditingLocation(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Add Location Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Standort hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? 'Standort bearbeiten' : 'Neuer Standort'}
              </DialogTitle>
              <DialogDescription>
                {editingLocation
                  ? 'Bearbeite die Standortdaten'
                  : 'Füge einen neuen Standort hinzu'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingLocation?.name || ''}
                  placeholder="z.B. Filiale Berlin Mitte"
                  required
                />
              </div>

              {!editingLocation && (
                <div className="space-y-2">
                  <Label htmlFor="slug">URL-Slug *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="z.B. berlin-mitte"
                    pattern="[a-z0-9-]+"
                    title="Nur Kleinbuchstaben, Zahlen und Bindestriche"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Wird für die Buchungs-URL verwendet
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={editingLocation?.address || ''}
                  placeholder="Straße und Hausnummer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">PLZ</Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    defaultValue={editingLocation?.postal_code || ''}
                    placeholder="12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Stadt</Label>
                  <Input
                    id="city"
                    name="city"
                    defaultValue={editingLocation?.city || ''}
                    placeholder="Berlin"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={editingLocation?.phone || ''}
                  placeholder="+49 30 12345678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingLocation?.email || ''}
                  placeholder="berlin@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp</Label>
                <Input
                  id="whatsapp_number"
                  name="whatsapp_number"
                  defaultValue={editingLocation?.whatsapp_number || ''}
                  placeholder="+4930123456789"
                />
              </div>

              {editingLocation && (
                <input type="hidden" name="is_active" value={editingLocation.is_active ? 'true' : 'false'} />
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Speichern...' : 'Speichern'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Locations Grid */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Keine Standorte</h3>
            <p className="text-muted-foreground mb-4">
              Füge deinen ersten Standort hinzu, um Multi-Standort zu nutzen.
            </p>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Ersten Standort hinzufügen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map(location => (
            <Card key={location.id} className={location.is_primary ? 'border-primary' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {location.name}
                      {location.is_primary && (
                        <Badge variant="default" className="ml-2">
                          <Star className="w-3 h-3 mr-1" />
                          Hauptstandort
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      /{location.slug}
                    </CardDescription>
                  </div>
                  <Badge variant={location.is_active ? 'outline' : 'secondary'}>
                    {location.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address */}
                {(location.address || location.city) && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      {location.address && <p>{location.address}</p>}
                      {(location.postal_code || location.city) && (
                        <p className="text-muted-foreground">
                          {location.postal_code} {location.city}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {location.phone && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {location.phone}
                    </div>
                  )}
                  {location.email && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {location.email}
                    </div>
                  )}
                  {location.whatsapp_number && (
                    <div className="flex items-center gap-1 text-green-600">
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-4 pt-2 border-t">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{location.employee_count}</span>
                    <span className="text-muted-foreground">Mitarbeiter</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{location.service_count}</span>
                    <span className="text-muted-foreground">Services</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(location)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Bearbeiten
                  </Button>
                  {!location.is_primary && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(location.id)}
                        title="Als Hauptstandort festlegen"
                      >
                        <Star className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(location.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Buchungs-URLs</p>
              <p className="text-blue-700 mt-1">
                Jeder Standort hat seine eigene Buchungs-URL:
                <code className="bg-blue-100 px-1 rounded ml-1">/book/[tenant]/[standort]</code>
              </p>
              <p className="text-blue-600 mt-1">
                Services und Mitarbeiter werden pro Standort verwaltet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
