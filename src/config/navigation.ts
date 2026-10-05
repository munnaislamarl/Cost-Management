import {
  BarChart3,
  Database,
  FilePlus2,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { Permission } from '@/utils/permissions'

export interface NavItem {
  title: string
  to: string
  icon: LucideIcon
  permission: Permission
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    to: '/app/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard.view',
  },
  {
    title: 'Data Entry',
    to: '/app/data-entry',
    icon: FilePlus2,
    permission: 'records.create',
  },
  {
    title: 'Records',
    to: '/app/records',
    icon: Database,
    permission: 'records.view',
  },
  {
    title: 'Reports',
    to: '/app/reports',
    icon: BarChart3,
    permission: 'reports.view',
  },
  {
    title: 'Users',
    to: '/app/users',
    icon: Users,
    permission: 'users.manage',
  },
  {
    title: 'Settings',
    to: '/app/settings',
    icon: Settings,
    permission: 'settings.view',
  },
]

export type { LucideIcon }
