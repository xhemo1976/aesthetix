/**
 * Simple toast hook
 * Shows native browser alerts for now
 * Can be replaced with a proper toast library later
 */

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const toast = (options: ToastOptions) => {
    const message = options.description
      ? `${options.title}\n\n${options.description}`
      : options.title

    if (options.variant === 'destructive') {
      alert(`❌ ${message}`)
    } else {
      alert(`✓ ${message}`)
    }
  }

  return { toast }
}
