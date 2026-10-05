import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { ReactNode } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  sortable?: boolean
  className?: string
  headerClassName?: string
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSortChange?: (key: string) => void
  onRowClick?: (row: T) => void
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: Parameters<typeof EmptyState>[0]['icon']
  emptyAction?: ReactNode
  skeletonRows?: number
}

const HIDE_CLASSES: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading,
  error,
  onRetry,
  sortBy,
  sortDir,
  onSortChange,
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filters, or add a new record.',
  emptyIcon,
  emptyAction,
  skeletonRows = 6,
}: DataTableProps<T>) {
  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <ErrorState description={error} onRetry={onRetry} />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((column) => {
              const isActive = column.sortable && sortBy === column.key
              return (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.hideBelow ? HIDE_CLASSES[column.hideBelow] : undefined,
                    column.headerClassName,
                  )}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange?.(column.key)}
                      className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {column.header}
                      {isActive ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        column.hideBelow ? HIDE_CLASSES[column.hideBelow] : undefined,
                        column.className,
                      )}
                    >
                      <Skeleton className="h-4 w-full max-w-[140px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : data.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        column.hideBelow ? HIDE_CLASSES[column.hideBelow] : undefined,
                        column.className,
                      )}
                    >
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>
      {!loading && data.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={emptyIcon}
          action={emptyAction}
        />
      ) : null}
    </div>
  )
}
