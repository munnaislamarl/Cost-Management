import { useCallback } from 'react'

import { useAsyncResource } from '@/hooks/useAsyncResource'
import { recordsService } from '@/services/recordsService'
import type { CostRecord, RecordInput } from '@/types'

export function useRecords() {
  const resource = useAsyncResource<CostRecord[]>(() => recordsService.fetchAll(), [])
  const records = resource.data ?? []

  const create = useCallback(
    async (input: RecordInput, actor: string) => {
      const created = await recordsService.create(input, actor)
      resource.setData((prev) => [created, ...(prev ?? [])])
      return created
    },
    [resource],
  )

  const createMany = useCallback(
    async (inputs: RecordInput[], actor: string) => {
      const created = await recordsService.createMany(inputs, actor)
      resource.setData((prev) => [...created, ...(prev ?? [])])
      return created
    },
    [resource],
  )

  const update = useCallback(
    async (id: string, input: RecordInput, actor: string) => {
      const updated = await recordsService.update(id, input, actor)
      resource.setData((prev) =>
        (prev ?? []).map((record) => (record.id === id ? updated : record)),
      )
      return updated
    },
    [resource],
  )

  const remove = useCallback(
    async (id: string, actor: string) => {
      await recordsService.remove(id, actor)
      resource.setData((prev) => (prev ?? []).filter((record) => record.id !== id))
    },
    [resource],
  )

  return {
    records,
    loading: resource.loading,
    error: resource.error,
    refresh: resource.refresh,
    create,
    createMany,
    update,
    remove,
  }
}
