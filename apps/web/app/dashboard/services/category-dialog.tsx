'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCategory, updateCategory, uploadCategoryImage, type Category } from '@/lib/actions/categories'
import { useRouter } from 'next/navigation'
import { Upload, X, FolderOpen } from 'lucide-react'
import imageCompression from 'browser-image-compression'

type CategoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  existingCount?: number
}

export function CategoryDialog({ open, onOpenChange, category, existingCount = 0 }: CategoryDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(category?.image_url || null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!category

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Compress image
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
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

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    try {
      // Upload image if there's a new one
      let imageUrl = category?.image_url || null
      if (imageFile) {
        const uploadResult = await uploadCategoryImage(imageFile)
        if (uploadResult.error) {
          throw new Error(uploadResult.error)
        }
        imageUrl = uploadResult.url
      } else if (!imagePreview && category?.image_url) {
        // Image was removed
        imageUrl = null
      }

      formData.set('image_url', imageUrl || '')

      // Set sort_order for new categories
      if (!isEditing) {
        formData.set('sort_order', String(existingCount))
      }

      const result = isEditing
        ? await updateCategory(category.id, formData)
        : await createCategory(formData)

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            {isEditing ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Aktualisiere die Kategorie-Details' : 'Erstelle eine neue Warengruppe für deine Speisekarte'}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Kategorie-Bild</Label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative w-40 h-28 rounded-lg overflow-hidden border">
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
                  className="w-40 h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
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
                <p>Empfohlen: 1200x400px</p>
                <p>Max. 5MB, wird komprimiert</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name der Kategorie *</Label>
            <Input
              id="name"
              name="name"
              placeholder="z.B. Vorspeisen, Hauptgerichte, Desserts"
              defaultValue={category?.name || ''}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <textarea
              id="description"
              name="description"
              placeholder="Kurze Beschreibung der Kategorie..."
              defaultValue={category?.description || ''}
              disabled={loading}
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="sort_order">Reihenfolge</Label>
              <Input
                id="sort_order"
                name="sort_order"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={category?.sort_order || 0}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Niedrigere Zahlen werden zuerst angezeigt
              </p>
            </div>
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
