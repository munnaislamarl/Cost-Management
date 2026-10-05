import { Bell, Check, Menu, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/utils/constants'
import { formatRelativeTime, initials } from '@/utils/format'

interface TopbarProps {
  onMenuClick: () => void
  searchValue: string
  onSearchChange: (value: string) => void
}

export function Topbar({ onMenuClick, searchValue, onSearchChange }: TopbarProps) {
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') navigate('/app/records')
          }}
          placeholder="Search records, employees, departments…"
          className="bg-muted/50 pl-9"
          aria-label="Global search"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                  {unreadCount}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Mark all read
                </button>
              ) : null}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                You are all caught up.
              </p>
            ) : (
              notifications.slice(0, 6).map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="flex items-start gap-3 py-2.5"
                  onClick={() => markAsRead(item.id)}
                >
                  <span
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      item.tone === 'success' && 'bg-success',
                      item.tone === 'warning' && 'bg-warning',
                      item.tone === 'error' && 'bg-destructive',
                      item.tone === 'default' && 'bg-info',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatRelativeTime(item.timestamp)}
                    </p>
                  </div>
                  {item.read ? <Check className="mt-1 h-3.5 w-3.5 text-muted-foreground" /> : null}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-muted"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials(user?.name ?? 'User')}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight text-foreground">
                  {user?.name}
                </p>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {ROLE_LABELS[user?.role ?? 'viewer']}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/app/settings')}>
              Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={logout}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
