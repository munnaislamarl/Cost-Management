import { apiRequest } from '@/services/apiClient'
import type { DataSource } from '@/services/types'
import type {
  AccessRequest,
  AccessRequestInput,
  ActivityLogEntry,
  AppUser,
  CostRecord,
  DashboardData,
  DashboardStats,
  RecordInput,
  ReportData,
  Role,
  SessionUser,
} from '@/types'

async function unwrap<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const response = await apiRequest<T>(action, payload)
  return response.data as T
}

export const remoteDataSource: DataSource = {
  listRecords: () => unwrap<CostRecord[]>('listRecords'),
  getRecord: (id) => unwrap<CostRecord>('getRecord', { id }),
  createRecord: (input: RecordInput, actor: string) =>
    unwrap<CostRecord>('createRecord', { record: input, actor }),
  createMany: (inputs: RecordInput[], actor: string) =>
    unwrap<CostRecord[]>('createRecords', { records: inputs, actor }),
  updateRecord: (id: string, input: RecordInput, actor: string) =>
    unwrap<CostRecord>('updateRecord', { id, record: input, actor }),
  deleteRecord: async (id: string, actor: string) => {
    await unwrap<{ id: string }>('deleteRecord', { id, actor })
  },

  listUsers: () => unwrap<AppUser[]>('listUsers'),
  saveUser: (user: AppUser) => unwrap<AppUser>('saveUser', { user }),
  deleteUser: async (id: string) => {
    await unwrap<{ id: string }>('deleteUser', { id })
  },

  submitAccessRequest: (input: AccessRequestInput) =>
    unwrap<AccessRequest>('requestAccess', { request: input }),
  listAccessRequests: () => unwrap<AccessRequest[]>('listRequests'),
  approveAccessRequest: (id: string, data: { role: Role; department: string; actor: string }) =>
    unwrap<AppUser>('approveRequest', { id, ...data }),
  rejectAccessRequest: async (id: string, actor: string) => {
    await unwrap<{ id: string }>('rejectRequest', { id, actor })
  },

  listActivity: () => unwrap<ActivityLogEntry[]>('listActivity'),

  getDashboard: () => unwrap<DashboardData>('getDashboard'),
  getDashboardStats: () => unwrap<DashboardStats>('getDashboardStats'),
  getReportData: () => unwrap<ReportData>('getReportData'),

  authenticate: (identifier: string, password: string) =>
    unwrap<SessionUser>('authenticate', { identifier, password }),
}
