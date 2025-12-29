import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLocations } from '@/lib/actions/locations'
import { LocationsList } from './locations-list'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

export default async function LocationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { locations, error } = await getLocations()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <MapPin className="w-8 h-8 text-primary" />
          Standorte
        </h2>
        <p className="text-muted-foreground">
          Verwalte deine Filialstandorte
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-8 text-center text-red-600">
            Fehler beim Laden: {error}
          </CardContent>
        </Card>
      ) : (
        <LocationsList initialLocations={locations} />
      )}
    </div>
  )
}
