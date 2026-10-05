import { useCallback, useEffect, useState } from 'react'

import { getErrorMessage } from '@/services/apiClient'

interface AsyncResource<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  setData: (updater: T | ((prev: T | null) => T)) => void
}

export function useAsyncResource<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
): AsyncResource<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (showLoading: boolean) => {
      if (showLoading) setLoading(true)
      try {
        const result = await loader()
        setData(result)
        setError(null)
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  )

  const refresh = useCallback(() => load(true), [load])
  const refreshSilently = useCallback(() => load(false), [load])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Re-fetch quietly when the tab regains focus so data added elsewhere
  // (e.g. a newly saved record) appears without a manual reload.
  useEffect(() => {
    const onFocus = () => {
      void refreshSilently()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refreshSilently()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refreshSilently])

  const update = useCallback((updater: T | ((prev: T | null) => T)) => {
    setData((prev) =>
      typeof updater === 'function'
        ? (updater as (value: T | null) => T)(prev)
        : updater,
    )
  }, [])

  return { data, loading, error, refresh, setData: update }
}
