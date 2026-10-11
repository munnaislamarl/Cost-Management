import { useCallback, useEffect, useState } from 'react'

import { categoriesService } from '@/services/categoriesService'
import { DEFAULT_COST_CATEGORIES } from '@/utils/constants'

let cached: string[] | null = null

/** Active cost categories shared by all forms and filters. Falls back to the
 * default list while loading or when the backend is unavailable. */
export function useCategories() {
  const [categories, setCategories] = useState<string[]>(
    () => cached ?? [...DEFAULT_COST_CATEGORIES],
  )
  const [loading, setLoading] = useState(cached == null)

  const refresh = useCallback(async () => {
    const list = await categoriesService.list()
    cached = list
    setCategories(list)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (cached == null) void refresh()
  }, [refresh])

  return { categories, loading, refresh }
}