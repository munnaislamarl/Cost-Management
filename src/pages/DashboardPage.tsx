import {
  Activity,
  CalendarDays,
  Coins,
  ListChecks,
  Plus,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { StatCard } from '@/components/common/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { useAuth } from '@/hooks/useAuth'
import { dashboardService } from '@/services/dashboardService'
import { monthKey, recordMonth, sumCost } from '@/utils/analytics'
import { COSTING_PURPOSES } from '@/utils/constants'
import { formatCompactNumber, formatCurrency, formatDate, formatRelativeTime } from '@/utils/format'
import { canCreateRecords } from '@/utils/permissions'

const PIE_COLORS = [
  '#287a57',
  '#3f9d78',
  '#5fb894',
  '#8fd0b3',
  '#b9e2cf',
  '#0284c7',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#0f766e',
]

const ACTION_DOT: Record<string, string> = {
  create: 'bg-success',
  update: 'bg-info',
  delete: 'bg-destructive',
  archive: 'bg-warning',
  restore: 'bg-primary',
  login: 'bg-muted-foreground',
}

const ALL = '__all__'

export function DashboardPage() {
  const { user } = useAuth()
  const canCreate = canCreateRecords(user?.role)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedMonthKey, setSelectedMonthKey] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterPurpose, setFilterPurpose] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const filterCardRef = useRef<HTMLDivElement>(null)

  function showFilteredEntries(monthKeyValue: string, purposeName: string) {
    setFilterMonth(monthKeyValue)
    setFilterPurpose(purposeName)
    setFilterSearch('')
    window.setTimeout(() => {
      filterCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  const resource = useAsyncResource(() => dashboardService.getDashboard(), [])

  const dataRecords = resource.data?.records ?? []

  const filterMonthOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const record of dataRecords) {
      const key = monthKey(record.date)
      if (key && !map.has(key)) map.set(key, recordMonth(record))
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, label]) => ({ key, label }))
  }, [dataRecords])

  const filteredRecords = useMemo(() => {
    const term = filterSearch.trim().toLowerCase()
    return dataRecords
      .filter((record) => {
        if (filterMonth && monthKey(record.date) !== filterMonth) return false
        if (filterPurpose && record.costingPurpose !== filterPurpose) return false
        if (term) {
          const haystack = [
            record.id,
            record.costingPurpose,
            record.costDescription,
            record.remarks,
            record.createdBy,
          ]
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(term)) return false
        }
        return true
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [dataRecords, filterMonth, filterPurpose, filterSearch])

  if (resource.error) {
    return (
      <Card>
        <ErrorState description={resource.error} onRetry={resource.refresh} />
      </Card>
    )
  }

  const stats = resource.data?.stats
  const report = resource.data?.report
  const activity = resource.data?.activity ?? []
  const recent = resource.data?.recentRecords ?? []
  const topPurposes = (report?.purposes ?? []).slice(0, 8)
  const loading = resource.loading

  const byMonth = report?.byMonth ?? []
  const defaultMonthKey = byMonth.length ? byMonth[byMonth.length - 1].monthKey : ''
  const activeMonthKey = selectedMonthKey || defaultMonthKey
  const selectedMonth =
    byMonth.find((entry) => entry.monthKey === activeMonthKey) ??
    (byMonth.length ? byMonth[byMonth.length - 1] : undefined)
  const monthTotal = selectedMonth?.totalCost ?? 0
  const grandTotal = byMonth.reduce((sum, entry) => sum + entry.totalCost, 0)
  const filterTotal = sumCost(filteredRecords)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Management Dashboard"
        description={`Spending overview for ${user?.name ?? 'your account'}. All figures come from your Google Sheet.`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || refreshing}
              onClick={async () => {
                setRefreshing(true)
                try {
                  await resource.refresh()
                } finally {
                  setRefreshing(false)
                }
              }}
            >
              <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Refresh
            </Button>
            {canCreate ? (
              <Button asChild size="sm">
                <Link to="/app/data-entry">
                  <Plus className="h-4 w-4" />
                  Add cost entry
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Cost"
          value={formatCurrency(stats?.totalCost ?? 0)}
          icon={Coins}
          tone="primary"
          hint="All recorded spending"
          loading={loading}
        />
        <StatCard
          title="This Month"
          value={formatCurrency(stats?.monthCost ?? 0)}
          icon={CalendarDays}
          tone="info"
          hint="Current month cost"
          loading={loading}
        />
        <StatCard
          title="Total Entries"
          value={stats?.totalEntries ?? 0}
          icon={ListChecks}
          tone="success"
          hint="Number of cost rows"
          loading={loading}
        />
        <StatCard
          title="Average / Entry"
          value={formatCurrency(stats?.averageCost ?? 0)}
          icon={TrendingUp}
          tone="warning"
          hint="Mean cost per entry"
          loading={loading}
        />
        <StatCard
          title="Top Purpose"
          value={stats?.topPurpose ?? '—'}
          icon={Activity}
          tone="primary"
          hint={formatCurrency(stats?.topPurposeCost ?? 0)}
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Purpose Breakdown</CardTitle>
              <CardDescription>
                {selectedMonth?.month ?? '—'} cost by costing purpose
              </CardDescription>
            </div>
            <div className="w-full sm:w-[190px]">
              <Select value={activeMonthKey} onValueChange={setSelectedMonthKey}>
                <SelectTrigger aria-label="Select month">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {byMonth.map((entry) => (
                    <SelectItem key={entry.monthKey} value={entry.monthKey}>
                      {entry.month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {loading ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-9 w-full" />
                ))}
              </div>
            ) : byMonth.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No cost data yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Costing Purpose</TableHead>
                      <TableHead className="text-right">Cost Amount</TableHead>
                      <TableHead className="hidden text-right sm:table-cell">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedMonth?.purposes ?? []).map((purpose) => (
                      <TableRow
                        key={purpose.purpose}
                        onClick={() =>
                          showFilteredEntries(selectedMonth?.monthKey ?? '', purpose.purpose)
                        }
                        className="cursor-pointer transition-colors hover:bg-primary/5"
                        title="Click to see these entries in Filter Data below"
                      >
                        <TableCell className="max-w-[220px] truncate font-medium">
                          {purpose.purpose}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(purpose.cost)}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                          {purpose.share}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold">Month Total Cost</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCurrency(monthTotal)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell" />
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Totals</CardTitle>
            <CardDescription>Total cost for each month with recorded spending</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {loading ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-9 w-full" />
                ))}
              </div>
            ) : byMonth.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No cost data yet.
              </p>
            ) : (
              <div className="max-h-[420px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byMonth.map((entry) => (
                      <TableRow
                        key={entry.monthKey}
                        className={
                          entry.monthKey === activeMonthKey
                            ? 'bg-primary/5'
                            : undefined
                        }
                        onClick={() => setSelectedMonthKey(entry.monthKey)}
                      >
                        <TableCell className="font-medium">{entry.month}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(entry.totalCost)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold">Total</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCurrency(grandTotal)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card ref={filterCardRef} className="scroll-mt-20">
        <CardHeader className="flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Filter Data</CardTitle>
            <CardDescription>
              Filter by month and costing purpose — every matching entry appears below.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="w-full sm:w-[170px]">
              <Select
                value={filterMonth || ALL}
                onValueChange={(value) => setFilterMonth(value === ALL ? '' : value)}
              >
                <SelectTrigger aria-label="Filter by month">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All months</SelectItem>
                  {filterMonthOptions.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-[230px]">
              <Select
                value={filterPurpose || ALL}
                onValueChange={(value) => setFilterPurpose(value === ALL ? '' : value)}
              >
                <SelectTrigger aria-label="Filter by costing purpose">
                  <SelectValue placeholder="All purposes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All purposes</SelectItem>
                  {COSTING_PURPOSES.map((purpose) => (
                    <SelectItem key={purpose} value={purpose}>
                      {purpose}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-[220px]">
              <SearchInput
                value={filterSearch}
                onChange={(event) => setFilterSearch(event.target.value)}
                onClear={() => setFilterSearch('')}
                placeholder="Search entries…"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="max-h-[520px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[64px]">#</TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Costing Purpose</TableHead>
                  <TableHead className="hidden md:table-cell">Cost Description / Remarks</TableHead>
                  <TableHead className="text-right">Cost Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record, index) => (
                  <TableRow key={`${record.id}-${index}`}>
                    <TableCell className="text-sm text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(record.date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="muted" className="max-w-[220px] truncate">
                        {record.costingPurpose}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden max-w-[320px] truncate text-sm text-muted-foreground md:table-cell">
                      {record.costDescription?.trim() || record.remarks || '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums">
                      {formatCurrency(record.costAmount)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      No entries match this filter.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-semibold">
                    Filtered total ({filteredRecords.length}{' '}
                    {filteredRecords.length === 1 ? 'entry' : 'entries'})
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(filterTotal)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Spending</CardTitle>
            <CardDescription>Cost per month over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={report?.monthly ?? []} margin={{ left: -8, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#287a57" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#287a57" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => formatCompactNumber(Number(value))}
                  />
                  <RechartsTooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))',
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    name="Cost"
                    stroke="#287a57"
                    strokeWidth={2}
                    fill="url(#costFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purpose Share</CardTitle>
            <CardDescription>Distribution of spending by purpose</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : topPurposes.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No cost data yet.
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={topPurposes}
                      dataKey="cost"
                      nameKey="purpose"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {topPurposes.map((entry, index) => (
                        <Cell key={entry.purpose} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--card))',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {topPurposes.slice(0, 5).map((entry, index) => (
                    <div key={entry.purpose} className="flex items-center justify-between text-xs">
                      <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="truncate">{entry.purpose}</span>
                      </span>
                      <span className="shrink-0 font-medium text-foreground">{entry.share}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Spending by Purpose</CardTitle>
            <CardDescription>Top costing purposes by total amount</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : topPurposes.length === 0 ? (
              <p className="py-20 text-center text-sm text-muted-foreground">No cost data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topPurposes} margin={{ left: -8, right: 8, top: 8, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="purpose"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    stroke="hsl(var(--muted-foreground))"
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => formatCompactNumber(Number(value))}
                  />
                  <RechartsTooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="cost" name="Cost" fill="#287a57" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest changes across the workspace</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-border pl-5">
                {activity.slice(0, 6).map((entry) => (
                  <li key={entry.id} className="relative">
                    <span
                      className={`absolute -left-[26px] top-1.5 h-3 w-3 rounded-full ring-4 ring-card ${
                        ACTION_DOT[entry.action] ?? 'bg-muted-foreground'
                      }`}
                    />
                    <p className="text-sm font-medium capitalize text-foreground">
                      {entry.action} · {entry.actor}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{entry.detail}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(entry.timestamp)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Cost Entries</CardTitle>
              <CardDescription>Your most recently created entries</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/records">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Date</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Month</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          {Array.from({ length: 5 }).map((__, cell) => (
                            <TableCell key={cell}>
                              <Skeleton className="h-4 w-full max-w-[120px]" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : recent.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDate(record.date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="muted" className="max-w-[180px] truncate">
                              {record.costingPurpose}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden max-w-[260px] truncate text-sm text-muted-foreground md:table-cell">
                            {record.costDescription}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium tabular-nums">
                            {formatCurrency(record.costAmount)}
                          </TableCell>
                          <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground sm:table-cell">
                            {recordMonth(record)}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
            {!loading && recent.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No cost entries yet. Add your first entry to see it here.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cumulative Cost</CardTitle>
            <CardDescription>Running total over the year</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={report?.monthly ?? []} margin={{ left: -8, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => formatCompactNumber(Number(value))}
                  />
                  <RechartsTooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))',
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    name="Monthly"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    name="Cumulative"
                    stroke="#287a57"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
