import { AlertCircle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this data. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      ) : null}
    </div>
  )
}
