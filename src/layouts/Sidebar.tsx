import { LogOut, ShieldCheck, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/ui/button'
import { NAV_ITEMS } from '@/config/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/utils/constants'
import { initials } from '@/utils/format'

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { user, logout, can } = useAuth()
  const items = NAV_ITEMS.filter((item) => can(item.permission))

  return (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Logo />
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg bg-muted/60 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials(user?.name ?? 'User')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                {ROLE_LABELS[user?.role ?? 'viewer']}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  )
}
