import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PAGE_SIZE_OPTIONS } from '@/utils/constants'

interface DataTablePaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  loading?: boolean
}

export function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  loading,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}</span>–
        <span className="font-medium text-foreground">{end}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span> records
      </p>
      <div className="flex items-center gap-3">
        {onPageSizeChange ? (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs text-muted-foreground">Rows</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[72px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[80px] text-center text-xs font-medium text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
