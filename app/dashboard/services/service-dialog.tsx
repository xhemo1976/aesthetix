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

// EU-kennzeichnungspflichtige Allergene
const ALLERGEN_OPTIONS = [
  { value: 'gluten', label: 'Gluten', icon: '🌾' },
  { value: 'lactose', label: 'Laktose', icon: '🥛' },
  { value: 'eggs', label: 'Eier', icon: '🥚' },
  { value: 'nuts', label: 'Nüsse', icon: '🥜' },
  { value: 'peanuts', label: 'Erdnüsse', icon: '🥜' },
  { value: 'soy', label: 'Soja', icon: '🫘' },
  { value: 'fish', label: 'Fisch', icon: '🐟' },
  { value: 'shellfish', label: 'Schalentiere', icon: '🦐' },
  { value: 'crustaceans', label: 'Krebstiere', icon: '🦀' },
  { value: 'molluscs', label: 'Weichtiere', icon: '🦑' },
  { value: 'celery', label: 'Sellerie', icon: '🥬' },
  { value: 'mustard', label: 'Senf', icon: '🟡' },
  { value: 'sesame', label: 'Sesam', icon: '⚪' },
  { value: 'sulfites', label: 'Sulfite', icon: '🍷' },
  { value: 'lupins', label: 'Lupinen', icon: '🌿' },
]

// Diät-/Ernährungsoptionen
const DIET_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarisch', icon: '🥬', color: 'text-green-500' },
  { value: 'vegan', label: 'Vegan', icon: '🌱', color: 'text-emerald-500' },
  { value: 'pescatarian', label: 'Pescetarisch', icon: '🐟', color: 'text-blue-500' },
  { value: 'flexitarian', label: 'Flexitarisch', icon: '🥗', color: 'text-lime-500' },
  { value: 'halal', label: 'Halal', icon: '☪️', color: 'text-green-600' },
  { value: 'kosher', label: 'Koscher', icon: '✡️', color: 'text-blue-600' },
  { value: 'lactose_free', label: 'Laktosefrei', icon: '🥛', color: 'text-sky-500' },
  { value: 'gluten_free', label: 'Glutenfrei', icon: '🌾', color: 'text-amber-500' },
  { value: 'sugar_free', label: 'Zuckerfrei', icon: '🚫', color: 'text-pink-500' },
  { value: 'low_carb', label: 'Low Carb', icon: '📉', color: 'text-orange-500' },
  { value: 'keto', label: 'Keto', icon: '🥑', color: 'text-green-600' },
  { value: 'paleo', label: 'Paleo', icon: '🍖', color: 'text-amber-600' },
]

// Sonstige Kennzeichnungen
const OTHER_LABELS = [
  { value: 'spicy', label: 'Scharf', icon: '🌶️', color: 'text-red-500' },
  { value: 'alcohol', label: 'Alkoholhaltig', icon: '🍷', color: 'text-purple-500' },
  { value: 'caffeine', label: 'Koffeinhaltig', icon: '☕', color: 'text-amber-700' },
  { value: 'additives', label: 'Mit Zusatzstoffen', icon: '⚗️', color: 'text-gray-500' },
  { value: 'colorants', label: 'Mit Farbstoffen', icon: '🎨', color: 'text-pink-500' },
  { value: 'preservatives', label: 'Mit Konservierungsstoffen', icon: '🧪', color: 'text-orange-500' },
  { value: 'flavor_enhancers', label: 'Mit Geschmacksverstärkern', icon: '✨', color: 'text-yellow-500' },
  { value: 'blackened', label: 'Geschwärzt', icon: '⬛', color: 'text-gray-700' },
  { value: 'waxed', label: 'Gewachst', icon: '✨', color: 'text-yellow-400' },
  { value: 'phosphate', label: 'Mit Phosphat', icon: '🔬', color: 'text-blue-400' },
  { value: 'sweeteners', label: 'Mit Süßungsmitteln', icon: '🍬', color: 'text-pink-400' },
]

