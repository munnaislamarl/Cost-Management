import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/format'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  hint?: string
  trend?: number
  tone?: 'primary' | 'info' | 'warning' | 'success' | 'destructive'
  isCurrency?: boolean
  loading?: boolean
  className?: string
}

const TONES: Record<NonNullable<StatCardProps['tone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/15 text-warning',
  success: 'bg-success/10 text-success',
  destructive: 'bg-destructive/10 text-destructive',
}

export function StatCard({
  title,
  value,
  icon: Icon,
  hint,
  trend,
  tone = 'primary',
  isCurrency,
  loading,
  className,
}: StatCardProps) {
  const display =
    typeof value === 'string' ? value : isCurrency ? value : formatNumber(value)

  const isText = typeof value === 'string' && value.trim() !== ''
  const isLongText = isText && String(value).length > 12

  return (
    <Card className={cn('h-full overflow-hidden', className)}>
      <CardContent className="flex h-full min-h-[104px] items-center justify-between gap-3 p-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <div className="mt-1.5">
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p
                className={cn(
                  'font-semibold tracking-tight text-foreground',
                  isLongText
                    ? 'line-clamp-2 text-lg leading-snug'
                    : 'truncate text-2xl leading-tight',
                )}
                title={isText ? String(value) : undefined}
              >
                {display}
              </p>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            {typeof trend === 'number' && !loading ? (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  trend >= 0 ? 'text-success' : 'text-destructive',
                )}
              >
                {trend >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {Math.abs(trend)}%
              </span>
            ) : null}
            {hint ? (
              <span className="truncate text-xs text-muted-foreground">{hint}</span>
            ) : null}
          </div>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            TONES[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}
