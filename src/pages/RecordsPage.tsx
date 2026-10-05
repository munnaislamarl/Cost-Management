import { Eye, MoreHorizontal, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable, type Column } from '@/components/common/DataTable'
import { DataTablePagination } from '@/components/common/DataTablePagination'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { RecordEditDialog } from '@/components/records/RecordEditDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useRecords } from '@/hooks/useRecords'
import { getErrorMessage } from '@/services/apiClient'
import { recordsService } from '@/services/recordsService'
import type { CostRecord, RecordInput } from '@/types'
import { monthKey, recordMonth } from '@/utils/analytics'
import { COSTING_PURPOSES, DEFAULT_PAGE_SIZE } from '@/utils/constants'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { canDeleteRecords, canEditRecords } from '@/utils/permissions'

const ALL = '__all__'

export function RecordsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { records, loading, error, refresh, update, remove } = useRecords()
  const isMobile = useMediaQuery('(max-width: 767px)')

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [purpose, setPurpose] = useState(ALL)
  const [month, setMonth] = useState(ALL)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sortBy, setSortBy] = useState<keyof CostRecord>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [refreshing, setRefreshing] = useState(false)

  const [editRecord, setEditRecord] = useState<CostRecord | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmRecord, setConfirmRecord] = useState<CostRecord | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const actor = user?.name ?? 'Unknown user'
  const canEdit = canEditRecords(user?.role)
  const canDelete = canDeleteRecords(user?.role)

  const monthOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const record of records) {
      const key = monthKey(record.date)
      if (key && !map.has(key)) map.set(key, recordMonth(record))
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, label]) => ({ key, label }))
  }, [records])

  const query = useMemo(
    () => ({
      search: debouncedSearch,
      purpose: purpose === ALL ? '' : purpose,
      month: month === ALL ? '' : month,
      from,
      to,
      sortBy,
      sortDir,
      page,
      pageSize,
    }),
    [debouncedSearch, purpose, month, from, to, sortBy, sortDir, page, pageSize],
  )

  const result = useMemo(() => recordsService.query(records, query), [records, query])

  function resetPageOn(action: () => void) {
    setPage(1)
    action()
  }

  function handleSort(key: string) {
    if (sortBy === key) setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(key as keyof CostRecord)
      setSortDir('asc')
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await refresh()
      toast.success('Entries refreshed')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setRefreshing(false)
    }
  }

  async function handleSave(id: string, values: RecordInput) {
    await update(id, values, actor)
  }

  async function handleConfirmDelete() {
    if (!confirmRecord) return
    setConfirmLoading(true)
    try {
      await remove(confirmRecord.id, actor)
      toast.success(`Entry ${confirmRecord.id} deleted`)
      setConfirmRecord(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setConfirmLoading(false)
    }
  }

  const columns: Column<CostRecord>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      render: (record) => (
        <Link
          to={`/app/records/${record.id}`}
          className="font-mono text-xs font-semibold text-primary hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {record.id}
        </Link>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (record) => (
        <span className="whitespace-nowrap text-sm">{formatDate(record.date)}</span>
      ),
    },
    {
      key: 'costingPurpose',
      header: 'Costing Purpose',
      sortable: true,
      render: (record) => (
        <Badge variant="muted" className="max-w-[200px] truncate">
          {record.costingPurpose}
        </Badge>
      ),
    },
    {
      key: 'costDescription',
      header: 'Description',
      hideBelow: 'md',
      render: (record) => (
        <span className="block max-w-[260px] truncate text-sm text-muted-foreground">
          {record.costDescription}
        </span>
      ),
    },
    {
      key: 'costAmount',
      header: 'Amount',
      sortable: true,
      className: 'text-right',
      headerClassName: 'text-right',
      render: (record) => (
        <span className="whitespace-nowrap text-sm font-medium tabular-nums">
          {formatCurrency(record.costAmount)}
        </span>
      ),
    },
    {
      key: 'totalCost',
      header: 'Total Cost',
      sortable: true,
      className: 'text-right',
      headerClassName: 'text-right',
      hideBelow: 'lg',
      render: (record) => (
        <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
          {formatCurrency(record.totalCost)}
        </span>
      ),
    },
    {
      key: 'month',
      header: 'Month',
      sortable: true,
      hideBelow: 'sm',
      render: (record) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {recordMonth(record)}
        </span>
      ),
    },
    {
      key: 'createdBy',
      header: 'Created By',
      hideBelow: 'xl',
      render: (record) => (
        <span className="text-sm text-muted-foreground">{record.createdBy}</span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      sortable: true,
      hideBelow: 'xl',
      render: (record) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDateTime(record.updatedAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (record) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(event) => event.stopPropagation()}
              aria-label="Row actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/app/records/${record.id}`)}>
              <Eye className="h-4 w-4" />
              View
            </DropdownMenuItem>
            {canEdit ? (
              <DropdownMenuItem
                onClick={() => {
                  setEditRecord(record)
                  setEditOpen(true)
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
            ) : null}
            {canDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmRecord(record)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Entries"
        description="Search, filter and manage every cost entry stored in Google Sheets."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Refresh
            </Button>
            {canEdit ? (
              <Button size="sm" asChild>
                <Link to="/app/data-entry">
                  <Plus className="h-4 w-4" />
                  New entry
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <Card>
        <CardContent className="grid gap-3 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
          <SearchInput
            value={search}
            onChange={(event) => resetPageOn(() => setSearch(event.target.value))}
            onClear={() => resetPageOn(() => setSearch(''))}
            placeholder="Search purpose, description, ID…"
            aria-label="Search entries"
          />
          <Select value={purpose} onValueChange={(value) => resetPageOn(() => setPurpose(value))}>
            <SelectTrigger aria-label="Filter by purpose">
              <SelectValue placeholder="Costing purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All purposes</SelectItem>
              {COSTING_PURPOSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={month} onValueChange={(value) => resetPageOn(() => setMonth(value))}>
            <SelectTrigger aria-label="Filter by month">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All months</SelectItem>
              {monthOptions.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={from}
              onChange={(event) => resetPageOn(() => setFrom(event.target.value))}
              aria-label="From date"
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={to}
              onChange={(event) => resetPageOn(() => setTo(event.target.value))}
              aria-label="To date"
              className="flex-1"
            />
          </div>
          <Button
            variant="ghost"
            onClick={() =>
              resetPageOn(() => {
                setSearch('')
                setPurpose(ALL)
                setMonth(ALL)
                setFrom('')
                setTo('')
              })
            }
          >
            Clear filters
          </Button>
        </CardContent>
      </Card>

      {isMobile ? (
        <MobileRecordList
          records={result.rows}
          loading={loading}
          error={error}
          onRetry={refresh}
          onView={(record) => navigate(`/app/records/${record.id}`)}
          onEdit={
            canEdit
              ? (record) => {
                  setEditRecord(record)
                  setEditOpen(true)
                }
              : undefined
          }
          onDelete={canDelete ? (record) => setConfirmRecord(record) : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={result.rows}
          rowKey={(record) => record.id}
          loading={loading}
          error={error}
          onRetry={refresh}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChange={handleSort}
          emptyTitle="No cost entries found"
          emptyDescription="Adjust your search or filters, or add a new entry."
          emptyAction={
            canEdit ? (
              <Button asChild size="sm">
                <Link to="/app/data-entry">
                  <Plus className="h-4 w-4" />
                  Add entry
                </Link>
              </Button>
            ) : undefined
          }
        />
      )}

      {!isMobile ? (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={result.total}
          onPageChange={setPage}
          onPageSizeChange={(size) => resetPageOn(() => setPageSize(size))}
          loading={loading}
        />
      ) : null}

      <RecordEditDialog
        record={editRecord}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={confirmRecord != null}
        onOpenChange={(open) => {
          if (!open) setConfirmRecord(null)
        }}
        title="Delete entry?"
        description={
          confirmRecord ? (
            <>
              This permanently removes the row from Google Sheets and cannot be undone.{' '}
              <span className="font-mono font-medium text-foreground">{confirmRecord.id}</span>
            </>
          ) : undefined
        }
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        loading={confirmLoading}
      />
    </div>
  )
}

interface MobileRecordListProps {
  records: CostRecord[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onView: (record: CostRecord) => void
  onEdit?: (record: CostRecord) => void
  onDelete?: (record: CostRecord) => void
}

function MobileRecordList({
  records,
  loading,
  error,
  onRetry,
  onView,
  onEdit,
  onDelete,
}: MobileRecordListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-4">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No entries match your filters.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <Card key={record.id}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold text-primary">{record.id}</p>
                <p className="truncate text-sm font-medium text-foreground">
                  {record.costingPurpose}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(record.date)} · {recordMonth(record)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold">
                {formatCurrency(record.costAmount)}
              </span>
            </div>
            <p className="truncate text-sm text-muted-foreground">{record.costDescription}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Total {formatCurrency(record.totalCost)}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => onView(record)}>
                  <Eye className="h-4 w-4" />
                </Button>
                {onEdit ? (
                  <Button variant="ghost" size="icon-sm" onClick={() => onEdit(record)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                ) : null}
                {onDelete ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() => onDelete(record)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
