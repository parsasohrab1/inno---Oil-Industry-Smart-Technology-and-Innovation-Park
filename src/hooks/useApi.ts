import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api'

export interface ApiState<T> {
  data: T | null
  loading: boolean
  error: ApiError | Error | null
  reload: () => void
}

/** GET یک مسیر API با قابلیت بارگذاری مجدد. */
export function useApi<T>(path: string | null): ApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!path)
  const [error, setError] = useState<ApiError | Error | null>(null)
  const [tick, setTick] = useState(0)

  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!path) return
    let alive = true
    setLoading(true)
    setError(null)
    api
      .get<T>(path)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e as Error))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [path, tick])

  return { data, loading, error, reload }
}
