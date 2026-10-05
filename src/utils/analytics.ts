import type {
  AppUser,
  CostRecord,
  DashboardStats,
  MonthCostBreakdown,
  MonthlyCost,
  MonthSummary,
  PurposeSummary,
  ReportData,
} from '@/types'

export function round2(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100
}

const FULL_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function monthKey(date: string | Date): string {
  const parsed = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(date: string | Date): string {
  const parsed = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  return `${FULL_MONTHS[parsed.getMonth()]}-${parsed.getFullYear()}`
}

export function shortMonthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  if (!year || !month) return key
  return `${SHORT_MONTHS[month - 1]} ${String(year).slice(2)}`
}

export function sumCost(records: CostRecord[]): number {
  return round2(records.reduce((total, record) => total + (Number(record.costAmount) || 0), 0))
}

/** Month label derived from the record date (safe even if the sheet's MONTH
 * column was parsed as a date by Google Sheets). */
export function recordMonth(record: CostRecord): string {
  return monthLabel(record.date)
}

export function computeStats(records: CostRecord[], users: AppUser[] = []): DashboardStats {
  const total = sumCost(records)
  const nowKey = monthKey(new Date())
  const monthRecords = records.filter((record) => monthKey(record.date) === nowKey)
  const purposes = computePurposeSummary(records)
  const top = purposes[0]
  const largest = records.reduce(
    (max, record) => Math.max(max, Number(record.costAmount) || 0),
    0,
  )

  return {
    totalCost: total,
    monthCost: sumCost(monthRecords),
    totalEntries: records.length,
    averageCost: records.length ? round2(total / records.length) : 0,
    largestEntry: round2(largest),
    topPurpose: top?.purpose ?? '—',
    topPurposeCost: top?.cost ?? 0,
    activeUsers: users.filter((user) => user.active).length,
  }
}

export function computeMonthly(records: CostRecord[]): MonthlyCost[] {
  const buckets = new Map<string, MonthlyCost>()
  const now = new Date()

  for (let index = 11; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const key = monthKey(date)
    buckets.set(key, {
      month: shortMonthLabel(key),
      monthKey: key,
      entries: 0,
      cost: 0,
      cumulative: 0,
    })
  }

  for (const record of records) {
    const key = monthKey(record.date)
    const entry = buckets.get(key)
    if (entry) {
      entry.entries += 1
      entry.cost = round2(entry.cost + (Number(record.costAmount) || 0))
    }
  }

  let running = 0
  return Array.from(buckets.values()).map((entry) => {
    running = round2(running + entry.cost)
    return { ...entry, cumulative: running }
  })
}

export function computePurposeSummary(records: CostRecord[]): PurposeSummary[] {
  const map = new Map<string, PurposeSummary>()
  const total = sumCost(records)

  for (const record of records) {
    const purpose = record.costingPurpose || 'Uncategorised'
    const entry = map.get(purpose) ?? { purpose, entries: 0, cost: 0, share: 0 }
    entry.entries += 1
    entry.cost = round2(entry.cost + (Number(record.costAmount) || 0))
    map.set(purpose, entry)
  }

  return Array.from(map.values())
    .map((entry) => ({
      ...entry,
      share: total > 0 ? Math.round((entry.cost / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.cost - a.cost)
}

export function computeMonthSummary(records: CostRecord[]): MonthSummary[] {
  const map = new Map<string, MonthSummary>()
  for (const record of records) {
    const key = monthKey(record.date)
    if (!key) continue
    const entry = map.get(key) ?? { month: monthLabel(record.date), entries: 0, cost: 0 }
    entry.entries += 1
    entry.cost = round2(entry.cost + (Number(record.costAmount) || 0))
    map.set(key, entry)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, value]) => value)
}

export function computeMonthBreakdown(records: CostRecord[]): MonthCostBreakdown[] {
  const map = new Map<
    string,
    { month: string; monthKey: string; totalCost: number; purposes: Map<string, PurposeSummary> }
  >()

  for (const record of records) {
    const key = monthKey(record.date)
    if (!key) continue
    let entry = map.get(key)
    if (!entry) {
      entry = {
        month: monthLabel(record.date),
        monthKey: key,
        totalCost: 0,
        purposes: new Map(),
      }
      map.set(key, entry)
    }
    const purpose = record.costingPurpose || 'Uncategorised'
    const amount = Number(record.costAmount) || 0
    const purposeEntry = entry.purposes.get(purpose) ?? {
      purpose,
      entries: 0,
      cost: 0,
      share: 0,
    }
    purposeEntry.entries += 1
    purposeEntry.cost = round2(purposeEntry.cost + amount)
    entry.purposes.set(purpose, purposeEntry)
    entry.totalCost = round2(entry.totalCost + amount)
  }

  return Array.from(map.values())
    .map((entry) => ({
      month: entry.month,
      monthKey: entry.monthKey,
      totalCost: entry.totalCost,
      purposes: Array.from(entry.purposes.values())
        .map((purpose) => ({
          ...purpose,
          share:
            entry.totalCost > 0
              ? Math.round((purpose.cost / entry.totalCost) * 1000) / 10
              : 0,
        }))
        .sort((a, b) => b.cost - a.cost),
    }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

export function computeReportData(records: CostRecord[], users: AppUser[] = []): ReportData {
  return {
    summary: computeStats(records, users),
    monthly: computeMonthly(records),
    purposes: computePurposeSummary(records),
    months: computeMonthSummary(records),
    byMonth: computeMonthBreakdown(records),
  }
}

export function applyRecordFilter(
  records: CostRecord[],
  filter: { purpose?: string; month?: string; from?: string; to?: string },
): CostRecord[] {
  const fromDate = filter.from ? new Date(filter.from) : null
  const toDate = filter.to ? new Date(`${filter.to}T23:59:59`) : null

  return records.filter((record) => {
    if (filter.purpose && record.costingPurpose !== filter.purpose) return false
    if (filter.month && monthKey(record.date) !== filter.month) return false
    const recordDate = new Date(record.date)
    if (fromDate && recordDate < fromDate) return false
    if (toDate && recordDate > toDate) return false
    return true
  })
}

/**
 * Recomputes the running "Total Cost" column for a set of records, ordered by
 * date (then id). Returns a map of record id → cumulative total.
 */
export function computeRunningTotals(records: CostRecord[]): Record<string, number> {
  const ordered = [...records].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
    if (diff !== 0) return diff
    return a.id.localeCompare(b.id)
  })
  const map: Record<string, number> = {}
  let running = 0
  for (const record of ordered) {
    running = round2(running + (Number(record.costAmount) || 0))
    map[record.id] = running
  }
  return map
}
