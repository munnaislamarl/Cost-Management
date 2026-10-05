import {
  ArrowLeft,
  Calendar,
  Coins,
  FileText,
  History,
  Pencil,
  Printer,
  Tag,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { Spinner } from '@/components/common/Spinner'
import { RecordEditDialog } from '@/components/records/RecordEditDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { useAuth } from '@/hooks/useAuth'
import { dashboardService } from '@/services/dashboardService'
import { recordsService } from '@/services/recordsService'
import type { RecordInput } from '@/types'
import { recordMonth } from '@/utils/analytics'
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime } from '@/utils/format'
import { canEditRecords } from '@/utils/permissions'

const ACTION_STYLES: Record<string, string> = {
  create: 'bg-success',
  update: 'bg-info',
  delete: 'bg-destructive',
  archive: 'bg-warning',
  restore: 'bg-primary',
  login: 'bg-muted-foreground',
}

export function RecordViewPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [editOpen, setEditOpen] = useState(false)

  const recordResource = useAsyncResource(() => recordsService.getRecord(id), [id])
  const activityResource = useAsyncResource(() => dashboardService.getActivity(), [])

  const record = recordResource.data
  const canEdit = canEditRecords(user?.role)

  const activity = (activityResource.data ?? [])
    .filter((entry) => entry.recordId === id)
    .slice(0, 8)

  async function handleSave(_recordId: string, values: RecordInput) {
    await recordsService.update(id, values, user?.name ?? 'Unknown user')
    await recordResource.refresh()
    await activityResource.refresh()
  }

  if (recordResource.loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Loading entry…" />
      </div>
    )
  }

  if (recordResource.error || !record) {
    return (
      <Card>
        <EmptyState
          title="Entry not found"
          description={recordResource.error ?? `We could not find a cost entry with ID ${id}.`}
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('/app/records')}>
              <ArrowLeft className="h-4 w-4" />
              Back to entries
            </Button>
          }
        />
      </Card>
    )
  }

  const details: Array<{ label: string; value: React.ReactNode; icon?: React.ReactNode }> = [
    { label: 'Date', value: formatDate(record.date), icon: <Calendar className="h-4 w-4" /> },
    { label: 'Month', value: recordMonth(record) },
    {
      label: 'Costing Purpose',
      value: <Badge variant="muted">{record.costingPurpose}</Badge>,
      icon: <Tag className="h-4 w-4" />,
    },
    {
      label: 'Cost Amount',
      value: formatCurrency(record.costAmount),
      icon: <Coins className="h-4 w-4" />,
    },
    { label: 'Total Cost (running)', value: formatCurrency(record.totalCost) },
    { label: 'Created By', value: record.createdBy, icon: <User className="h-4 w-4" /> },
    { label: 'Created At', value: formatDateTime(record.createdAt) },
    { label: 'Updated By', value: record.updatedBy || '—' },
    { label: 'Updated At', value: formatDateTime(record.updatedAt) },
  ]

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title={`Cost Entry ${record.id}`}
          description={record.costDescription}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => navigate('/app/records')}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
              {canEdit ? (
                <Button size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              ) : null}
            </>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Entry Details</CardTitle>
              </div>
              <Badge variant="default">{formatCurrency(record.costAmount)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {details.map((detail) => (
                <div key={detail.label} className="space-y-1">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {detail.icon}
                    {detail.label}
                  </p>
                  <div className="text-sm font-medium text-foreground">{detail.value}</div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="grid gap-5">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Cost Description
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  {record.costDescription}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Remarks
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  {record.remarks || '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Activity history
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityResource.loading ? (
              <Spinner label="Loading activity…" />
            ) : activity.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No activity recorded for this entry yet.
              </p>
            ) : (
              <ol className="relative space-y-5 border-l border-border pl-5">
                {activity.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span
                      className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-card ${
                        ACTION_STYLES[entry.action] ?? 'bg-muted-foreground'
                      }`}
                    />
                    <p className="text-sm font-medium capitalize text-foreground">
                      {entry.action}d by {entry.actor}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.detail}</p>
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

      <div className="no-print flex justify-end">
        <Link to="/app/records" className="text-sm font-medium text-primary hover:underline">
          View all entries
        </Link>
      </div>

      <RecordEditDialog
        record={record}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSave}
      />
    </div>
  )
}
