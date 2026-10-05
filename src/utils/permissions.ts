import type { Role } from '@/types'

export type Permission =
  | 'dashboard.view'
  | 'records.view'
  | 'records.create'
  | 'records.edit'
  | 'records.delete'
  | 'reports.view'
  | 'users.manage'
  | 'settings.view'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'dashboard.view',
    'records.view',
    'records.create',
    'records.edit',
    'records.delete',
    'reports.view',
    'users.manage',
    'settings.view',
  ],
  manager: [
    'dashboard.view',
    'records.view',
    'records.create',
    'records.edit',
    'reports.view',
    'settings.view',
  ],
  data_entry: ['dashboard.view', 'records.view', 'records.create', 'records.edit', 'settings.view'],
  viewer: ['dashboard.view', 'records.view', 'settings.view'],
}

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function canViewRecords(role: Role | undefined) {
  return hasPermission(role, 'records.view')
}
export function canCreateRecords(role: Role | undefined) {
  return hasPermission(role, 'records.create')
}
export function canEditRecords(role: Role | undefined) {
  return hasPermission(role, 'records.edit')
}
export function canDeleteRecords(role: Role | undefined) {
  return hasPermission(role, 'records.delete')
}
export function canManageUsers(role: Role | undefined) {
  return hasPermission(role, 'users.manage')
}
