export { cn } from './cn'

/**
 * Format a date to French locale
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format a date to relative time (e.g., "il y a 2 heures")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
  return formatDate(d)
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Convert FDI tooth number to quadrant and position
 */
export function parseFDITooth(tooth: string): { quadrant: number; position: number } | null {
  const num = parseInt(tooth, 10)
  if (isNaN(num) || num < 11 || num > 48) return null

  const quadrant = Math.floor(num / 10)
  const position = num % 10

  if (quadrant < 1 || quadrant > 4 || position < 1 || position > 8) return null

  return { quadrant, position }
}

/**
 * Get tooth name in French
 */
export function getToothName(tooth: string): string {
  const parsed = parseFDITooth(tooth)
  if (!parsed) return tooth

  const positions: Record<number, string> = {
    1: 'Incisive centrale',
    2: 'Incisive latérale',
    3: 'Canine',
    4: 'Première prémolaire',
    5: 'Deuxième prémolaire',
    6: 'Première molaire',
    7: 'Deuxième molaire',
    8: 'Troisième molaire',
  }

  const quadrants: Record<number, string> = {
    1: 'supérieure droite',
    2: 'supérieure gauche',
    3: 'inférieure gauche',
    4: 'inférieure droite',
  }

  return `${positions[parsed.position]} ${quadrants[parsed.quadrant]} (${tooth})`
}
