import { dataSource } from '@/services/datasource'
import type { CostRecord, RecordInput, RecordQuery } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'
import { monthKey } from '@/utils/analytics'
import { parseDate } from '@/utils/format'

export interface QueryResult {
  rows: CostRecord[]
  total: number
}

function matchesSearch(record: CostRecord, term: string): boolean {
  const haystack = [
    record.id,
    record.costingPurpose,
    record.costDescription,
    record.month,
    record.remarks,
    record.createdBy,
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(term)
}

function compare(a: CostRecord, b: CostRecord, key: keyof CostRecord): number {
  const left = a[key]
  const right = b[key]
  if (typeof left === 'number' && typeof right === 'number') return left - right
  const isDate = key === 'date' || key === 'createdAt' || key === 'updatedAt'
  if (isDate) {
    return (
      (new Date(String(left)).getTime() || 0) - (new Date(String(right)).getTime() || 0)
    )
  }
  return String(left ?? '').localeCompare(String(right ?? ''))
}

export const recordsService = {
  async fetchAll(): Promise<CostRecord[]> {
    return dataSource.listRecords()
  },

  query(records: CostRecord[], query: RecordQuery = {}): QueryResult {
    const {
      search = '',
      purpose = '',
      month = '',
      from,
      to,
      sortBy = 'date',
      sortDir = 'desc',
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
    } = query

    const term = search.trim().toLowerCase()
    const fromDate = from ? parseDate(from) : null
    const toDate = to ? parseDate(to) : null
    if (toDate) toDate.setHours(23, 59, 59, 999)

    const filtered = records.filter((record) => {
      if (purpose && record.costingPurpose !== purpose) return false
      if (month && monthKey(record.date) !== month) return false
      if (term && !matchesSearch(record, term)) return false
      const recordDate = parseDate(record.date)
      if (fromDate && recordDate && recordDate < fromDate) return false
      if (toDate && recordDate && recordDate > toDate) return false
      return true
    })

    const sorted = [...filtered].sort((a, b) => {
      const result = compare(a, b, sortBy)
      return sortDir === 'asc' ? result : -result
    })

    const total = sorted.length
    const start = (page - 1) * pageSize
    return { rows: sorted.slice(start, start + pageSize), total }
  },

  getRecord(id: string): Promise<CostRecord> {
    return dataSource.getRecord(id)
  },

  create(input: RecordInput, actor: string): Promise<CostRecord> {
    return dataSource.createRecord(input, actor)
  },

  createMany(inputs: RecordInput[], actor: string): Promise<CostRecord[]> {
    return dataSource.createMany(inputs, actor)
  },

  update(id: string, input: RecordInput, actor: string): Promise<CostRecord> {
    return dataSource.updateRecord(id, input, actor)
  },

  remove(id: string, actor: string): Promise<void> {
    return dataSource.deleteRecord(id, actor)
  },
}
