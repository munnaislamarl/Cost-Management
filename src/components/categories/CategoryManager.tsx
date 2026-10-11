import { Plus, Tags, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { getErrorMessage } from '@/services/apiClient'
import { categoriesService } from '@/services/categoriesService'

export function CategoryManager() {
  const { user } = useAuth()
  const { categories, refresh } = useCategories()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmCategory, setConfirmCategory] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleAdd() {
    const cleaned = name.trim()
    if (!cleaned) {
      toast.error('Enter a category name first.')
      return
    }
    if (categories.some((item) => item.toLowerCase() === cleaned.toLowerCase())) {
      toast.error('That category already exists.')
      return
    }
    setBusy(true)
    try {
      await categoriesService.create(cleaned, user?.name ?? 'System Administrator')
      await refresh()
      setName('')
      toast.success(`Category "${cleaned}" added`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirmCategory || deleting) return
    setDeleting(true)
    try {
      await categoriesService.remove(confirmCategory)
      await refresh()
      toast.success(`Category "${confirmCategory}" removed`)
      setConfirmCategory(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-4 w-4 text-primary" />
            Cost Categories
          </CardTitle>
          <CardDescription>
            Add new categories for cost entries, or remove unused ones. Categories are synced
            from your Google Sheet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void handleAdd()
                }
              }}
              placeholder="New category name…"
              disabled={busy}
            />
            <Button onClick={handleAdd} loading={busy} disabled={busy}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          <ul className="divide-y divide-border rounded-xl border border-border">
            {categories.map((category) => (
              <li
                key={category}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                  {category}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmCategory(category)}
                  aria-label={`Remove ${category}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
            {categories.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                No categories yet. Add one above.
              </li>
            ) : null}
          </ul>

          <p className="text-xs text-muted-foreground">
            A category that is used by existing cost entries cannot be removed — rename or
            keep it instead.
          </p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmCategory != null}
        onOpenChange={(open) => {
          if (!open) setConfirmCategory(null)
        }}
        title="Remove category?"
        description={
          confirmCategory ? (
            <>
              This removes <span className="font-medium text-foreground">{confirmCategory}</span>{' '}
              from the list of available cost categories.
            </>
          ) : undefined
        }
        confirmLabel="Remove"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}