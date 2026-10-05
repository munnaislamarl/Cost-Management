import { Paperclip, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'

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
import { toInputDate } from '@/utils/format'
import { type FieldRules, validateForm } from '@/utils/validation'

interface RecordFormProps {
  mode?: 'create' | 'edit'
  initialValues?: Partial<RecordInput>
  submitting?: boolean
  onSubmit: (values: RecordInput) => void
  onSaveAndNew?: (values: RecordInput) => void
  onCancel?: () => void
  submitLabel?: string
}

function emptyValues(): RecordInput {
  return {
    date: toInputDate(),
    costingPurpose: '',
    costAmount: 0,
    costDescription: '',
    remarks: '',
  }
}

const RULES: FieldRules<Record<string, unknown>> = {
  date: [(v) => (v ? null : 'Date is required')],
  costingPurpose: [(v) => (v ? null : 'Select a costing purpose')],
  costAmount: [
    (v) =>
      v === '' || v == null
        ? null
        : Number(v) >= 0
          ? null
          : 'Cost amount cannot be negative',
  ],
  costDescription: [
    (v) =>
      v && String(v).trim().length >= 2
        ? null
        : 'Provide a short cost description (min 2 chars)',
  ],
}

export function RecordForm({
  mode = 'create',
  initialValues,
  submitting,
  onSubmit,
  onSaveAndNew,
  onCancel,
  submitLabel,
}: RecordFormProps) {
  const [values, setValues] = useState<RecordInput>({
    ...emptyValues(),
    ...initialValues,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fileName, setFileName] = useState('')

  const initialSnapshot = useMemo(
    () => JSON.stringify({ ...emptyValues(), ...initialValues }),
    [initialValues],
  )

  function setField<K extends keyof RecordInput>(key: K, value: RecordInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function reset() {
    setValues(JSON.parse(initialSnapshot) as RecordInput)
    setErrors({})
    setFileName('')
  }

  function validate(): RecordInput | null {
    const normalized = { ...values, costAmount: Number(values.costAmount) }
    const found = validateForm(normalized as unknown as Record<string, unknown>, RULES)
    setErrors(found as Record<string, string>)
    if (Object.keys(found).length > 0) return null
    return normalized
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const valid = validate()
    if (!valid) return
    onSubmit(valid)
  }

  function handleSaveAndNew() {
    const valid = validate()
    if (!valid || !onSaveAndNew) return
    onSaveAndNew(valid)
    reset()
  }

  const isEdit = mode === 'edit'

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">
            Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="date"
            type="date"
            value={values.date ? values.date.slice(0, 10) : ''}
            onChange={(event) => setField('date', event.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(errors.date)}
          />
          {errors.date ? <p className="text-xs text-destructive">{errors.date}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="costAmount">
            Cost Amount <span className="text-destructive">*</span>
          </Label>
          <Input
            id="costAmount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={values.costAmount === 0 ? '' : values.costAmount}
            onChange={(event) =>
              setField(
                'costAmount',
                event.target.value === '' ? 0 : Number(event.target.value),
              )
            }
            placeholder="0.00"
            disabled={submitting}
            aria-invalid={Boolean(errors.costAmount)}
          />
          {errors.costAmount ? (
            <p className="text-xs text-destructive">{errors.costAmount}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="costingPurpose">
            Costing Purpose <span className="text-destructive">*</span>
          </Label>
          <Select
            value={values.costingPurpose}
            onValueChange={(value) => setField('costingPurpose', value)}
            disabled={submitting}
          >
            <SelectTrigger id="costingPurpose" aria-invalid={Boolean(errors.costingPurpose)}>
              <SelectValue placeholder="Select costing purpose" />
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
      </section>

      <div className="space-y-2">
        <Label htmlFor="costDescription">
          Cost Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="costDescription"
          value={values.costDescription}
          onChange={(event) => setField('costDescription', event.target.value)}
          placeholder="e.g. Mirzapur + Chips + Gari Vara"
          rows={3}
          disabled={submitting}
          aria-invalid={Boolean(errors.costDescription)}
        />
        {errors.costDescription ? (
          <p className="text-xs text-destructive">{errors.costDescription}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea
          id="remarks"
          value={values.remarks}
          onChange={(event) => setField('remarks', event.target.value)}
          placeholder="Optional notes (payment method, reference, etc.)"
          rows={2}
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="attachment">Attachment</Label>
        <label
          htmlFor="attachment"
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <Paperclip className="h-4 w-4" />
          <span className="truncate">
            {fileName || 'Attach a receipt or supporting document (placeholder)'}
          </span>
        </label>
        <input
          id="attachment"
          type="file"
          className="sr-only"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
          disabled={submitting}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        ) : null}
        {!isEdit ? (
          <Button type="button" variant="outline" onClick={reset} disabled={submitting}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        ) : null}
        {!isEdit && onSaveAndNew ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleSaveAndNew}
            disabled={submitting}
          >
            Save &amp; New
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting} loading={submitting}>
          {submitLabel ?? (isEdit ? 'Save changes' : 'Save cost entry')}
        </Button>
      </div>
    </form>
  )
}
