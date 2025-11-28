/**
 * FDI (Fédération Dentaire Internationale) Tooth Notation System
 * Used internationally (except USA which uses Universal system)
 *
 * Quadrants:
 * 1 = Upper Right (patient's right)
 * 2 = Upper Left (patient's left)
 * 3 = Lower Left (patient's left)
 * 4 = Lower Right (patient's right)
 *
 * Teeth (1-8 from midline):
 * 1 = Central incisor
 * 2 = Lateral incisor
 * 3 = Canine
 * 4 = First premolar
 * 5 = Second premolar
 * 6 = First molar
 * 7 = Second molar
 * 8 = Third molar (wisdom tooth)
 */

export const QUADRANTS = {
  1: { name: 'Maxillaire droit', nameShort: 'Max. D', position: 'upper-right' },
  2: { name: 'Maxillaire gauche', nameShort: 'Max. G', position: 'upper-left' },
  3: { name: 'Mandibulaire gauche', nameShort: 'Mand. G', position: 'lower-left' },
  4: { name: 'Mandibulaire droit', nameShort: 'Mand. D', position: 'lower-right' },
} as const

export const TOOTH_NAMES: Record<number, { name: string; nameShort: string }> = {
  1: { name: 'Incisive centrale', nameShort: 'IC' },
  2: { name: 'Incisive latérale', nameShort: 'IL' },
  3: { name: 'Canine', nameShort: 'C' },
  4: { name: 'Première prémolaire', nameShort: 'PM1' },
  5: { name: 'Deuxième prémolaire', nameShort: 'PM2' },
  6: { name: 'Première molaire', nameShort: 'M1' },
  7: { name: 'Deuxième molaire', nameShort: 'M2' },
  8: { name: 'Troisième molaire', nameShort: 'M3' },
}

// All permanent teeth in FDI notation
export const ALL_TEETH = [
  // Upper right (quadrant 1) - from patient's perspective
  '18', '17', '16', '15', '14', '13', '12', '11',
  // Upper left (quadrant 2)
  '21', '22', '23', '24', '25', '26', '27', '28',
  // Lower left (quadrant 3)
  '38', '37', '36', '35', '34', '33', '32', '31',
  // Lower right (quadrant 4)
  '41', '42', '43', '44', '45', '46', '47', '48',
] as const

// Quadrant teeth arrays for visual display
// Upper right (Q1) - displayed right to left (from midline out): 18 to 11
export const UPPER_RIGHT = ['18', '17', '16', '15', '14', '13', '12', '11'] as const
// Upper left (Q2) - displayed left to right (from midline out): 21 to 28
export const UPPER_LEFT = ['21', '22', '23', '24', '25', '26', '27', '28'] as const
// Lower left (Q3) - displayed left to right (from midline out): 31 to 38
export const LOWER_LEFT = ['31', '32', '33', '34', '35', '36', '37', '38'] as const
// Lower right (Q4) - displayed right to left (from midline out): 41 to 48
export const LOWER_RIGHT = ['41', '42', '43', '44', '45', '46', '47', '48'] as const

// Upper arch teeth (for display)
export const UPPER_TEETH = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28',
] as const

// Lower arch teeth (for display)
export const LOWER_TEETH = [
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38',
] as const

// Tooth surfaces
export const SURFACES = {
  M: { name: 'Mésiale', nameShort: 'M' },
  D: { name: 'Distale', nameShort: 'D' },
  O: { name: 'Occlusale', nameShort: 'O' },
  B: { name: 'Buccale/Vestibulaire', nameShort: 'B' },
  L: { name: 'Linguale', nameShort: 'L' },
  P: { name: 'Palatine', nameShort: 'P' },
  I: { name: 'Incisale', nameShort: 'I' },
} as const

export type ToothNumber = (typeof ALL_TEETH)[number]
export type Surface = keyof typeof SURFACES

/**
 * Get the full name of a tooth in French
 */
export function getToothFullName(tooth: string): string {
  const quadrant = parseInt(tooth[0])
  const position = parseInt(tooth[1])

  if (!QUADRANTS[quadrant as keyof typeof QUADRANTS] || !TOOTH_NAMES[position]) {
    return tooth
  }

  const quadrantName = QUADRANTS[quadrant as keyof typeof QUADRANTS].name
  const toothName = TOOTH_NAMES[position].name

  return `${toothName} ${quadrantName.toLowerCase()} (${tooth})`
}

/**
 * Get short name of a tooth
 */
export function getToothShortName(tooth: string): string {
  const quadrant = parseInt(tooth[0])
  const position = parseInt(tooth[1])

  if (!QUADRANTS[quadrant as keyof typeof QUADRANTS] || !TOOTH_NAMES[position]) {
    return tooth
  }

  return `${TOOTH_NAMES[position].nameShort} ${QUADRANTS[quadrant as keyof typeof QUADRANTS].nameShort}`
}

/**
 * Check if a tooth number is valid FDI notation
 */
export function isValidFDI(tooth: string): boolean {
  if (tooth.length !== 2) return false
  const quadrant = parseInt(tooth[0])
  const position = parseInt(tooth[1])
  return quadrant >= 1 && quadrant <= 4 && position >= 1 && position <= 8
}

/**
 * Get quadrant from tooth number
 */
export function getQuadrant(tooth: string): number {
  return parseInt(tooth[0])
}

/**
 * Check if tooth is in upper arch
 */
export function isUpperTooth(tooth: string): boolean {
  const quadrant = getQuadrant(tooth)
  return quadrant === 1 || quadrant === 2
}

/**
 * Check if tooth is in lower arch
 */
export function isLowerTooth(tooth: string): boolean {
  const quadrant = getQuadrant(tooth)
  return quadrant === 3 || quadrant === 4
}

/**
 * Get the opposite tooth (e.g., 16 -> 26)
 */
export function getOppositeTooth(tooth: string): string {
  const quadrant = parseInt(tooth[0])
  const position = tooth[1]

  const oppositeQuadrant: Record<number, number> = {
    1: 2,
    2: 1,
    3: 4,
    4: 3,
  }

  return `${oppositeQuadrant[quadrant]}${position}`
}

/**
 * Get the antagonist tooth (e.g., 16 -> 46)
 */
export function getAntagonistTooth(tooth: string): string {
  const quadrant = parseInt(tooth[0])
  const position = tooth[1]

  const antagonistQuadrant: Record<number, number> = {
    1: 4,
    2: 3,
    3: 2,
    4: 1,
  }

  return `${antagonistQuadrant[quadrant]}${position}`
}
