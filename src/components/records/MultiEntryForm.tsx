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

interface EntryFormProps {
  date: string
  onDateChange: (value: string) => void
  submitting?: boolean
  onSubmit: (input: RecordInput) => boolean | Promise<boolean>
}

interface EntryState {
  costingPurpose: string
  costAmount: string
  costDescription: string
  remarks: string
}

type EntryErrors = Partial<Record<keyof EntryState, string>>

function emptyEntry(): EntryState {
  return { costingPurpose: '', costAmount: '', costDescription: '', remarks: '' }
}

export function MultiEntryForm({ date, onDateChange, submitting, onSubmit }: EntryFormProps) {
  const { categories } = useCategories()
  const [entry, setEntry] = useState<EntryState>(emptyEntry)
  const [dateError, setDateError] = useState<string | null>(null)
  const [errors, setErrors] = useState<EntryErrors>({})

  function updateField(field: keyof EntryState, value: string) {
    setEntry((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function reset() {
    setEntry(emptyEntry())
    onDateChange(toInputDate())
    setDateError(null)
    setErrors({})
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

    const nextErrors: EntryErrors = {}
    if (!entry.costingPurpose) nextErrors.costingPurpose = 'Select a category'
    if (entry.costAmount.trim() === '') {
      nextErrors.costAmount = 'Enter an amount'
    } else if (Number(entry.costAmount) < 0) {
      nextErrors.costAmount = 'Amount cannot be negative'
    }
    if (entry.costDescription.trim().length < 2) nextErrors.costDescription = 'Add a description'
    setErrors(nextErrors)
    if (!valid || Object.keys(nextErrors).length > 0) return

    const input: RecordInput = {
      date,
      costingPurpose: entry.costingPurpose,
      costAmount: Number(entry.costAmount),
      costDescription: entry.costDescription.trim(),
      remarks: entry.remarks.trim(),
    }
    const handled = onSubmit(input)
    const saved = typeof handled === 'boolean' ? handled : await handled
    if (saved) reset()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-[148px] space-y-1.5">
          <Label htmlFor="entry-date">Date</Label>
          <Input
            id="entry-date"
            type="date"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(dateError)}
          />
          {dateError ? <p className="text-xs text-destructive">{dateError}</p> : null}
        </div>

        <div className="w-full min-w-[240px] flex-1 space-y-1.5">
          <Label>Cost Category</Label>
          <Select
            value={entry.costingPurpose}
            onValueChange={(value) => updateField('costingPurpose', value)}
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

        <div className="w-[130px] space-y-1.5">
          <Label htmlFor="entry-amount">Amount</Label>
          <Input
            id="entry-amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={entry.costAmount}
            onChange={(event) => updateField('costAmount', event.target.value)}
            placeholder="0.00"
            disabled={submitting}
            aria-invalid={Boolean(errors.costAmount)}
          />
          {errors.costAmount ? (
            <p className="text-xs text-destructive">{errors.costAmount}</p>
          ) : null}
        </div>

        <div className="min-w-[220px] flex-[1.4] space-y-1.5">
          <Label htmlFor="entry-description">Cost Description</Label>
          <Input
            id="entry-description"
            value={entry.costDescription}
            onChange={(event) => updateField('costDescription', event.target.value)}
            placeholder="e.g. Mirzapur + Chips + Gari Vara"
            disabled={submitting}
            aria-invalid={Boolean(errors.costDescription)}
          />
          {errors.costDescription ? (
            <p className="text-xs text-destructive">{errors.costDescription}</p>
          ) : null}
        </div>

        <div className="min-w-[160px] flex-1 space-y-1.5">
          <Label htmlFor="entry-remarks">Remarks</Label>
          <Input
            id="entry-remarks"
            value={entry.remarks}
            onChange={(event) => updateField('remarks', event.target.value)}
            placeholder="Optional (cash, bKash…)"
            disabled={submitting}
          />
        </div>

        <div className="pb-0.5">
          <Button type="submit" disabled={submitting} loading={submitting}>
            Save entry
          </Button>
        </div>
      </div>
    </form>
  )
}