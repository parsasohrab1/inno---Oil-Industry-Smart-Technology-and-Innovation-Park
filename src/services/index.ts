import { getDataset } from '@/data/dataset'
import { api } from '@/lib/api'
import type { Dataset } from '@/lib/types'

/**
 * لایه دسترسی داده.
 * - VITE_DATA_SOURCE=api  → از بک‌اند واقعی می‌خواند (نیازمند ورود)
 * - VITE_DATA_SOURCE=mock → دیتاست سنتتیک محلی (بدون بک‌اند)
 */
const SOURCE = import.meta.env.VITE_DATA_SOURCE ?? 'api'

export async function fetchDataset(): Promise<Dataset> {
  if (SOURCE === 'api') {
    return api.get<Dataset>('/api/dataset')
  }
  await new Promise((r) => setTimeout(r, 120))
  return getDataset()
}

/** برش دیتاست مخصوص شرکتِ کاربر جاری (نقش company/startup) */
export interface CompanyDataset extends Partial<Dataset> {
  company: Dataset['companies'][number] | null
}

export async function fetchMyCompanyDataset(): Promise<CompanyDataset> {
  return api.get<CompanyDataset>('/api/dataset/mine')
}

export const isApiMode = SOURCE === 'api'
