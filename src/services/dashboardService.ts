import { dataSource } from '@/services/datasource'
import type { CostRecord, DashboardData, DashboardStats, ReportData } from '@/types'
import { parseDate } from '@/utils/format'

export const dashboardService = {
  async getDashboard(): Promise<DashboardData> {
    return dataSource.getDashboard()
  },

  async getStats(): Promise<DashboardStats> {
    return dataSource.getDashboardStats()
  },

  async getReportData(): Promise<ReportData> {
    return dataSource.getReportData()
  },

  async getActivity() {
    return dataSource.listActivity()
  },

  recentRecords(records: CostRecord[], limit = 6): CostRecord[] {
    return [...records]
      .sort(
        (a, b) =>
          (parseDate(b.createdAt)?.getTime() ?? 0) - (parseDate(a.createdAt)?.getTime() ?? 0),
      )
      .slice(0, limit)
  },
}
