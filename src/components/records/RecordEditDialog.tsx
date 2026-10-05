import { useState } from 'react'
import { toast } from 'sonner'

import { RecordForm } from '@/components/records/RecordForm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getErrorMessage } from '@/services/apiClient'
import type { CostRecord, RecordInput } from '@/types'

interface RecordEditDialogProps {
  record: CostRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, values: RecordInput) => Promise<void>
}

export function RecordEditDialog({
  record,
  open,
  onOpenChange,
  onSave,
}: RecordEditDialogProps) {
  const [submitting, setSubmitting] = useState(false)

  if (!record) return null

  async function handleSubmit(values: RecordInput) {
    if (!record) return
    setSubmitting(true)
    try {
      await onSave(record.id, values)
      toast.success(`Entry ${record.id} updated successfully`)
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit cost entry</DialogTitle>
          <DialogDescription>
            Update the details for <span className="font-mono">{record.id}</span>. Changes
            are written back to Google Sheets with your name and timestamp.
          </DialogDescription>
        </DialogHeader>
        <RecordForm
          key={`${record.id}-${open}`}
          mode="edit"
          submitting={submitting}
          initialValues={{
            date: record.date,
            costingPurpose: record.costingPurpose,
            costAmount: record.costAmount,
            costDescription: record.costDescription,
            remarks: record.remarks,
          }}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
