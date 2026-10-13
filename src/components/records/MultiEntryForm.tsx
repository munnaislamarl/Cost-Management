import { Plus, Save, Trash2 } from 'lucide-react'
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
import { useCategories } from '@/hooks/useCategories'
import type { RecordInput } from '@/types'
import { toInputDate } from '@/utils/format'
import { generateId } from '@/utils/id'

interface RowState {
  key: string
  costingPurpose: string
  costAmount: string
  costDescription: string
  remarks: string
}

type RowErrors = Partial<Record<keyof RowState, string>>

interface EntryFormProps {
  date: string
  onDateChange: (value: string) => void
  submitting?: boolean
  onSubmit: (inputs: RecordInput[]) => boolean | Promise<boolean>
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

export function MultiEntryForm({ date, onDateChange, submitting, onSubmit }: EntryFormProps) {
  const { categories } = useCategories()
  const [rows, setRows] = useState<RowState[]>(() => [newRow()])
  const [dateError, setDateError] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<string, RowErrors>>({})

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
    setRows([newRow()])
    onDateChange(toInputDate())
    setDateError(null)
    setRowErrors({})
  }

  async function handleSubmit(event: React.FormEvent) {
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
      if (!row.costingPurpose) rowError.costingPurpose = 'Select a category'
      if (row.costAmount.trim() === '') {
        rowError.costAmount = 'Enter an amount'
      } else if (Number(row.costAmount) < 0) {
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
    const handled = onSubmit(inputs)
    const saved = typeof handled === 'boolean' ? handled : await handled
    if (saved) reset()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="max-w-[260px] space-y-1.5">
        <Label htmlFor="entry-date">
          Date <span className="text-destructive">*</span>
        </Label>
        <Input
          id="entry-date"
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          onClick={(event) => {
            const input = event.currentTarget as HTMLInputElement & {
              showPicker?: () => void
            }
            try {
              input.showPicker?.()
            } catch {
              // picker already open or unsupported — ignore
            }
          }}
          disabled={submitting}
          aria-invalid={Boolean(dateError)}
        />
        {dateError ? <p className="text-xs text-destructive">{dateError}</p> : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="hidden items-center gap-2 border-b border-border bg-muted/40 px-3 py-2 md:flex">
          <span className="h-5 w-5 shrink-0" />
          <div className="grid min-w-0 flex-1 gap-x-3 md:grid-cols-4">
            <span className="text-xs font-medium text-muted-foreground">Cost Category</span>
            <span className="text-xs font-medium text-muted-foreground">Amount</span>
            <span className="text-xs font-medium text-muted-foreground">Cost Description</span>
            <span className="text-xs font-medium text-muted-foreground">Remarks</span>
          </div>
          <span className="h-6 w-6 shrink-0" />
        </div>

        <div className="divide-y divide-border">
          {rows.map((row, index) => {
          const errors = rowErrors[row.key] ?? {}
          return (
            <div key={row.key} className="p-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold leading-none text-primary">
                  {index + 1}
                </span>

                <div className="grid min-w-0 flex-1 gap-x-3 gap-y-2 md:grid-cols-4">
                <div className="space-y-1">
                  <Label className="md:hidden">Cost Category</Label>
                  <Select
                    value={row.costingPurpose}
                    onValueChange={(value) => updateRow(row.key, { costingPurpose: value })}
                    disabled={submitting}
                  >
                    <SelectTrigger aria-invalid={Boolean(errors.costingPurpose)}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.costingPurpose ? (
                    <p className="text-xs text-destructive">{errors.costingPurpose}</p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <Label className="md:hidden">Amount</Label>
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

                <div className="space-y-1">
                  <Label className="md:hidden">Cost Description</Label>
                  <Input
                    value={row.costDescription}
                    onChange={(event) =>
                      updateRow(row.key, { costDescription: event.target.value })
                    }
                    placeholder="e.g. Mirzapur + Chips + Gari Vara"
                    disabled={submitting}
                    aria-invalid={Boolean(errors.costDescription)}
                  />
                  {errors.costDescription ? (
                    <p className="text-xs text-destructive">{errors.costDescription}</p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <Label className="md:hidden">Remarks</Label>
                  <Input
                    value={row.remarks}
                    onChange={(event) => updateRow(row.key, { remarks: event.target.value })}
                    placeholder="Optional (cash, bKash…)"
                    disabled={submitting}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeRow(row.key)}
                disabled={submitting || rows.length === 1}
                aria-label="Remove entry"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          )
          })}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" disabled={submitting} loading={submitting}>
          <Save className="h-4 w-4" />
          Save Entry
        </Button>
        <Button type="button" variant="outline" onClick={addRow} disabled={submitting}>
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>
    </form>
  )
}