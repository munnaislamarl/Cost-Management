import { Loader2 } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { ThemeProvider } from '@/hooks/useTheme'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ProtectedRoute } from '@/layouts/ProtectedRoute'
import { RoleGuard } from '@/layouts/RoleGuard'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const DataEntryPage = lazy(() =>
  import('@/pages/DataEntryPage').then((module) => ({ default: module.DataEntryPage })),
)
const RecordsPage = lazy(() =>
  import('@/pages/RecordsPage').then((module) => ({ default: module.RecordsPage })),
)
const RecordViewPage = lazy(() =>
  import('@/pages/RecordViewPage').then((module) => ({ default: module.RecordViewPage })),
)
const ReportsPage = lazy(() =>
  import('@/pages/ReportsPage').then((module) => ({ default: module.ReportsPage })),
)
const UsersPage = lazy(() =>
  import('@/pages/UsersPage').then((module) => ({ default: module.UsersPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}

function LoginRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  if (isBootstrapping) return null
  if (isAuthenticated) return <Navigate to="/app/dashboard" replace />
  return <LoginPage />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          <HashRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
                <Route path="/login" element={<LoginRoute />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/app" element={<DashboardLayout />}>
                    <Route index element={<Navigate to="/app/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route
                      path="data-entry"
                      element={
                        <RoleGuard permission="records.create">
                          <DataEntryPage />
                        </RoleGuard>
                      }
                    />
                    <Route path="records" element={<RecordsPage />} />
                    <Route path="records/:id" element={<RecordViewPage />} />
                    <Route
                      path="reports"
                      element={
                        <RoleGuard permission="reports.view">
                          <ReportsPage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="users"
                      element={
                        <RoleGuard permission="users.manage">
                          <UsersPage />
                        </RoleGuard>
                      }
                    />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </HashRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
