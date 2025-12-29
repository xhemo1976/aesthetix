'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Phone, ChevronRight } from 'lucide-react'
import type { Database } from '@/lib/types/database'

type Location = Database['public']['Tables']['locations']['Row']

type LocationSelectorProps = {
  locations: Location[]
  tenantSlug: string
}

export function LocationSelector({ locations, tenantSlug }: LocationSelectorProps) {
  return (
    <div className="space-y-4">
      {locations.map(location => (
        <Link
          key={location.id}
          href={`/book/${tenantSlug}/${location.slug}`}
        >
          <Card className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {location.name}
                  </h3>

                  {(location.address || location.city) && (
                    <p className="text-muted-foreground mt-2">
                      {location.address}
                      {location.address && location.city && ', '}
                      {location.postal_code} {location.city}
                    </p>
                  )}

                  {location.phone && (
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {location.phone}
                    </p>
                  )}
                </div>

                <ChevronRight className="w-6 h-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
