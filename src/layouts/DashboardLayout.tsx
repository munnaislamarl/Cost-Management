import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Sidebar } from '@/layouts/Sidebar'
import { Topbar } from '@/layouts/Topbar'

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')

  return (
    <div className="min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:pl-72">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          searchValue={search}
          onSearchChange={setSearch}
        />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
