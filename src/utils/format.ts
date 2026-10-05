export function formatCurrency(
  value: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  if (!Number.isFinite(value)) value = 0
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return new Intl.NumberFormat('en-US').format(value)
}

export function parseDate(value: string | Date | undefined | null): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDate(
  value: string | Date | undefined | null,
  fallback = '—',
): string {
  const date = parseDate(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(
  value: string | Date | undefined | null,
  fallback = '—',
): string {
  const date = parseDate(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatRelativeTime(value: string | Date | undefined | null): string {
  const date = parseDate(value)
  if (!date) return '—'
  const diff = Date.now() - date.getTime()
  const seconds = Math.round(diff / 1000)
  const minutes = Math.round(seconds / 60)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)
  if (Math.abs(seconds) < 60) return 'just now'
  if (Math.abs(minutes) < 60) return `${minutes}m ago`
  if (Math.abs(hours) < 24) return `${hours}h ago`
  if (Math.abs(days) < 30) return `${days}d ago`
  return formatDate(date)
}

export function toInputDate(value: string | Date = new Date()): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function truncate(value: string, max = 60): string {
  if (!value) return ''
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}
