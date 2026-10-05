import { dataSource } from '@/services/datasource'
import type { AppUser, CostRecord, ReportData } from '@/types'
import {
  applyRecordFilter,
  computeReportData,
} from '@/utils/analytics'

export const usersService = {
  list(): Promise<AppUser[]> {
    return dataSource.listUsers()
  },

  save(user: AppUser): Promise<AppUser> {
    return dataSource.saveUser(user)
  },

  remove(id: string): Promise<void> {
    return dataSource.deleteUser(id)
  },
}

export const reportsService = {
  async getReportData(): Promise<ReportData> {
    return dataSource.getReportData()
  },

  localReport(
    records: CostRecord[],
    filter: { purpose?: string; month?: string; from?: string; to?: string },
  ): ReportData {
    return computeReportData(applyRecordFilter(records, filter))
  },
}
