// Social Media Utilities

/**
 * Format a date for social media display
 * e.g., "2 Stunden", "3 Tage", "vor 1 Woche"
 */
export function formatSocialDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const diffWeeks = Math.floor(diffDays / 7)

  if (diffMins < 1) return 'Gerade eben'
  if (diffMins < 60) return `vor ${diffMins} Min`
  if (diffHours < 24) return `vor ${diffHours} Std`
  if (diffDays < 7) return `vor ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tagen'}`
  if (diffWeeks < 4) return `vor ${diffWeeks} ${diffWeeks === 1 ? 'Woche' : 'Wochen'}`

  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3).trim() + '...'
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024F]+/g)
  return matches ? matches.map(tag => tag.toLowerCase()) : []
}

/**
 * Format number for display (1.2k, 3.4M, etc.)
 */
export function formatCount(count: number): string {
  if (count < 1000) return count.toString()
  if (count < 1000000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
}
