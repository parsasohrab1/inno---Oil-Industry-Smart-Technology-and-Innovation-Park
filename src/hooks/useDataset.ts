import { useEffect, useState } from 'react'
import { fetchDataset } from '@/services'
import type { Dataset } from '@/lib/types'

let cached: Dataset | null = null
let inflight: Promise<Dataset> | null = null

export interface DatasetState {
  data: Dataset | null
  loading: boolean
  error: Error | null
}

export function useDataset(): DatasetState {
  const [state, setState] = useState<DatasetState>(() => ({
    data: cached,
    loading: !cached,
    error: null,
  }))

  useEffect(() => {
    if (cached) return
    let alive = true
    inflight ??= fetchDataset()
    inflight
      .then((d) => {
        cached = d
        if (alive) setState({ data: d, loading: false, error: null })
      })
      .catch((e: Error) => {
        if (alive) setState({ data: null, loading: false, error: e })
      })
    return () => {
      alive = false
    }
  }, [])

  return state
}
