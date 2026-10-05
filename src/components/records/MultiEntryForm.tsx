import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { RecordInput } from '@/types'
import { COSTING_PURPOSES } from '@/utils/constants'
import { formatCurrency, toInputDate } from '@/utils/format'
import { generateId } from '@/utils/id'

interface RowState {
  key: string
  costingPurpose: string
  costAmount: string
  costDescription: string
  remarks: string
}

type RowErrors = Partial<Record<keyof RowState, string>>

interface MultiEntryFormProps {
  submitting?: boolean
  onSubmit: (inputs: RecordInput[]) => void
  onCancel?: () => void
}

function newRow(): RowState {
  return {
    key: generateId('row'),
    costingPurpose: '',
    costAmount: '',
    costDescription: '',
    remarks: '',
  }
}

export function MultiEntryForm({ submitting, onSubmit, onCancel }: MultiEntryFormProps) {
  const [date, setDate] = useState(() => toInputDate())
  const [rows, setRows] = useState<RowState[]>(() => [newRow()])
  const [dateError, setDateError] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<string, RowErrors>>({})

  const localTotal = rows.reduce((sum, row) => sum + (Number(row.costAmount) || 0), 0)

  function updateRow(key: string, patch: Partial<RowState>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)))
    setRowErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      const fields = Object.keys(patch) as (keyof RowErrors)[]
      const remaining = { ...next[key] }
      for (const field of fields) delete remaining[field]
      if (Object.keys(remaining).length === 0) delete next[key]
      else next[key] = remaining
      return next
    })
  }

  function addRow() {
    setRows((prev) => [...prev, newRow()])
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.key !== key)))
    setRowErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function reset() {
    setDate(toInputDate())
    setRows([newRow()])
    setDateError(null)
    setRowErrors({})
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    let valid = true

    if (!date) {
      setDateError('Date is required')
      valid = false
    } else {
      setDateError(null)
    }

    const errors: Record<string, RowErrors> = {}
    for (const row of rows) {
      const rowError: RowErrors = {}
      if (!row.costingPurpose) rowError.costingPurpose = 'Select a purpose'
      if (row.costAmount.trim() !== '' && Number(row.costAmount) < 0) {
        rowError.costAmount = 'Amount cannot be negative'
      }
      if (row.costDescription.trim().length < 2) rowError.costDescription = 'Add a description'
      if (Object.keys(rowError).length > 0) {
        errors[row.key] = rowError
        valid = false
      }
    }
    setRowErrors(errors)
    if (!valid) return

    const inputs: RecordInput[] = rows.map((row) => ({
      date,
      costingPurpose: row.costingPurpose,
      costAmount: Number(row.costAmount),
      costDescription: row.costDescription.trim(),
      remarks: row.remarks.trim(),
    }))
    onSubmit(inputs)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-[220px] space-y-2">
          <Label htmlFor="entry-date">
            Date (applies to all rows) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="entry-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(dateError)}
          />
          {dateError ? <p className="text-xs text-destructive">{dateError}</p> : null}
        </div>
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Batch total
          </p>
          <p className="text-sm font-semibold text-primary tabular-nums">
            {formatCurrency(localTotal)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((row, index) => {
          const errors = rowErrors[row.key] ?? {}
          return (
            <div
              key={row.key}
              className="rounded-xl border border-border bg-muted/20 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeRow(row.key)}
                  disabled={submitting || rows.length === 1}
                  aria-label="Remove row"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Costing Purpose <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={row.costingPurpose}
                    onValueChange={(value) => updateRow(row.key, { costingPurpose: value })}
                    disabled={submitting}
                  >
                    <SelectTrigger aria-invalid={Boolean(errors.costingPurpose)}>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {COSTING_PURPOSES.map((purpose) => (
                        <SelectItem key={purpose} value={purpose}>
                          {purpose}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.costingPurpose ? (
                    <p className="text-xs text-destructive">{errors.costingPurpose}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>
                    Cost Amount <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={row.costAmount}
                    onChange={(event) => updateRow(row.key, { costAmount: event.target.value })}
                    placeholder="0.00"
                    disabled={submitting}
                    aria-invalid={Boolean(errors.costAmount)}
                  />
                  {errors.costAmount ? (
                    <p className="text-xs text-destructive">{errors.costAmount}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>
                    Cost Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={row.costDescription}
                    onChange={(event) =>
                      updateRow(row.key, { costDescription: event.target.value })
                    }
                    placeholder="e.g. Mirzapur + Chips + Gari Vara"
                    rows={2}
                    disabled={submitting}
                    aria-invalid={Boolean(errors.costDescription)}
                  />
                  {errors.costDescription ? (
                    <p className="text-xs text-destructive">{errors.costDescription}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={row.remarks}
                    onChange={(event) => updateRow(row.key, { remarks: event.target.value })}
                    placeholder="Optional notes (cash, bKash, reference…)"
                    rows={2}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Button type="button" variant="outline" onClick={addRow} disabled={submitting}>
        <Plus className="h-4 w-4" />
        Add another purpose
      </Button>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={reset} disabled={submitting}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button type="submit" disabled={submitting} loading={submitting}>
          Save {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
        </Button>
      </div>
    </form>
  )
}
