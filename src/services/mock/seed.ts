import type { ActivityLogEntry, AppUser, CostRecord, Role } from '@/types'
import {
  computeMonthly,
  computePurposeSummary,
  computeReportData,
  computeRunningTotals,
  computeStats,
  monthLabel,
} from '@/utils/analytics'
import { generateRecordId, nowIso } from '@/utils/id'

interface PurposeProfile {
  purpose: string
  min: number
  max: number
  weight: number
  descriptions: string[]
}

const PURPOSE_PROFILES: PurposeProfile[] = [
  {
    purpose: 'Essential Expenses (N.Ganj)',
    min: 300,
    max: 3500,
    weight: 6,
    descriptions: ['Monthly essentials', 'N.Ganj household essentials', 'Essential grocery batch'],
  },
  {
    purpose: 'Bazar (Grocery / Market)',
    min: 40,
    max: 900,
    weight: 9,
    descriptions: ['Dim + Lighter', 'Weekly bazar', 'Vegetables and fish', 'Rice, oil, spices'],
  },
  {
    purpose: 'TSM',
    min: 76,
    max: 152,
    weight: 8,
    descriptions: ['Daily TSM', 'TSM top-up'],
  },
  {
    purpose: 'Food (Outside)',
    min: 120,
    max: 850,
    weight: 6,
    descriptions: ['Lunch outside', 'Dinner with family', 'Snacks'],
  },
  {
    purpose: 'Mobile (Minutes / Internet)',
    min: 100,
    max: 700,
    weight: 5,
    descriptions: ['Internet package', 'Talk-time recharge'],
  },
  {
    purpose: 'Mobile Recharge (Mohidul+Sompa)',
    min: 200,
    max: 800,
    weight: 4,
    descriptions: ['Mohidul+Sompa recharge', 'Dual recharge'],
  },
  {
    purpose: 'Transport',
    min: 60,
    max: 900,
    weight: 7,
    descriptions: ['CNG fare', 'Bus fare', 'Rickshaw / auto', 'Ride share'],
  },
  {
    purpose: 'Home Going',
    min: 400,
    max: 1600,
    weight: 3,
    descriptions: ['Narayanganj return', 'Home trip', 'Village travel'],
  },
  {
    purpose: 'Home Expenses',
    min: 300,
    max: 2500,
    weight: 5,
    descriptions: ['Home extra', 'House repair', 'Utility contribution'],
  },
  {
    purpose: 'Home Union (Installment)',
    min: 2000,
    max: 6000,
    weight: 2,
    descriptions: ['Monthly installment', 'Home union deposit'],
  },
  {
    purpose: 'Loan Return',
    min: 350,
    max: 8000,
    weight: 3,
    descriptions: ['Rasel Sir (Loan-Return)', 'Hasib Bhai (Loan-Return)', 'Loan repayment'],
  },
  {
    purpose: 'Office Expenses',
    min: 150,
    max: 2200,
    weight: 4,
    descriptions: ['Office supplies', 'Client meeting', 'Printing and stationery'],
  },
  {
    purpose: 'Personal',
    min: 100,
    max: 1800,
    weight: 5,
    descriptions: ['Personal purchase', 'Salon', 'Misc personal'],
  },
  {
    purpose: "In-laws' House",
    min: 300,
    max: 2500,
    weight: 3,
    descriptions: ['In-laws visit', 'Gift for in-laws'],
  },
  {
    purpose: 'Travel (Outing/Visit)',
    min: 500,
    max: 4000,
    weight: 3,
    descriptions: ['Family outing', 'Weekend trip', 'Relative visit'],
  },
  {
    purpose: 'Emergency / Medical',
    min: 300,
    max: 5000,
    weight: 3,
    descriptions: ['Medicine', 'Doctor visit', 'Emergency expense'],
  },
  {
    purpose: 'Unexpected Expenses',
    min: 200,
    max: 3000,
    weight: 3,
    descriptions: ['Unexpected repair', 'Sudden expense'],
  },
]

const CREATORS = ['System Administrator', 'Amina Yusuf', 'James Carter']
const REMARKS = ['', 'Paid in cash', 'bKash', 'Recorded from expense note', 'Verified', '']

function createRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

export function seedRecords(count = 110): CostRecord[] {
  const random = createRandom(20260117)
  const weighted: PurposeProfile[] = []
  for (const profile of PURPOSE_PROFILES) {
    for (let i = 0; i < profile.weight; i += 1) weighted.push(profile)
  }

  const today = new Date()
  const records: CostRecord[] = []

  for (let i = 0; i < count; i += 1) {
    const daysAgo = Math.floor(random() * 210)
    const date = new Date(today)
    date.setDate(today.getDate() - daysAgo)
    date.setHours(8 + Math.floor(random() * 12), Math.floor(random() * 60), 0, 0)

    const profile = weighted[Math.floor(random() * weighted.length)]
    const amount =
      Math.round((profile.min + random() * (profile.max - profile.min)) * 100) / 100
    const creator = CREATORS[Math.floor(random() * CREATORS.length)]
    const created = new Date(date)
    created.setHours(created.getHours() + 1 + Math.floor(random() * 10))

    records.push({
      id: generateRecordId(i + 1),
      date: date.toISOString(),
      month: monthLabel(date),
      costingPurpose: profile.purpose,
      costAmount: amount,
      costDescription:
        profile.descriptions[Math.floor(random() * profile.descriptions.length)],
      totalCost: 0,
      remarks: REMARKS[Math.floor(random() * REMARKS.length)],
      createdBy: creator,
      createdAt: created.toISOString(),
      updatedBy: creator,
      updatedAt: created.toISOString(),
    })
  }

  const totals = computeRunningTotals(records)
  const withTotals = records.map((record) => ({ ...record, totalCost: totals[record.id] ?? 0 }))

  return withTotals.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}

export function seedUsers(): AppUser[] {
  const base: Array<{
    name: string
    email: string
    employeeId: string
    role: Role
    department: string
    active?: boolean
  }> = [
    {
      name: 'System Administrator',
      email: 'admin@opexhub.com',
      employeeId: 'EMP-0001',
      role: 'admin',
      department: 'Administration',
    },
    {
      name: 'James Carter',
      email: 'manager@opexhub.com',
      employeeId: 'EMP-0002',
      role: 'manager',
      department: 'Operations',
    },
    {
      name: 'Elena Petrova',
      email: 'data@opexhub.com',
      employeeId: 'EMP-0003',
      role: 'data_entry',
      department: 'Finance',
    },
    {
      name: 'Kwame Boateng',
      email: 'viewer@opexhub.com',
      employeeId: 'EMP-0004',
      role: 'viewer',
      department: 'Procurement',
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@opexhub.com',
      employeeId: 'EMP-1003',
      role: 'data_entry',
      department: 'Human Resources',
      active: false,
    },
  ]

  return base.map((user, index) => ({
    id: `USR-${String(index + 1).padStart(4, '0')}`,
    name: user.name,
    email: user.email,
    employeeId: user.employeeId,
    role: user.role,
    department: user.department,
    active: user.active ?? true,
    createdAt: new Date(2025, 0, 5 + index * 3).toISOString(),
    lastLogin: index < 4 ? nowIso() : undefined,
  }))
}

export function seedActivity(): ActivityLogEntry[] {
  const records = seedRecords(16)
  return records.map((record, index) => ({
    id: `LOG-${index + 1}`,
    action: (['create', 'update', 'create', 'delete', 'update'] as const)[index % 5],
    recordId: record.id,
    actor: record.createdBy,
    detail: `${
      index % 5 === 0
        ? 'Created'
        : index % 5 === 1
          ? 'Updated'
          : index % 5 === 3
            ? 'Deleted'
            : 'Reviewed'
    } entry ${record.id} — ${record.costingPurpose}`,
    timestamp: record.updatedAt,
  }))
}

export const SEED = {
  purposes: PURPOSE_PROFILES.map((profile) => profile.purpose),
  creators: CREATORS,
  remarks: REMARKS,
}

export { computeMonthly, computePurposeSummary, computeReportData, computeStats }
