export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (!rows.length) return ''
  const headers = columns ?? Object.keys(rows[0])
  const escape = (value: unknown) => {
    if (value == null) return ''
    const str = String(value)
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
    return str
  }
  const headerLine = headers.map(escape).join(',')
  const body = rows.map((row) => headers.map((header) => escape(row[header])).join(','))
  return [headerLine, ...body].join('\n')
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(filename, blob)
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function buildFilename(base: string, extension: string): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return `${base}-${stamp}.${extension}`
}
