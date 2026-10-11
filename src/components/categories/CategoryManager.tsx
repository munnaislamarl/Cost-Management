import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)

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

  function openRename(category: string) {
    setRenameTarget(category)
    setNewName(category)
    setRenameError(null)
  }

  async function handleRename() {
    if (!renameTarget || renaming) return
    const cleaned = newName.trim()
    if (!cleaned) {
      setRenameError('Enter a category name first.')
      return
    }
    if (cleaned.toLowerCase() === renameTarget.toLowerCase()) {
      setRenameError('New name is the same as the current name.')
      return
    }
    if (categories.some((item) => item.toLowerCase() === cleaned.toLowerCase())) {
      setRenameError('A category with that name already exists.')
      return
    }
    setRenaming(true)
    try {
      const result = await categoriesService.rename(
        renameTarget,
        cleaned,
        user?.name ?? 'System Administrator',
      )
      await refresh()
      setRenameTarget(null)
      toast.success(
        `Category renamed to "${cleaned}" — ${result.entriesUpdated} ${
          result.entriesUpdated === 1 ? 'entry was' : 'entries were'
        } updated`,
      )
    } catch (error) {
      setRenameError(getErrorMessage(error))
    } finally {
      setRenaming(false)
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
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => openRename(category)}
                    aria-label={`Rename ${category}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmCategory(category)}
                    aria-label={`Remove ${category}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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
            keep it instead. Renaming updates existing entries with the new name.
          </p>
        </CardContent>
      </Card>

      <Dialog
        open={renameTarget != null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename category</DialogTitle>
            <DialogDescription>
              All existing cost entries under "{renameTarget}" will be updated to the new
              name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-category">New name</Label>
            <Input
              id="rename-category"
              value={newName}
              onChange={(event) => {
                setNewName(event.target.value)
                setRenameError(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void handleRename()
                }
              }}
              disabled={renaming}
              autoFocus
            />
            {renameError ? (
              <p className="text-sm text-destructive">{renameError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameTarget(null)}
              disabled={renaming}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} loading={renaming} disabled={renaming}>
              <Pencil className="h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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