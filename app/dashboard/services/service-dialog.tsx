'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { createService, updateService, uploadServiceImage } from '@/lib/actions/services'
import { useRouter } from 'next/navigation'
import { Upload, X, Leaf, Flame, AlertTriangle } from 'lucide-react'
import imageCompression from 'browser-image-compression'

// Allergen options
const ALLERGEN_OPTIONS = [
  { value: 'gluten', label: 'Gluten', icon: '🌾' },
  { value: 'lactose', label: 'Laktose', icon: '🥛' },
  { value: 'eggs', label: 'Eier', icon: '🥚' },
  { value: 'nuts', label: 'Nüsse', icon: '🥜' },
  { value: 'peanuts', label: 'Erdnüsse', icon: '🥜' },
  { value: 'soy', label: 'Soja', icon: '🫘' },
  { value: 'fish', label: 'Fisch', icon: '🐟' },
  { value: 'shellfish', label: 'Schalentiere', icon: '🦐' },
  { value: 'celery', label: 'Sellerie', icon: '🥬' },
  { value: 'mustard', label: 'Senf', icon: '🟡' },
  { value: 'sesame', label: 'Sesam', icon: '⚪' },
  { value: 'sulfites', label: 'Sulfite', icon: '🍷' },
]

type Service = {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number
  duration_minutes: number
  image_url?: string | null
  allergens?: string[] | null
  is_vegetarian?: boolean
  is_vegan?: boolean
  is_spicy?: boolean
}

type ServiceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service | null
  businessType?: string
}

export function ServiceDialog({ open, onOpenChange, service, businessType = 'beauty_clinic' }: ServiceDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(service?.image_url || null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(service?.allergens || [])
  const [isVegetarian, setIsVegetarian] = useState(service?.is_vegetarian || false)
  const [isVegan, setIsVegan] = useState(service?.is_vegan || false)
  const [isSpicy, setIsSpicy] = useState(service?.is_spicy || false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!service
  const isGastronomy = businessType === 'gastronomy'

  // Labels based on business type
  const labels = isGastronomy
    ? {
        title: isEditing ? 'Gericht bearbeiten' : 'Neues Gericht',
        description: isEditing ? 'Aktualisiere die Details des Gerichts' : 'Füge ein neues Gericht zur Speisekarte hinzu',
        name: 'Name des Gerichts',
        namePlaceholder: 'z.B. Wiener Schnitzel',
        descriptionLabel: 'Beschreibung',
        descriptionPlaceholder: 'Zutaten und Zubereitung...',
        category: 'Kategorie / Warengruppe',
        categoryPlaceholder: 'z.B. Vorspeisen, Hauptgerichte, Desserts',
        duration: 'Zubereitungszeit (Min)',
      }
    : {
        title: isEditing ? 'Behandlung bearbeiten' : 'Neue Behandlung',
        description: isEditing ? 'Aktualisiere die Details der Behandlung' : 'Füge eine neue Behandlung hinzu',
        name: 'Name der Behandlung',
        namePlaceholder: 'z.B. Gesichtsbehandlung',
        descriptionLabel: 'Beschreibung',
        descriptionPlaceholder: 'Kurze Beschreibung der Behandlung...',
        category: 'Kategorie',
        categoryPlaceholder: 'z.B. Gesicht, Körper, Massage',
        duration: 'Dauer (Min)',
      }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Compress image
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      }
      const compressedFile = await imageCompression(file, options)
      setImageFile(compressedFile)

      // Preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)
    } catch (err) {
      console.error('Error compressing image:', err)
      setError('Fehler beim Verarbeiten des Bildes')
    }
  }

  function removeImage() {
    setImagePreview(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function toggleAllergen(allergen: string) {
    setSelectedAllergens(prev =>
      prev.includes(allergen)
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    )
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    try {
      // Upload image if there's a new one
      let imageUrl = service?.image_url || null
      if (imageFile) {
        const uploadResult = await uploadServiceImage(imageFile)
        if (uploadResult.error) {
          throw new Error(uploadResult.error)
        }
        imageUrl = uploadResult.url
      } else if (!imagePreview && service?.image_url) {
        // Image was removed
        imageUrl = null
      }

      // Add extra fields to formData
      formData.set('image_url', imageUrl || '')
      formData.set('allergens', JSON.stringify(selectedAllergens))
      formData.set('is_vegetarian', String(isVegetarian))
      formData.set('is_vegan', String(isVegan))
      formData.set('is_spicy', String(isSpicy))

      const result = isEditing
        ? await updateService(service.id, formData)
        : await createService(formData)

      if (result.error) {
        throw new Error(result.error)
      }

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isGastronomy ? 'max-w-2xl max-h-[90vh] overflow-y-auto' : ''}>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Image Upload - Only for Gastronomy */}
          {isGastronomy && (
            <div className="space-y-2">
              <Label>Bild des Gerichts</Label>
              <div className="flex items-start gap-4">
                {imagePreview ? (
                  <div className="relative w-32 h-24 rounded-lg overflow-hidden border">
                    <Image
                      src={imagePreview}
                      alt="Vorschau"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-xs">Bild wählen</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="text-xs text-muted-foreground">
                  <p>JPG, PNG oder WebP</p>
                  <p>Max. 5MB, wird komprimiert</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{labels.name} *</Label>
            <Input
              id="name"
              name="name"
              placeholder={labels.namePlaceholder}
              defaultValue={service?.name || ''}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{labels.descriptionLabel}</Label>
            <textarea
              id="description"
              name="description"
              placeholder={labels.descriptionPlaceholder}
              defaultValue={service?.description || ''}
              disabled={loading}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{labels.category}</Label>
            <Input
              id="category"
              name="category"
              placeholder={labels.categoryPlaceholder}
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
              <Label htmlFor="duration_minutes">{labels.duration} *</Label>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min="1"
                step="1"
                placeholder={isGastronomy ? '20' : '60'}
                defaultValue={service?.duration_minutes || ''}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Gastronomy-specific fields */}
          {isGastronomy && (
            <>
              {/* Diet options */}
              <div className="space-y-3">
                <Label>Diät-Optionen</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={isVegetarian}
                      onCheckedChange={(checked) => setIsVegetarian(checked as boolean)}
                    />
                    <Leaf className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Vegetarisch</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={isVegan}
                      onCheckedChange={(checked) => setIsVegan(checked as boolean)}
                    />
                    <Leaf className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm">Vegan</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={isSpicy}
                      onCheckedChange={(checked) => setIsSpicy(checked as boolean)}
                    />
                    <Flame className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Scharf</span>
                  </label>
                </div>
              </div>

              {/* Allergens */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Allergene
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {ALLERGEN_OPTIONS.map((allergen) => (
                    <label
                      key={allergen.value}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedAllergens.includes(allergen.value)
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-input hover:border-amber-500/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedAllergens.includes(allergen.value)}
                        onCheckedChange={() => toggleAllergen(allergen.value)}
                      />
                      <span className="text-sm">{allergen.icon}</span>
                      <span className="text-xs">{allergen.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

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
