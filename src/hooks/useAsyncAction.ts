import { useCallback, useState } from 'react'

import { getErrorMessage } from '@/services/apiClient'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
) {
  const [state, setState] = useState<AsyncState<TResult>>({
    data: null,
    loading: false,
    error: null,
  })

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const result = await action(...args)
        setState({ data: result, loading: false, error: null })
        return result
      } catch (error) {
        setState({ data: null, loading: false, error: getErrorMessage(error) })
        return null
      }
    },
    [action],
  )

  return { ...state, run, reset: () => setState({ data: null, loading: false, error: null }) }
}
