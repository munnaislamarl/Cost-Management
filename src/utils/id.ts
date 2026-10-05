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
