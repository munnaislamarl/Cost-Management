import { useCallback, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // ignore write errors
        }
        return next
      })
    },
    [key],
  )

  return [stored, setValue] as const
}
