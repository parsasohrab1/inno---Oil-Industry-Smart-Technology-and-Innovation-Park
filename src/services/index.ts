import { getDataset } from '@/data/dataset'
import { api } from '@/lib/api'
import type { Dataset } from '@/lib/types'

/**
 * Data access layer.
 * - VITE_DATA_SOURCE=api  → reads from the real backend (requires login)
 * - VITE_DATA_SOURCE=mock → local synthetic dataset (no backend)
 */
const SOURCE = import.meta.env.VITE_DATA_SOURCE ?? 'api'

export async function fetchDataset(): Promise<Dataset> {
  if (SOURCE === 'api') {
    return api.get<Dataset>('/api/dataset')
  }
  await new Promise((r) => setTimeout(r, 120))
  return getDataset()
}

/** Dataset slice specific to the current user's company (company/startup role) */
export interface CompanyDataset extends Partial<Dataset> {
  company: Dataset['companies'][number] | null
}

export async function fetchMyCompanyDataset(): Promise<CompanyDataset> {
  return api.get<CompanyDataset>('/api/dataset/mine')
}

export const isApiMode = SOURCE === 'api'
