'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Clock, Euro, Leaf, Flame, AlertTriangle, Download, Upload } from 'lucide-react'
import { ServiceDialog } from './service-dialog'
import { deleteService, toggleServiceStatus, exportServices, importServices } from '@/lib/actions/services'
import { useRouter } from 'next/navigation'

type Service = {
  id: string
  name: string
  description: string | null
  category: string | null
  category_image_url?: string | null
  price: number
  duration_minutes: number
  is_active: boolean
  image_url?: string | null
  allergens?: string[] | null
  diet_labels?: string[] | null
  other_labels?: string[] | null
  cross_contamination?: string[] | null
  is_vegetarian?: boolean
  is_vegan?: boolean
  is_spicy?: boolean
}

type ServicesListProps = {
  initialServices: Service[]
  businessType?: string
}

// Allergen labels
const ALLERGEN_LABELS: Record<string, string> = {
  gluten: 'Gluten',
  lactose: 'Laktose',
  eggs: 'Eier',
  nuts: 'Nüsse',
  peanuts: 'Erdnüsse',
  soy: 'Soja',
  fish: 'Fisch',
  shellfish: 'Schalentiere',
  celery: 'Sellerie',
  mustard: 'Senf',
  sesame: 'Sesam',
  sulfites: 'Sulfite',
}

export function ServicesList({ initialServices, businessType = 'beauty_clinic' }: ServicesListProps) {
  const [services, setServices] = useState(initialServices)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const isGastronomy = businessType === 'gastronomy'

  // Labels based on business type
  const labels = isGastronomy
    ? {
        item: 'Gericht',
        items: 'Gerichte',
        newItem: 'Neues Gericht',
        firstItem: 'Erstes Gericht erstellen',
        noItems: 'Noch keine Gerichte angelegt',
        deleteConfirm: 'Möchtest du dieses Gericht wirklich löschen?',
      }
    : {
        item: 'Behandlung',
        items: 'Behandlungen',
        newItem: 'Neue Behandlung',
        firstItem: 'Erste Behandlung erstellen',
        noItems: 'Noch keine Behandlungen angelegt',
        deleteConfirm: 'Möchtest du diese Behandlung wirklich löschen?',
      }

  async function handleDelete(id: string) {
    if (!confirm(labels.deleteConfirm)) return

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

  async function handleExport() {
    setExporting(true)
    try {
      const result = await exportServices()
      if (result.error) {
        alert('Fehler beim Export: ' + result.error)
        return
      }

      // CSV Headers
      const headers = ['Name', 'Beschreibung', 'Kategorie', 'Preis', 'Dauer (Min)', 'Aktiv', 'Vegetarisch', 'Vegan', 'Scharf', 'Allergene']

      // Convert services to CSV rows
      const rows = result.services.map((s: Record<string, unknown>) => [
        escapeCsvField(s.name as string || ''),
        escapeCsvField(s.description as string || ''),
        escapeCsvField(s.category as string || ''),
        s.price,
        s.duration_minutes,
        s.is_active ? 'Ja' : 'Nein',
        s.is_vegetarian ? 'Ja' : 'Nein',
        s.is_vegan ? 'Ja' : 'Nein',
        s.is_spicy ? 'Ja' : 'Nein',
        escapeCsvField((s.allergens as string[] || []).join(', ')),
      ])

      // Build CSV content with BOM for Excel UTF-8 support
      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${isGastronomy ? 'speisekarte' : 'behandlungen'}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Fehler beim Export')
    } finally {
      setExporting(false)
    }
  }

  // Helper to escape CSV fields
  function escapeCsvField(field: string): string {
    if (field.includes(';') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()

      // Parse CSV
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length < 2) {
        alert('Die CSV-Datei muss mindestens eine Kopfzeile und eine Datenzeile enthalten')
        return
      }

      // Skip header row, parse data rows
      const data = lines.slice(1).map(line => {
        const values = parseCsvLine(line)
        return {
          name: values[0]?.trim() || '',
          description: values[1]?.trim() || '',
          category: values[2]?.trim() || '',
          price: parseFloat(values[3]?.replace(',', '.') || '0'),
          duration_minutes: parseInt(values[4] || '0') || 15,
          is_active: values[5]?.toLowerCase() !== 'nein',
          is_vegetarian: values[6]?.toLowerCase() === 'ja',
          is_vegan: values[7]?.toLowerCase() === 'ja',
          is_spicy: values[8]?.toLowerCase() === 'ja',
          allergens: values[9] ? values[9].split(',').map(a => a.trim().toLowerCase()).filter(Boolean) : [],
        }
      }).filter(item => item.name) // Filter empty rows

      const result = await importServices(data)

      if (result.error) {
        alert(`Import abgeschlossen mit Fehlern:\n${result.imported} von ${result.total} importiert\n\n${result.error}`)
      } else {
        alert(`Import erfolgreich: ${result.imported} ${isGastronomy ? 'Gerichte' : 'Behandlungen'} importiert`)
      }

      // Refresh the page to show new services
      router.refresh()
    } catch (error) {
      console.error('Import error:', error)
      alert('Fehler beim Lesen der Datei. Stelle sicher, dass es eine gültige CSV-Datei ist.')
    } finally {
      setImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Helper to parse CSV line (handles quoted fields with semicolons)
  function parseCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ';' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-muted-foreground">
          {services.length} {services.length !== 1 ? labels.items : labels.item}
        </div>
        <div className="flex gap-2">
          {/* Hidden file input for import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="w-4 h-4 mr-2" />
            {importing ? 'Importiert...' : 'Import'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || services.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exportiert...' : 'Export'}
          </Button>

          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            {labels.newItem}
          </Button>
        </div>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="mb-4">{labels.noItems}</p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                {labels.firstItem}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
              {/* Image for Gastronomy */}
              {isGastronomy && service.image_url && (
                <div className="relative h-32 w-full">
                  <Image
                    src={service.image_url}
                    alt={service.name}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                </div>
              )}

              <CardHeader className={isGastronomy && service.image_url ? 'pt-3' : ''}>
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
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {service.description}
                  </p>
                )}

                {/* Diet badges for Gastronomy */}
                {isGastronomy && (service.is_vegetarian || service.is_vegan || service.is_spicy) && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {service.is_vegan && (
                      <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
                        <Leaf className="w-3 h-3 mr-1" />
                        Vegan
                      </Badge>
                    )}
                    {service.is_vegetarian && !service.is_vegan && (
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                        <Leaf className="w-3 h-3 mr-1" />
                        Vegetarisch
                      </Badge>
                    )}
                    {service.is_spicy && (
                      <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-600">
                        <Flame className="w-3 h-3 mr-1" />
                        Scharf
                      </Badge>
                    )}
                  </div>
                )}

                {/* Allergens for Gastronomy */}
                {isGastronomy && service.allergens && service.allergens.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    <AlertTriangle className="w-3 h-3 text-amber-500 mr-1" />
                    {service.allergens.map((allergen) => (
                      <Badge key={allergen} variant="outline" className="text-xs">
                        {ALLERGEN_LABELS[allergen] || allergen}
                      </Badge>
                    ))}
                  </div>
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
        businessType={businessType}
      />
    </div>
  )
}
