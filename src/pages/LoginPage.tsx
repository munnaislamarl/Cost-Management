import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isDemoMode } from '@/services/datasource'
import { getErrorMessage } from '@/services/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@opexhub.com', password: 'Admin@123' },
  { label: 'Manager', email: 'manager@opexhub.com', password: 'Manager@123' },
  { label: 'Data Entry', email: 'data@opexhub.com', password: 'Data@123' },
  { label: 'Viewer', email: 'viewer@opexhub.com', password: 'Viewer@123' },
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [requestOpen, setRequestOpen] = useState(false)

  const redirectTo =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ??
    '/app/dashboard'

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (loading) return
    setError(null)
    setSuccess(null)

    if (!identifier.trim() || !password) {
      setError('Please enter both your email/employee ID and password.')
      return
    }

    setLoading(true)
    try {
      await login(identifier, password)
      setSuccess('Signed in successfully. Redirecting…')
      toast.success('Welcome back to Cost Management')
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(email: string, demoPassword: string) {
    setIdentifier(email)
    setPassword(demoPassword)
    setError(null)
  }

  function handleForgotPassword() {
    if (!identifier.trim()) {
      setError('Enter your email or employee ID first, then tap “Forgot password”.')
      return
    }
    toast.success('If the account exists, a reset link has been sent.')
    setSuccess('Password reset instructions have been sent (placeholder).')
  }

  return (
    <AuthLayout>
      <div className="mb-8 space-y-2">
        <div className="mb-6 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Cost Management</p>
            <p className="text-xs text-muted-foreground">Expense Tracking</p>
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome to Cost Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to record costs, review spending and generate reports.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}
        {success ? (
          <div
            role="status"
            className="rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success"
          >
            {success}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="identifier">Email or Employee ID</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder="you@company.com or EMP-0001"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              onFocus={(event) => {
                const input = event.currentTarget
                window.setTimeout(
                  () => input.scrollIntoView({ block: 'center', behavior: 'smooth' }),
                  300,
                )
              }}
              className="pl-9"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onFocus={(event) => {
                const input = event.currentTarget
                window.setTimeout(
                  () => input.scrollIntoView({ block: 'center', behavior: 'smooth' }),
                  300,
                )
              }}
              className="pl-9 pr-10"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading} loading={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have access?{' '}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => setRequestOpen(true)}
          >
            Request access
          </button>
        </p>
      </form>

      {isDemoMode ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Demo accounts (no backend configured)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemo(account.email, account.password)}
                className={cn(
                  'rounded-lg border border-border bg-card px-3 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-primary/5',
                )}
              >
                <span className="block font-medium text-foreground">{account.label}</span>
                <span className="block truncate text-muted-foreground">{account.email}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Click an account to autofill, then press Sign In.
          </p>
        </div>
      ) : null}

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request access</DialogTitle>
            <DialogDescription>
              Access is granted by your organisation&apos;s OPEX Hub administrator.
              Send a request with your business details and you will be notified once
              your account is created.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="req-name">Full name</Label>
              <Input id="req-name" placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="req-email">Work email</Label>
              <Input id="req-email" type="email" placeholder="jane@company.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setRequestOpen(false)
                toast.success('Access request submitted for review.')
              }}
            >
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  )
}
