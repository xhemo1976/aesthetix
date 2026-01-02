'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, FolderOpen, GripVertical, ImageIcon } from 'lucide-react'
import { CategoryDialog } from './category-dialog'
import { deleteCategory, toggleCategoryStatus, type Category } from '@/lib/actions/categories'

type CategoriesListProps = {
  initialCategories: Category[]
}

export function CategoriesList({ initialCategories }: CategoriesListProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Möchtest du diese Kategorie wirklich löschen? Gerichte in dieser Kategorie werden keiner Kategorie mehr zugeordnet.')) return

    const result = await deleteCategory(id)
    if (!result.error) {
      setCategories(categories.filter(c => c.id !== id))
    }
  }

  async function handleToggleStatus(id: string, isActive: boolean) {
    await toggleCategoryStatus(id, isActive)
    setCategories(categories.map(c =>
      c.id === id ? { ...c, is_active: !isActive } : c
    ))
  }

  function handleEdit(category: Category) {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditingCategory(null)
    setDialogOpen(true)
  }

  function handleDialogClose() {
    setDialogOpen(false)
    setEditingCategory(null)
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Warengruppen
          </h2>
          <p className="text-sm text-muted-foreground">
            Organisiere deine Speisekarte in Kategorien
          </p>
        </div>
        <Button onClick={handleCreate} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Neue Kategorie
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">Noch keine Kategorien angelegt</p>
              <Button onClick={handleCreate} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Erste Kategorie erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {categories.map((category) => (
            <Card
              key={category.id}
              className={`group relative overflow-hidden ${!category.is_active ? 'opacity-60' : ''}`}
            >
              {/* Category Image */}
              <div className="relative h-24 bg-muted">
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}

                {/* Action buttons overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>

                {/* Status badge */}
                {!category.is_active && (
                  <Badge variant="secondary" className="absolute top-1 right-1 text-xs">
                    Inaktiv
                  </Badge>
                )}
              </div>

              {/* Category Info */}
              <CardContent className="p-3">
                <h3 className="font-medium text-sm truncate">{category.name}</h3>
                {category.description && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {category.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        category={editingCategory}
        existingCount={categories.length}
      />
    </div>
  )
}
