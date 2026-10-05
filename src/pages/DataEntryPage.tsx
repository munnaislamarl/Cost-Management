import { CheckCircle2, Info } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/common/PageHeader'
import { MultiEntryForm } from '@/components/records/MultiEntryForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useRecords } from '@/hooks/useRecords'
import { getErrorMessage } from '@/services/apiClient'
import type { RecordInput } from '@/types'
import { formatCurrency } from '@/utils/format'

interface LastBatch {
  count: number
  total: number
  at: string
}

export function DataEntryPage() {
  const { user } = useAuth()
  const { createMany } = useRecords()
  const [submitting, setSubmitting] = useState(false)
  const [lastBatch, setLastBatch] = useState<LastBatch | null>(null)

  const actor = user?.name ?? 'Unknown user'

  async function handleSubmit(inputs: RecordInput[]) {
    if (submitting) return
    setSubmitting(true)
    try {
      const created = await createMany(inputs, actor)
      const total = inputs.reduce((sum, input) => sum + (Number(input.costAmount) || 0), 0)
      toast.success(
        created.length === 1
          ? `Cost entry saved successfully`
          : `${created.length} cost entries saved successfully`,
      )
      setLastBatch({ count: created.length, total, at: new Date().toISOString() })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Entry"
        description="Add one or many cost purposes for the same date. Each row has its own description and remarks."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="border-b border-border">
            <div>
              <CardTitle>New Cost Entries</CardTitle>
              <CardDescription>
                Use “Add another purpose” to enter multiple costs for the same date at once.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <MultiEntryForm submitting={submitting} onSubmit={handleSubmit} />
          </CardContent>
        </Card>

        <div className="space-y-6">
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
                All rows in one save share the same date but keep separate purpose, amount,
                description and remarks.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
