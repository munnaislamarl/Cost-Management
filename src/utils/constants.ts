export const STORAGE_KEYS = {
  session: 'opex-hub.session',
  theme: 'opex-hub.theme',
  notifications: 'opex-hub.notifications',
  preferences: 'opex-hub.preferences',
} as const

export const COSTING_PURPOSES = [
  'Essential Expenses (N.Ganj)',
  'Office Expenses',
  'Bazar (Grocery / Market)',
  'TSM',
  'Mobile (Minutes / Internet)',
  'Home Expenses',
  'Home Union (Installment)',
  'Loan Return',
  'Mobile Recharge (Mohidul+Sompa)',
  'Personal',
  'Transport',
  'Home Going',
  "In-laws' House",
  'Travel (Outing/Visit)',
  'Emergency / Medical',
  'Food (Outside)',
  'Unexpected Expenses',
] as const

export type CostingPurpose = (typeof COSTING_PURPOSES)[number]

export const DEPARTMENTS = [
  'Administration',
  'Finance',
  'Operations',
  'Information Technology',
  'Procurement',
  'Human Resources',
  'Other',
] as const

export const ROLES = ['admin', 'manager', 'data_entry', 'viewer'] as const

export const DEFAULT_PAGE_SIZE = 10

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  data_entry: 'Data Entry',
  viewer: 'Viewer',
}

export const RECORD_ID_PREFIX = 'CM'
