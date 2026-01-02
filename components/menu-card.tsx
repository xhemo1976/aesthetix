'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  Wheat,
  Milk,
  Egg,
  Fish,
  Shell,
  Leaf,
  Flame,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

// Allergen definitions with icons and labels
const ALLERGEN_INFO: Record<string, { label: string; labelDe: string; icon: React.ReactNode; color: string }> = {
  gluten: { label: 'Gluten', labelDe: 'Gluten', icon: <Wheat className="w-3.5 h-3.5" />, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  lactose: { label: 'Lactose', labelDe: 'Laktose', icon: <Milk className="w-3.5 h-3.5" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  eggs: { label: 'Eggs', labelDe: 'Eier', icon: <Egg className="w-3.5 h-3.5" />, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  nuts: { label: 'Nuts', labelDe: 'Nüsse', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  peanuts: { label: 'Peanuts', labelDe: 'Erdnüsse', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-orange-600/20 text-orange-500 border-orange-600/30' },
  soy: { label: 'Soy', labelDe: 'Soja', icon: <Leaf className="w-3.5 h-3.5" />, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  fish: { label: 'Fish', labelDe: 'Fisch', icon: <Fish className="w-3.5 h-3.5" />, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  shellfish: { label: 'Shellfish', labelDe: 'Schalentiere', icon: <Shell className="w-3.5 h-3.5" />, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  celery: { label: 'Celery', labelDe: 'Sellerie', icon: <Leaf className="w-3.5 h-3.5" />, color: 'bg-lime-500/20 text-lime-400 border-lime-500/30' },
  mustard: { label: 'Mustard', labelDe: 'Senf', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-yellow-600/20 text-yellow-500 border-yellow-600/30' },
  sesame: { label: 'Sesame', labelDe: 'Sesam', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-stone-500/20 text-stone-400 border-stone-500/30' },
  sulfites: { label: 'Sulfites', labelDe: 'Sulfite', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
}

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  image_url?: string | null
  allergens?: string[] | null
  is_vegetarian?: boolean
  is_vegan?: boolean
  is_spicy?: boolean
  category: string | null
}

interface MenuCardProps {
  items: MenuItem[]
  currency?: string
  accentColor?: string
}

// Placeholder image for dishes without photos
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'

// Category images for headers
const CATEGORY_IMAGES: Record<string, string> = {
  'Vorspeisen': 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=1200&h=400&fit=crop',
  'Hauptgerichte': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=400&fit=crop',
  'Desserts': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1200&h=400&fit=crop',
  'Getränke': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=1200&h=400&fit=crop',
  'Specials': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=400&fit=crop',
}

function AllergenBadge({ allergen }: { allergen: string }) {
  const info = ALLERGEN_INFO[allergen]
  if (!info) return null

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
        info.color
      )}
      title={info.labelDe}
    >
      {info.icon}
      <span className="hidden sm:inline">{info.labelDe}</span>
    </span>
  )
}

function DietBadge({ type }: { type: 'vegetarian' | 'vegan' | 'spicy' }) {
  const config = {
    vegetarian: { label: 'Vegetarisch', icon: <Leaf className="w-3 h-3" />, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    vegan: { label: 'Vegan', icon: <Leaf className="w-3 h-3" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    spicy: { label: 'Scharf', icon: <Flame className="w-3 h-3" />, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  }

  const { label, icon, color } = config[type]

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border", color)}>
      {icon}
      {label}
    </span>
  )
}

function MenuItemCard({ item }: { item: MenuItem }) {
  const [imageError, setImageError] = useState(false)
  const hasImage = item.image_url && !imageError

  return (
    <div className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-amber-500/30 rounded-xl overflow-hidden transition-all duration-300">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={hasImage ? item.image_url! : PLACEHOLDER_IMAGE}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-amber-500 text-black px-3 py-1 rounded-full font-bold text-sm">
          €{item.price.toFixed(2)}
        </div>

        {/* Diet Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {item.is_vegan && <DietBadge type="vegan" />}
          {item.is_vegetarian && !item.is_vegan && <DietBadge type="vegetarian" />}
          {item.is_spicy && <DietBadge type="spicy" />}
        </div>

        {/* Title on Image */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-semibold text-white line-clamp-1">{item.name}</h3>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Description */}
        {item.description && (
          <p className="text-white/60 text-sm line-clamp-2 min-h-[2.5rem]">
            {item.description}
          </p>
        )}

        {/* Allergens */}
        {item.allergens && item.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
            {item.allergens.map((allergen) => (
              <AllergenBadge key={allergen} allergen={allergen} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CategorySection({
  category,
  items,
  defaultExpanded = true
}: {
  category: string
  items: MenuItem[]
  defaultExpanded?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const headerImage = CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Hauptgerichte']

  return (
    <div className="mb-12">
      {/* Category Header with Background Image */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full relative h-32 rounded-xl overflow-hidden mb-6 group"
      >
        <Image
          src={headerImage}
          alt={category}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-light tracking-wide text-white">{category}</h2>
            <span className="text-amber-400 text-sm font-medium bg-amber-500/20 px-3 py-1 rounded-full">
              {items.length} {items.length === 1 ? 'Gericht' : 'Gerichte'}
            </span>
          </div>
          <div className="text-white/80 hover:text-white transition-colors">
            {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </div>
        </div>
      </button>

      {/* Items Grid */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

export function MenuCard({ items, currency = '€' }: MenuCardProps) {
  // Group items by category
  const categorizedItems = items.reduce((acc, item) => {
    const category = item.category || 'Sonstiges'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  // Define category order
  const categoryOrder = ['Vorspeisen', 'Hauptgerichte', 'Desserts', 'Getränke', 'Specials', 'Sonstiges']
  const sortedCategories = Object.keys(categorizedItems).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a)
    const indexB = categoryOrder.indexOf(b)
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  return (
    <div className="py-8">
      {/* Allergen Legend */}
      <div className="mb-8 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
        <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Allergen-Hinweise
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ALLERGEN_INFO).map(([key, info]) => (
            <span
              key={key}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                info.color
              )}
            >
              {info.icon}
              {info.labelDe}
            </span>
          ))}
        </div>
      </div>

      {/* Menu Categories */}
      {sortedCategories.map((category, index) => (
        <CategorySection
          key={category}
          category={category}
          items={categorizedItems[category]}
          defaultExpanded={index < 2} // First 2 categories expanded by default
        />
      ))}

      {/* Footer Note */}
      <div className="mt-8 text-center text-white/40 text-sm">
        <p>Alle Preise in Euro inkl. MwSt.</p>
        <p className="mt-1">Fragen Sie unser Personal bei Allergien oder Unverträglichkeiten.</p>
      </div>
    </div>
  )
}
