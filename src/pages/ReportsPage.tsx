import { Coins, Download, ListChecks, Printer, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
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
import { toast } from 'sonner'

import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { recordsService } from '@/services/recordsService'
import { applyRecordFilter, computeReportData, monthKey, monthLabel, recordMonth } from '@/utils/analytics'
import { COSTING_PURPOSES } from '@/utils/constants'
import { buildFilename, downloadCsv, toCsv } from '@/utils/csv'
import { formatCompactNumber, formatCurrency, formatDate, formatNumber } from '@/utils/format'

const ALL = '__all__'
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
  '#db2777',
  '#65a30d',
]

export function ReportsPage() {
  const [purpose, setPurpose] = useState(ALL)
  const [month, setMonth] = useState(ALL)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const resource = useAsyncResource(() => recordsService.fetchAll(), [])

  const monthOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const record of resource.data ?? []) {
      const key = monthKey(record.date)
      if (key && !map.has(key)) map.set(key, recordMonth(record))
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, label]) => ({ key, label }))
  }, [resource.data])

  const filtered = useMemo(
    () =>
      applyRecordFilter(resource.data ?? [], {
        purpose: purpose === ALL ? undefined : purpose,
        month: month === ALL ? undefined : month,
        from: from || undefined,
        to: to || undefined,
      }),
    [resource.data, purpose, month, from, to],
  )

  const report = useMemo(() => computeReportData(filtered), [filtered])

  function handleExport() {
    if (filtered.length === 0) {
      toast.error('There is no data to export for the selected filters.')
      return
    }
    const rows = filtered.map((record) => ({
      ID: record.id,
      DATE: record.date,
      MONTH: record.month,
      COSTING_PURPOSE: record.costingPurpose,
      COST_AMOUNT: record.costAmount,
      COST_DESCRIPTION: record.costDescription,
      TOTAL_COST: record.totalCost,
      REMARKS: record.remarks,
      CREATED_BY: record.createdBy,
      CREATED_AT: record.createdAt,
      UPDATED_BY: record.updatedBy,
      UPDATED_AT: record.updatedAt,
    }))
    downloadCsv(buildFilename('cost-report', 'csv'), toCsv(rows))
    toast.success(`Exported ${rows.length} entries to CSV`)
  }

  if (resource.error) {
    return (
      <Card>
        <ErrorState description={resource.error} onRetry={resource.refresh} />
      </Card>
    )
  }

  const loading = resource.loading

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title="Cost Reports"
          description="Analyse spending by purpose and month, then export board-ready summaries."
          actions={
            <>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} disabled={loading}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </>
          }
        />
      </div>

      <Card className="no-print">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
          <div className="space-y-2">
            <Label htmlFor="report-purpose">Costing Purpose</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger id="report-purpose">
                <SelectValue placeholder="All purposes" />
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-month">Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger id="report-month">
                <SelectValue placeholder="All months" />
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-from">From date</Label>
            <Input
              id="report-from"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-to">To date</Label>
            <Input
              id="report-to"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Cost"
          value={formatCurrency(report.summary.totalCost)}
          icon={Coins}
          loading={loading}
        />
        <StatCard
          title="This Month"
          value={formatCurrency(report.summary.monthCost)}
          icon={TrendingUp}
          tone="info"
          loading={loading}
        />
        <StatCard
          title="Total Entries"
          value={report.summary.totalEntries}
          icon={ListChecks}
          tone="success"
          loading={loading}
        />
        <StatCard
          title="Average / Entry"
          value={formatCurrency(report.summary.averageCost)}
          icon={TrendingUp}
          tone="warning"
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>Cost by month for the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={report.monthly} margin={{ left: -8, right: 8, top: 8 }}>
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
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    name="Monthly cost"
                    stroke="#287a57"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    name="Cumulative"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purpose Breakdown</CardTitle>
            <CardDescription>Share of spending by costing purpose</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : report.purposes.length === 0 ? (
              <p className="py-20 text-center text-sm text-muted-foreground">No cost data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={report.purposes}
                    dataKey="cost"
                    nameKey="purpose"
                    innerRadius={58}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {report.purposes.map((entry, index) => (
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
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spending by Purpose</CardTitle>
          <CardDescription>Cost grouped by costing purpose</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : report.purposes.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No cost data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report.purposes} margin={{ left: -8, right: 8, top: 8, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="purpose"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  stroke="hsl(var(--muted-foreground))"
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={80}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Purpose Summary</CardTitle>
            <CardDescription>Entries, total and share per purpose</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {loading ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-9 w-full" />
                ))}
              </div>
            ) : report.purposes.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Purpose</TableHead>
                      <TableHead className="text-right">Entries</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.purposes.map((entry) => (
                      <TableRow key={entry.purpose}>
                        <TableCell className="max-w-[220px] truncate font-medium">
                          {entry.purpose}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(entry.entries)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(entry.cost)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {entry.share}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
            <CardDescription>All months with recorded spending</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {loading ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-9 w-full" />
                ))}
              </div>
            ) : report.months.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data.</p>
            ) : (
              <div className="max-h-[420px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Entries</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.months.map((entry) => (
                      <TableRow key={entry.month}>
                        <TableCell className="font-medium">{entry.month}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(entry.entries)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(entry.cost)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Entries</CardTitle>
          <CardDescription>
            {formatNumber(filtered.length)} entries in the current selection
            {month !== ALL ? ` · ${monthLabel(new Date(`${month}-01T00:00:00`))}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No entries match the selected filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Month</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 50).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-xs">{record.id}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(record.date)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{record.costingPurpose}</TableCell>
                      <TableCell className="hidden max-w-[260px] truncate text-muted-foreground md:table-cell">
                        {record.costDescription}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(record.costAmount)}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground sm:table-cell">
                        {recordMonth(record)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length > 50 ? (
                <p className="px-5 py-3 text-center text-xs text-muted-foreground">
                  Showing the first 50 of {formatNumber(filtered.length)} entries. Export CSV for the
                  full dataset.
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
