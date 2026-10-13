import { CheckCircle2, History, Info } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/common/PageHeader'
import { MultiEntryForm } from '@/components/records/MultiEntryForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useRecords } from '@/hooks/useRecords'
import { getErrorMessage } from '@/services/apiClient'
import type { CostRecord, RecordInput } from '@/types'
import { sumCost } from '@/utils/analytics'
import { formatCurrency, formatDate, parseDate, toInputDate } from '@/utils/format'

interface LastBatch {
  count: number
  total: number
  at: string
}

interface PreviousDay {
  date: string
  entries: number
  total: number
  purposes: Array<[string, number]>
}

export function DataEntryPage() {
  const { user } = useAuth()
  const { records, createMany } = useRecords()
  const [submitting, setSubmitting] = useState(false)
  const [lastBatch, setLastBatch] = useState<LastBatch | null>(null)
  const [entryDate, setEntryDate] = useState(() => toInputDate())

  const actor = user?.name ?? 'Unknown user'

  const previousDay = useMemo<PreviousDay | null>(() => {
    if (!records.length || !entryDate) return null
    const selected = parseDate(entryDate)
    if (!selected) return null

    const byDate = new Map<string, CostRecord[]>()
    for (const record of records) {
      const parsed = parseDate(record.date)
      if (!parsed) continue
      const key = toInputDate(parsed)
      const list = byDate.get(key) ?? []
      list.push(record)
      byDate.set(key, list)
    }

    const selectedKey = toInputDate(selected)
    const prior = Array.from(byDate.keys())
      .filter((key) => key < selectedKey)
      .sort()
      .pop()
    if (!prior) return null

    const dayRecords = byDate.get(prior) ?? []
    const purposeTotals = new Map<string, number>()
    for (const record of dayRecords) {
      const name = record.costingPurpose || 'Uncategorised'
      purposeTotals.set(name, (purposeTotals.get(name) ?? 0) + (Number(record.costAmount) || 0))
    }

    return {
      date: prior,
      entries: dayRecords.length,
      total: sumCost(dayRecords),
      purposes: Array.from(purposeTotals.entries()).sort((a, b) => b[1] - a[1]),
    }
  }, [records, entryDate])

  async function handleSubmit(inputs: RecordInput[]): Promise<boolean> {
    if (submitting) return false
    setSubmitting(true)
    try {
      await createMany(inputs, actor)
      const total = inputs.reduce((sum, input) => sum + (Number(input.costAmount) || 0), 0)
      toast.success(
        inputs.length === 1
          ? 'Cost entry saved successfully'
          : `${inputs.length} cost entries saved successfully`,
      )
      setLastBatch({ count: inputs.length, total, at: new Date().toISOString() })
      return true
    } catch (error) {
      toast.error(getErrorMessage(error))
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cost Entry"
        description="Add one or many cost entries for the same date — then save them all at once."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader className="border-b border-border">
            <div>
              <CardTitle>New Cost Entry</CardTitle>
              <CardDescription>
                Pick a date, add one or more entry rows, then save. Every row is recorded
                under the selected date.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <MultiEntryForm
              date={entryDate}
              onDateChange={setEntryDate}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entry details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Created by</span>
                <span className="font-medium text-foreground">{actor}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Total Cost</span>
                <span className="font-medium text-foreground">Auto running total</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Month</span>
                <span className="font-medium text-foreground">Auto from date</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <History className="h-4 w-4 text-primary" />
                Previous day
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {previousDay ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      {formatDate(previousDay.date)}
                    </span>
                    <span className="font-medium text-foreground">
                      {previousDay.entries} {previousDay.entries === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Total
                    </p>
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {formatCurrency(previousDay.total)}
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    {previousDay.purposes.map(([name, amount]) => (
                      <li key={name} className="flex items-center justify-between gap-2">
                        <span className="truncate text-muted-foreground">{name}</span>
                        <span className="shrink-0 text-foreground tabular-nums">
                          {formatCurrency(amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-muted-foreground">No entries on the previous day yet.</p>
              )}
            </CardContent>
          </Card>

          {lastBatch ? (
            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Last batch saved
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>
                  {lastBatch.count} {lastBatch.count === 1 ? 'entry' : 'entries'} ·{' '}
                  {formatCurrency(lastBatch.total)}
                </p>
                <p>{new Date(lastBatch.at).toLocaleString()}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card className="bg-muted/30">
            <CardContent className="flex gap-3 p-5 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                All rows in one save share the selected date but keep their own category,
                amount, description and remarks. The previous day's summary updates as you
                change the date above.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}