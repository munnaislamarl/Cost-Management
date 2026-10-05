export type Role = 'admin' | 'manager' | 'data_entry' | 'viewer'

export interface CostRecord {
  id: string
  date: string
  month: string
  costingPurpose: string
  costAmount: number
  costDescription: string
  totalCost: number
  remarks: string
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export type RecordInput = Pick<
  CostRecord,
  'date' | 'costingPurpose' | 'costAmount' | 'costDescription' | 'remarks'
>

export interface AppUser {
  id: string
  name: string
  email: string
  employeeId: string
  role: Role
  department: string
  active: boolean
  createdAt: string
  lastLogin?: string
}

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected'

export interface AccessRequest {
  id: string
  name: string
  email: string
  employeeId: string
  department: string
  message: string
  status: AccessRequestStatus
  requestedAt: string
  decidedBy?: string
  decidedAt?: string
}

export interface AccessRequestInput {
  name: string
  email: string
  employeeId: string
  department: string
  message: string
  password: string
}

export interface SessionUser {
  id: string
  name: string
  email: string
  employeeId: string
  role: Role
  department: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface ApiListResponse<T> {
  success: boolean
  message: string
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface RecordQuery {
  search?: string
  purpose?: string
  month?: string
  from?: string
  to?: string
  sortBy?: keyof CostRecord
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface DashboardStats {
  totalCost: number
  monthCost: number
  totalEntries: number
  averageCost: number
  largestEntry: number
  topPurpose: string
  topPurposeCost: number
  activeUsers: number
}

export interface MonthlyCost {
  month: string
  monthKey: string
  entries: number
  cost: number
  cumulative: number
}

export interface PurposeSummary {
  purpose: string
  entries: number
  cost: number
  share: number
}

export interface MonthSummary {
  month: string
  entries: number
  cost: number
}

export interface MonthCostBreakdown {
  month: string
  monthKey: string
  totalCost: number
  purposes: PurposeSummary[]
}

export interface ActivityLogEntry {
  id: string
  action: 'create' | 'update' | 'delete' | 'archive' | 'login' | 'restore'
  recordId?: string
  actor: string
  detail: string
  timestamp: string
}

export interface ReportData {
  summary: DashboardStats
  monthly: MonthlyCost[]
  purposes: PurposeSummary[]
  months: MonthSummary[]
  byMonth: MonthCostBreakdown[]
}

export interface DashboardData {
  stats: DashboardStats
  report: ReportData
  recentRecords: CostRecord[]
  activity: ActivityLogEntry[]
  records: CostRecord[]
}

export interface AppNotification {
  id: string
  title: string
  description: string
  timestamp: string
  read: boolean
  tone: 'default' | 'success' | 'warning' | 'error'
}
