import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'

export default function BookingNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Klinik nicht gefunden</h1>
        <p className="text-muted-foreground mb-6">
          Diese Buchungsseite existiert nicht oder ist nicht mehr verfügbar.
        </p>
        <Link href="/">
          <Button>Zur Startseite</Button>
        </Link>
      </div>
    </div>
  )
}
