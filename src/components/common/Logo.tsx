import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
  variant?: 'default' | 'inverse'
}

export function Logo({ className, showText = true, variant = 'default' }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-soft">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground" fill="none">
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
          <path
            d="M7.5 9h9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {showText ? (
        <div className="leading-tight">
          <p
            className={cn(
              'text-sm font-semibold tracking-tight',
              variant === 'inverse' ? 'text-white' : 'text-foreground',
            )}
          >
            Cost Management
          </p>
          <p
            className={cn(
              'text-[11px]',
              variant === 'inverse' ? 'text-white/70' : 'text-muted-foreground',
            )}
          >
            Expense Tracking
          </p>
        </div>
      ) : null}
    </div>
  )
}
