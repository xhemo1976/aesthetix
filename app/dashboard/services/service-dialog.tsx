'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createService, updateService } from '@/lib/actions/services'
import { useRouter } from 'next/navigation'

type Service = {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number
  duration_minutes: number
}

type ServiceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service | null
}

export function ServiceDialog({ open, onOpenChange, service }: ServiceDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!service

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = isEditing
      ? await updateService(service.id, formData)
      : await createService(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setLoading(false)
      onOpenChange(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Behandlung bearbeiten' : 'Neue Behandlung'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Aktualisiere die Details der Behandlung'
              : 'Füge eine neue Behandlung hinzu'}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name der Behandlung *</Label>
            <Input
              id="name"
              name="name"
              placeholder="z.B. Gesichtsbehandlung"
              defaultValue={service?.name || ''}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <textarea
              id="description"
              name="description"
              placeholder="Kurze Beschreibung der Behandlung..."
              defaultValue={service?.description || ''}
              disabled={loading}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Input
              id="category"
              name="category"
              placeholder="z.B. Gesicht, Körper, Massage"
              defaultValue={service?.category || ''}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preis (€) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="89.00"
                defaultValue={service?.price || ''}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Dauer (Min) *</Label>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min="5"
                step="5"
                placeholder="60"
                defaultValue={service?.duration_minutes || ''}
                required
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Wird gespeichert...' : isEditing ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
