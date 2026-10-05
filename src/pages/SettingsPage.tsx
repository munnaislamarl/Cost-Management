import { Bell, Monitor, Moon, Palette, Shield, Sun, User } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { env } from '@/config/env'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useAuth } from '@/hooks/useAuth'
import { type Theme, useTheme } from '@/hooks/useTheme'
import { isDemoMode } from '@/services/datasource'
import { ROLE_LABELS, STORAGE_KEYS } from '@/utils/constants'

interface Preferences {
  emailNotifications: boolean
  approvalAlerts: boolean
  weeklyDigest: boolean
  desktopNotifications: boolean
}

const THEMES: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [preferences, setPreferences] = useLocalStorage<Preferences>(
    STORAGE_KEYS.preferences,
    {
      emailNotifications: true,
      approvalAlerts: true,
      weeklyDigest: false,
      desktopNotifications: false,
    },
  )

  function updatePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferences((prev) => ({ ...prev, [key]: value }))
    toast.success('Preferences updated')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, appearance and notification preferences."
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system">
            <Shield className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Profile information</CardTitle>
                <CardDescription>Update your personal account details.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="profile-name">Full name</Label>
                  <Input id="profile-name" defaultValue={user?.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input id="profile-email" type="email" defaultValue={user?.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-empid">Employee ID</Label>
                  <Input id="profile-empid" defaultValue={user?.employeeId} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-role">Role</Label>
                  <Input id="profile-role" value={ROLE_LABELS[user?.role ?? 'viewer']} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-dept">Department</Label>
                  <Input id="profile-dept" defaultValue={user?.department} readOnly />
                </div>
                <div className="sm:col-span-2">
                  <Button onClick={() => toast.success('Profile saved (placeholder)')}>
                    Save changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change password</CardTitle>
                <CardDescription>Placeholder — wire this to your identity provider.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <Input id="current-password" type="password" placeholder="••••••••" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input id="new-password" type="password" placeholder="••••••••" disabled />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.info('Password reset must be handled by your identity provider.')}
                >
                  Update password
                </Button>
                <p className="text-xs text-muted-foreground">
                  For production, use Google OAuth or a secure identity provider instead of
                  storing passwords.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Choose how OPEX Hub looks on this device.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {THEMES.map((option) => {
                const Icon = option.icon
                const active = theme === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={`flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                      active
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/40 hover:bg-muted/40'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {option.value === 'system'
                          ? 'Follow device setting'
                          : `Always use ${option.label.toLowerCase()} theme`}
                      </p>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
              <CardDescription>Control how and when you receive updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {(
                [
                  ['emailNotifications', 'Email notifications', 'Receive summary emails about activity.'],
                  ['approvalAlerts', 'Alert notifications', 'Notify me about important cost activity.'],
                  ['weeklyDigest', 'Weekly digest', 'A weekly summary of cost data.'],
                  ['desktopNotifications', 'Desktop notifications', 'Show browser notifications.'],
                ] as const
              ).map(([key, title, description], index) => (
                <div key={key}>
                  {index > 0 ? <Separator /> : null}
                  <div className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <Switch
                      checked={preferences[key]}
                      onCheckedChange={(checked) => updatePreference(key, checked)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System information</CardTitle>
                <CardDescription>Runtime and integration status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Application</span>
                  <span className="font-medium">{env.appName}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Company</span>
                  <span className="font-medium">{env.companyName}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Google Sheets API</span>
                  <Badge variant={env.isApiConfigured ? 'success' : 'warning'}>
                    {env.isApiConfigured ? 'Connected' : 'Not configured'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data mode</span>
                  <Badge variant={isDemoMode ? 'warning' : 'success'}>
                    {isDemoMode ? 'Demo data' : 'Live backend'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">API URL</span>
                  <span className="max-w-[220px] truncate font-mono text-xs">
                    {env.apiUrl || '—'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security &amp; session</CardTitle>
                <CardDescription>Current session details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Signed in as</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <Badge>{ROLE_LABELS[user?.role ?? 'viewer']}</Badge>
                </div>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  This demo stores a lightweight session token in the browser. Production
                  deployments should authenticate with Google OAuth or a dedicated identity
                  provider and never keep plaintext credentials in the client.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
