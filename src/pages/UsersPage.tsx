import { Ban, Clock, MoreHorizontal, Pencil, UserPlus, Users as UsersIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { accessService } from '@/services/accessService'
import { getErrorMessage } from '@/services/apiClient'
import { usersService } from '@/services/usersService'
import type { AccessRequest, AppUser, Role } from '@/types'
import { DEPARTMENTS, ROLES, ROLE_LABELS } from '@/utils/constants'
import { formatDate, formatRelativeTime, initials } from '@/utils/format'
import { generateId } from '@/utils/id'

interface UserFormState {
  id: string
  name: string
  email: string
  employeeId: string
  role: Role
  department: string
  active: boolean
}

const ROLE_BADGE: Record<Role, 'default' | 'info' | 'warning' | 'muted'> = {
  admin: 'default',
  manager: 'info',
  data_entry: 'warning',
  viewer: 'muted',
}

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const resource = useAsyncResource(() => usersService.list(), [])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<UserFormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmUser, setConfirmUser] = useState<AppUser | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const requestsResource = useAsyncResource(() => accessService.list(), [])
  const pendingRequests = (requestsResource.data ?? []).filter(
    (request) => request.status === 'pending',
  )
  const [approveTarget, setApproveTarget] = useState<AccessRequest | null>(null)
  const [approveRole, setApproveRole] = useState<Role>('data_entry')
  const [approveDepartment, setApproveDepartment] = useState('')
  const [approving, setApproving] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<AccessRequest | null>(null)
  const [rejecting, setRejecting] = useState(false)

  function openApprove(request: AccessRequest) {
    setApproveTarget(request)
    setApproveRole('data_entry')
    setApproveDepartment(request.department || 'Administration')
  }

  async function handleApprove() {
    if (!approveTarget || approving) return
    setApproving(true)
    try {
      await accessService.approve(approveTarget.id, {
        role: approveRole,
        department: approveDepartment,
        actor: currentUser?.name ?? 'Administrator',
      })
      await requestsResource.refresh()
      await resource.refresh()
      toast.success(`${approveTarget.name} approved — they can now sign in`)
      setApproveTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setApproving(false)
    }
  }

  async function handleReject() {
    if (!rejectTarget || rejecting) return
    setRejecting(true)
    try {
      await accessService.reject(rejectTarget.id, currentUser?.name ?? 'Administrator')
      await requestsResource.refresh()
      toast.success('Access request rejected')
      setRejectTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setRejecting(false)
    }
  }

  const users = useMemo(() => resource.data ?? [], [resource.data])

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase()
    if (!term) return users
    return users.filter((user) =>
      [user.name, user.email, user.employeeId, user.department, user.role]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [users, debouncedSearch])

  function openCreate() {
    setForm({
      id: generateId('USR').toUpperCase().replace('_', '-'),
      name: '',
      email: '',
      employeeId: '',
      role: 'viewer',
      department: currentUser?.department ?? 'Administration',
      active: true,
    })
    setDialogOpen(true)
  }

  function openEdit(user: AppUser) {
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      department: user.department,
      active: user.active,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form) return
    if (!form.name.trim() || !form.email.trim() || !form.employeeId.trim()) {
      toast.error('Name, email and employee ID are required.')
      return
    }
    setSaving(true)
    try {
      const existing = users.find((user) => user.id === form.id)
      const payload: AppUser = {
        id: form.id,
        name: form.name.trim(),
        email: form.email.trim(),
        employeeId: form.employeeId.trim(),
        role: form.role,
        department: form.department,
        active: form.active,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        lastLogin: existing?.lastLogin,
      }
      await usersService.save(payload)
      await resource.refresh()
      toast.success(existing ? 'User updated' : 'User created')
      setDialogOpen(false)
      setForm(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(user: AppUser) {
    try {
      await usersService.save({ ...user, active: !user.active })
      await resource.refresh()
      toast.success(user.active ? 'User disabled' : 'User enabled')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleDelete() {
    if (!confirmUser) return
    setConfirmLoading(true)
    try {
      await usersService.remove(confirmUser.id)
      await resource.refresh()
      toast.success('User removed')
      setConfirmUser(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setConfirmLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Create users, assign roles and control access to OPEX Hub."
        actions={
          <Button size="sm" onClick={openCreate}>
            <UserPlus className="h-4 w-4" />
            Add user
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="max-w-sm">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => setSearch('')}
              placeholder="Search users by name, email or role…"
            />
          </div>
        </CardContent>
      </Card>

      {pendingRequests.length > 0 ? (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Pending Access Requests
              <Badge variant="default">{pendingRequests.length}</Badge>
            </CardTitle>
            <CardDescription>
              Approve a request to create the account — the user can then sign in with
              the email &amp; password they submitted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials(request.name || request.email)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {request.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {request.email} · {request.employeeId}
                      {request.department ? ` · ${request.department}` : ''}
                    </p>
                    {request.message ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        “{request.message}”
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Requested {formatRelativeTime(request.requestedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="success" onClick={() => openApprove(request)}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setRejectTarget(request)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        {resource.error ? (
          <ErrorState description={resource.error} onRetry={resource.refresh} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Employee ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resource.loading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 7 }).map((__, cell) => (
                          <TableCell key={cell}>
                            <Skeleton className="h-4 w-full max-w-[120px]" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : filtered.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>{initials(user.name || user.email)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {user.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs md:table-cell">
                          {user.employeeId}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ROLE_BADGE[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-sm lg:table-cell">
                          {user.department}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.active ? 'success' : 'muted'}>
                            {user.active ? 'Active' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground xl:table-cell">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label="User actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(user)}>
                                <Pencil className="h-4 w-4" />
                                Edit & role
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleActive(user)}>
                                <Ban className="h-4 w-4" />
                                {user.active ? 'Disable user' : 'Enable user'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setConfirmUser(user)}
                                disabled={user.id === currentUser?.id}
                              >
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
            {!resource.loading && filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-14 text-center">
                <UsersIcon className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No users match your search.</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setForm(null)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form && users.some((u) => u.id === form.id) ? 'Edit user' : 'Add user'}</DialogTitle>
            <DialogDescription>
              Set the user&apos;s details and role. Permissions are enforced across the app.
            </DialogDescription>
          </DialogHeader>

          {form ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="user-name">Full name</Label>
                <Input
                  id="user-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="jane@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-empid">Employee ID</Label>
                <Input
                  id="user-empid"
                  value={form.employeeId}
                  onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
                  placeholder="EMP-0005"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-role">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm({ ...form, role: value as Role })}
                >
                  <SelectTrigger id="user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-department">Department</Label>
                <Select
                  value={form.department}
                  onValueChange={(value) => setForm({ ...form, department: value })}
                >
                  <SelectTrigger id="user-department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 sm:col-span-2">
                <div>
                  <p className="text-sm font-medium">Active account</p>
                  <p className="text-xs text-muted-foreground">
                    Disabled users cannot sign in or access data.
                  </p>
                </div>
                <Switch
                  checked={form.active}
                  onCheckedChange={(checked) => setForm({ ...form, active: checked })}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={saving}>
              Save user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmUser != null}
        onOpenChange={(open) => {
          if (!open) setConfirmUser(null)
        }}
        title="Remove user?"
        description={
          confirmUser ? (
            <>
              This removes <span className="font-medium text-foreground">{confirmUser.name}</span>{' '}
              ({confirmUser.email}) from the users directory.
            </>
          ) : undefined
        }
        confirmLabel="Remove"
        onConfirm={handleDelete}
        loading={confirmLoading}
      />

      <Dialog
        open={approveTarget != null}
        onOpenChange={(open) => {
          if (!open) setApproveTarget(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve access</DialogTitle>
            <DialogDescription>
              Create an account for{' '}
              <span className="font-medium text-foreground">{approveTarget?.name}</span> (
              {approveTarget?.email}). They will sign in with the password they submitted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={approveRole} onValueChange={(value) => setApproveRole(value as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={approveDepartment} onValueChange={setApproveDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveTarget(null)}
              disabled={approving}
            >
              Cancel
            </Button>
            <Button variant="success" onClick={handleApprove} loading={approving} disabled={approving}>
              Approve &amp; create account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={rejectTarget != null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null)
        }}
        title="Reject request?"
        description={
          rejectTarget ? (
            <>
              This rejects the access request from{' '}
              <span className="font-medium text-foreground">{rejectTarget.name}</span>.
            </>
          ) : undefined
        }
        confirmLabel="Reject"
        onConfirm={handleReject}
        loading={rejecting}
      />
    </div>
  )
}
