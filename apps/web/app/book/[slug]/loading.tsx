import { Loader2 } from 'lucide-react'

export default function BookingLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Wird geladen...</p>
      </div>
    </div>
  )
}
