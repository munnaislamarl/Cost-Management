import type { DataSource } from '@/services/types'
import { seedActivity, seedRecords, seedUsers } from '@/services/mock/seed'
import type {
  ActivityLogEntry,
  AppUser,
  CostRecord,
  DashboardData,
  DashboardStats,
  ReportData,
  SessionUser,
} from '@/types'
import {
  computeReportData,
  computeRunningTotals,
  computeStats,
  monthLabel,
} from '@/utils/analytics'
import { generateId, generateRecordId, nowIso } from '@/utils/id'

const MOCK_CREDENTIALS: Record<string, { password: string; userId: string }> = {
  'admin@opexhub.com': { password: 'Admin@123', userId: 'USR-0001' },
  'manager@opexhub.com': { password: 'Manager@123', userId: 'USR-0002' },
  'data@opexhub.com': { password: 'Data@123', userId: 'USR-0003' },
  'viewer@opexhub.com': { password: 'Viewer@123', userId: 'USR-0004' },
}

type Listener = () => void

class MockDatabase {
  records: CostRecord[]
  users: AppUser[]
  activity: ActivityLogEntry[]
  private listeners = new Set<Listener>()

  constructor() {
    this.records = seedRecords()
    this.users = seedUsers()
    this.activity = seedActivity()
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  emit() {
    this.listeners.forEach((listener) => listener())
  }

  recomputeTotals() {
    const totals = computeRunningTotals(this.records)
    this.records = this.records.map((record) => ({
      ...record,
      totalCost: totals[record.id] ?? 0,
    }))
  }

  log(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) {
    this.activity = [
      { ...entry, id: generateId('log'), timestamp: nowIso() },
      ...this.activity,
    ].slice(0, 100)
  }
}

export const mockDb = new MockDatabase()

function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export const mockDataSource: DataSource = {
  async listRecords() {
    return delay(clone(mockDb.records))
  },

  async getRecord(id) {
    const record = mockDb.records.find((item) => item.id === id)
    if (!record) throw new Error(`Entry ${id} was not found.`)
    return delay(clone(record), 300)
  },

  async createRecord(input, actor) {
    const timestamp = nowIso()
    const record: CostRecord = {
      id: generateRecordId(mockDb.records.length + 1),
      date: input.date,
      month: monthLabel(input.date),
      costingPurpose: input.costingPurpose,
      costAmount: Number(input.costAmount) || 0,
      costDescription: input.costDescription,
      totalCost: 0,
      remarks: input.remarks,
      createdBy: actor,
      createdAt: timestamp,
      updatedBy: actor,
      updatedAt: timestamp,
    }
    mockDb.records = [record, ...mockDb.records]
    mockDb.recomputeTotals()
    mockDb.log({
      action: 'create',
      recordId: record.id,
      actor,
      detail: `Added ${record.costingPurpose} cost of ${record.costAmount}`,
    })
    mockDb.emit()
    const saved = mockDb.records.find((item) => item.id === record.id) ?? record
    return delay(clone(saved))
  },

  async createMany(inputs, actor) {
    const timestamp = nowIso()
    const created: CostRecord[] = inputs.map((input, index) => ({
      id: generateRecordId(mockDb.records.length + index + 1),
      date: input.date,
      month: monthLabel(input.date),
      costingPurpose: input.costingPurpose,
      costAmount: Number(input.costAmount) || 0,
      costDescription: input.costDescription,
      totalCost: 0,
      remarks: input.remarks,
      createdBy: actor,
      createdAt: timestamp,
      updatedBy: actor,
      updatedAt: timestamp,
    }))
    mockDb.records = [...created, ...mockDb.records]
    mockDb.recomputeTotals()
    mockDb.log({
      action: 'create',
      actor,
      detail: `Added ${created.length} cost entries on ${inputs[0]?.date ?? ''}`,
    })
    mockDb.emit()
    const ids = created.map((item) => item.id)
    return delay(clone(mockDb.records.filter((item) => ids.includes(item.id))))
  },

  async updateRecord(id, input, actor) {
    const index = mockDb.records.findIndex((item) => item.id === id)
    if (index === -1) throw new Error(`Entry ${id} was not found.`)
    const updated: CostRecord = {
      ...mockDb.records[index],
      date: input.date,
      month: monthLabel(input.date),
      costingPurpose: input.costingPurpose,
      costAmount: Number(input.costAmount) || 0,
      costDescription: input.costDescription,
      remarks: input.remarks,
      updatedBy: actor,
      updatedAt: nowIso(),
    }
    mockDb.records = mockDb.records.map((item, i) => (i === index ? updated : item))
    mockDb.recomputeTotals()
    mockDb.log({ action: 'update', recordId: id, actor, detail: `Updated entry ${id}` })
    mockDb.emit()
    const saved = mockDb.records.find((item) => item.id === id) ?? updated
    return delay(clone(saved))
  },

  async deleteRecord(id, actor) {
    const exists = mockDb.records.some((item) => item.id === id)
    if (!exists) throw new Error(`Entry ${id} was not found.`)
    mockDb.records = mockDb.records.filter((item) => item.id !== id)
    mockDb.recomputeTotals()
    mockDb.log({ action: 'delete', recordId: id, actor, detail: `Deleted entry ${id}` })
    mockDb.emit()
    return delay(undefined, 300).then(() => undefined)
  },

  async listUsers() {
    return delay(clone(mockDb.users))
  },

  async saveUser(user) {
    const exists = mockDb.users.some((item) => item.id === user.id)
    mockDb.users = exists
      ? mockDb.users.map((item) => (item.id === user.id ? { ...user } : item))
      : [{ ...user }, ...mockDb.users]
    mockDb.log({
      action: exists ? 'update' : 'create',
      actor: 'system',
      detail: `${exists ? 'Updated' : 'Created'} user ${user.email}`,
    })
    mockDb.emit()
    return delay(clone(user))
  },

  async deleteUser(id) {
    mockDb.users = mockDb.users.filter((item) => item.id !== id)
    mockDb.emit()
    return delay(undefined, 300).then(() => undefined)
  },

  async listActivity() {
    return delay(clone(mockDb.activity), 300)
  },

  async getDashboard(): Promise<DashboardData> {
    return delay({
      stats: computeStats(mockDb.records, mockDb.users),
      report: computeReportData(mockDb.records, mockDb.users),
      recentRecords: [...mockDb.records]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
      activity: mockDb.activity.slice(0, 8),
      records: clone(mockDb.records),
    })
  },

  async getDashboardStats(): Promise<DashboardStats> {
    return delay(computeStats(mockDb.records, mockDb.users))
  },

  async getReportData(): Promise<ReportData> {
    return delay(computeReportData(mockDb.records, mockDb.users))
  },

  async authenticate(identifier, password) {
    const key = identifier.trim().toLowerCase()
    const byEmail = MOCK_CREDENTIALS[key]
    const user = mockDb.users.find(
      (item) => item.email.toLowerCase() === key || item.employeeId.toLowerCase() === key,
    )

    const valid = (byEmail && byEmail.password === password) || (user && password === 'Demo@123')

    if (!user || !valid) {
      throw new Error('Invalid credentials. Check your email/employee ID and password.')
    }
    if (!user.active) {
      throw new Error('This account has been disabled. Contact an administrator.')
    }

    const session: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      department: user.department,
    }
    return delay(session)
  },
}
