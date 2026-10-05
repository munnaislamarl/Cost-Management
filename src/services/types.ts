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

export interface DataSource {
  listRecords(): Promise<CostRecord[]>
  getRecord(id: string): Promise<CostRecord>
  createRecord(input: RecordInput, actor: string): Promise<CostRecord>
  createMany(inputs: RecordInput[], actor: string): Promise<CostRecord[]>
  updateRecord(id: string, input: RecordInput, actor: string): Promise<CostRecord>
  deleteRecord(id: string, actor: string): Promise<void>

  listUsers(): Promise<AppUser[]>
  saveUser(user: AppUser): Promise<AppUser>
  deleteUser(id: string): Promise<void>

  submitAccessRequest(input: AccessRequestInput): Promise<AccessRequest>
  listAccessRequests(): Promise<AccessRequest[]>
  approveAccessRequest(
    id: string,
    data: { role: Role; department: string; actor: string },
  ): Promise<AppUser>
  rejectAccessRequest(id: string, actor: string): Promise<void>

  listActivity(): Promise<ActivityLogEntry[]>

  getDashboard(): Promise<DashboardData>
  getDashboardStats(): Promise<DashboardStats>
  getReportData(): Promise<ReportData>

  authenticate(identifier: string, password: string): Promise<SessionUser>
}
