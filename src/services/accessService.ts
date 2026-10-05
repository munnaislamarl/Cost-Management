import { dataSource } from '@/services/datasource'
import type { AccessRequest, AccessRequestInput, AppUser, Role } from '@/types'

export const accessService = {
  submit(input: AccessRequestInput): Promise<AccessRequest> {
    return dataSource.submitAccessRequest(input)
  },

  list(): Promise<AccessRequest[]> {
    return dataSource.listAccessRequests()
  },

  approve(
    id: string,
    data: { role: Role; department: string; actor: string },
  ): Promise<AppUser> {
    return dataSource.approveAccessRequest(id, data)
  },

  reject(id: string, actor: string): Promise<void> {
    return dataSource.rejectAccessRequest(id, actor)
  },
}
