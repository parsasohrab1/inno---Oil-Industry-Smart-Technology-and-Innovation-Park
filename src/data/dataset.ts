import type { Dataset } from '@/lib/types'
import { generateDataset } from './generate'

let _cache: Dataset | null = null

/** دیتاست سنتتیک — یک‌بار تولید و در حافظه نگه داشته می‌شود. */
export function getDataset(): Dataset {
  if (!_cache) _cache = generateDataset()
  return _cache
}

export function regenerate(seed?: number): Dataset {
  _cache = generateDataset(seed !== undefined ? { seed } : {})
  return _cache
}
