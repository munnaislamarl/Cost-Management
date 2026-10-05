import { RECORD_ID_PREFIX } from './constants'

export function generateRecordId(sequence?: number): string {
  const now = new Date()
  const stamp = [
    now.getFullYear().toString().slice(2),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  const seq = sequence != null ? String(sequence).padStart(4, '0') : String(rand)
  return `${RECORD_ID_PREFIX}-${stamp}-${seq}`
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Builds an employee ID from a person's name, e.g. "Md. Munna Islam" → "MMI-0001".
 * The numeric suffix is one higher than any existing ID passed in `existingIds`.
 */
export function buildEmployeeId(name: string, existingIds: string[]): string {
  const initials = name
    .replace(/[^A-Za-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
  const prefix = initials || 'EMP'

  let max = 0
  for (const id of existingIds) {
    const match = String(id).match(/(\d+)\s*$/)
    if (match) max = Math.max(max, parseInt(match[1], 10))
  }
  return `${prefix}-${String(max + 1).padStart(4, '0')}`
}
