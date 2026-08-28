import { getDataset } from '@/data/dataset'
import type { Dataset } from '@/lib/types'

/**
 * لایه دسترسی داده. اکنون از دیتاست سنتتیک محلی می‌خواند؛
 * با تنظیم VITE_DATA_SOURCE=api می‌توان به API واقعی متصل شد.
 */
const SOURCE = import.meta.env?.VITE_DATA_SOURCE ?? 'mock'

export async function fetchDataset(): Promise<Dataset> {
  if (SOURCE === 'api') {
    const base = import.meta.env.VITE_API_BASE_URL ?? ''
    const res = await fetch(`${base}/api/dataset`)
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  }
  // شبیه‌سازی تأخیر شبکه برای تجربه واقعی‌تر لودینگ
  await new Promise((r) => setTimeout(r, 120))
  return getDataset()
}