// Kreuzkontaminations-Hinweise
const CROSS_CONTAMINATION = [
  { value: 'traces_possible', label: 'Spuren von Allergenen möglich', icon: '⚠️' },
  { value: 'no_separate_prep', label: 'Getrennte Zubereitung nicht garantiert', icon: '🍳' },
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
  diet_labels?: string[] | null
  other_labels?: string[] | null
  cross_contamination?: string[] | null
  // Legacy fields (still supported)
  is_vegetarian?: boolean
  is_vegan?: boolean
  is_spicy?: boolean
}

type Category = {
  id: string
  name: string
  image_url: string | null
}

type ServiceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service | null
  businessType?: string
  categories?: Category[]
}

export function ServiceDialog({ open, onOpenChange, service, businessType = 'beauty_clinic', categories = [] }: ServiceDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(service?.image_url || null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(service?.allergens || [])
  const [selectedDietLabels, setSelectedDietLabels] = useState<string[]>(() => {
    // Initialize from new field or migrate from legacy fields
    if (service?.diet_labels?.length) return service.diet_labels
    const legacy: string[] = []
    if (service?.is_vegetarian) legacy.push('vegetarian')
    if (service?.is_vegan) legacy.push('vegan')
    return legacy
  })
  const [selectedOtherLabels, setSelectedOtherLabels] = useState<string[]>(() => {
    if (service?.other_labels?.length) return service.other_labels
    const legacy: string[] = []
    if (service?.is_spicy) legacy.push('spicy')
    return legacy
  })
  const [selectedCrossContamination, setSelectedCrossContamination] = useState<string[]>(service?.cross_contamination || [])
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

  function toggleDietLabel(label: string) {
    setSelectedDietLabels(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    )
  }

  function toggleOtherLabel(label: string) {
    setSelectedOtherLabels(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    )
  }

  function toggleCrossContamination(label: string) {
    setSelectedCrossContamination(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
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
      formData.set('diet_labels', JSON.stringify(selectedDietLabels))
      formData.set('other_labels', JSON.stringify(selectedOtherLabels))
      formData.set('cross_contamination', JSON.stringify(selectedCrossContamination))
      // Legacy fields for backwards compatibility
      formData.set('is_vegetarian', String(selectedDietLabels.includes('vegetarian')))
      formData.set('is_vegan', String(selectedDietLabels.includes('vegan')))
      formData.set('is_spicy', String(selectedOtherLabels.includes('spicy')))

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
            {isGastronomy && categories.length > 0 ? (
              <select
                id="category"
                name="category"
                defaultValue={service?.category || ''}
                disabled={loading}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">-- Kategorie wählen --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="category"
                name="category"
                placeholder={labels.categoryPlaceholder}
                defaultValue={service?.category || ''}
                disabled={loading}
              />
            )}
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
              {/* Diet / Nutrition options */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-500" />
                  Diät & Ernährung
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DIET_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedDietLabels.includes(option.value)
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-input hover:border-green-500/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedDietLabels.includes(option.value)}
                        onCheckedChange={() => toggleDietLabel(option.value)}
                      />
                      <span className="text-sm">{option.icon}</span>
                      <span className="text-xs">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Allergens (EU-compliant) */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Allergene (EU-kennzeichnungspflichtig)
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

              {/* Other Labels */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Sonstige Kennzeichnungen
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {OTHER_LABELS.map((label) => (
                    <label
                      key={label.value}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedOtherLabels.includes(label.value)
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-input hover:border-orange-500/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedOtherLabels.includes(label.value)}
                        onCheckedChange={() => toggleOtherLabel(label.value)}
                      />
                      <span className="text-sm">{label.icon}</span>
                      <span className="text-xs">{label.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cross Contamination Warnings */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Kreuzkontaminations-Hinweise
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {CROSS_CONTAMINATION.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedCrossContamination.includes(option.value)
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-input hover:border-red-500/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedCrossContamination.includes(option.value)}
                        onCheckedChange={() => toggleCrossContamination(option.value)}
                      />
                      <span className="text-sm">{option.icon}</span>
                      <span className="text-sm">{option.label}</span>
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
