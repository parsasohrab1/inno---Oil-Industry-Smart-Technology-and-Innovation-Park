// پیش‌فرض: هم‌ریشه (از طریق پروکسی Vite در توسعه). برای اتصال مستقیم، VITE_API_BASE_URL را تنظیم کنید.
const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const TOKEN_KEY = 'nsp.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  details?: unknown
  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

type Body = Record<string, unknown> | undefined

async function request<T>(method: string, path: string, body?: Body): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    setToken(null)
    if (!location.pathname.startsWith('/login')) location.href = '/login'
    throw new ApiError(401, 'نشست منقضی شده است')
  }

  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? `خطای ${res.status}`, data?.details)
  }
  return data as T
}

export const api = {
  base: BASE,
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: Body) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: Body) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
  /** آدرس کامل یک مسیر (برای دانلود مستقیم گزارش‌ها با توکن در کوئری نیست — از fetch blob استفاده کنید) */
  url: (path: string) => `${BASE}${path}`,
}

/** دانلود یک فایل از API با هدر احراز هویت */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
  })
  if (!res.ok) throw new ApiError(res.status, `دانلود ناموفق (${res.status})`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** باز کردن گزارش HTML قابل چاپ در تب جدید */
export async function openPrintable(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
  })
  if (!res.ok) throw new ApiError(res.status, `دریافت گزارش ناموفق (${res.status})`)
  const html = await res.text()
  const w = window.open('', '_blank')
  if (w) {
    w.document.write(html)
    w.document.close()
  }
}
