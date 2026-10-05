import type { ReactNode } from 'react'

const CURRENT_YEAR = new Date().getFullYear()

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="relative hidden overflow-hidden bg-primary lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.6) 0, transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.4) 0, transparent 40%)',
          }}
          aria-hidden
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none">
              <path
                d="M4 18V9.5C4 6.46 6.46 4 9.5 4h5C17.54 4 20 6.46 20 9.5V18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M8 18v-4.5A1.5 1.5 0 0 1 9.5 12h5a1.5 1.5 0 0 1 1.5 1.5V18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Cost Management</p>
            <p className="text-xs text-white/70">Expense Tracking Platform</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h1 className="text-3xl font-semibold leading-tight text-white">
            Track every cost, purpose and month in one place.
          </h1>
          <p className="text-sm leading-relaxed text-white/80">
            Record daily and monthly spending by costing purpose, watch your running
            totals and generate clear reports — all backed by a secure, auditable data
            layer.
          </p>
          <ul className="space-y-3 text-sm text-white/90">
            {[
              'Centralised cost data on Google Sheets',
              'Role-based access for admins, managers and staff',
              'Real-time dashboard, reports and exports',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/60">
          © {CURRENT_YEAR} Acme Corporation. All rights reserved.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
