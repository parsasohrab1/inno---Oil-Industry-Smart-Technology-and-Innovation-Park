const faNum = new Intl.NumberFormat('fa-IR')
const faNum1 = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 })

export function nf(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return faNum.format(Math.round(n))
}

export function nf1(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return faNum1.format(n)
}

export function pct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: digits }).format(n)}٪`
}

/** ریال را به شکل خوانا (میلیون/میلیارد) نمایش می‌دهد */
export function rial(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e12) return `${faNum1.format(n / 1e12)} هزار میلیارد ریال`
  if (abs >= 1e9) return `${faNum1.format(n / 1e9)} میلیارد ریال`
  if (abs >= 1e6) return `${faNum1.format(n / 1e6)} میلیون ریال`
  return `${faNum.format(n)} ریال`
}

export function toman(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return rial(n / 10).replace('ریال', 'تومان')
}

export function usd(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e9) return `$${faNum1.format(n / 1e9)}B`
  if (abs >= 1e6) return `$${faNum1.format(n / 1e6)}M`
  if (abs >= 1e3) return `$${faNum1.format(n / 1e3)}K`
  return `$${faNum.format(n)}`
}

const jalaliFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
const jalaliShort = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const jalaliDateTime = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function jDate(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return '—'
  return jalaliFmt.format(date)
}

export function jDateShort(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return '—'
  return jalaliShort.format(date)
}

export function jDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return '—'
  return jalaliDateTime.format(date)
}

export function relTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const diff = date.getTime() - Date.now()
  const rtf = new Intl.RelativeTimeFormat('fa-IR', { numeric: 'auto' })
  const mins = Math.round(diff / 60000)
  if (Math.abs(mins) < 60) return rtf.format(mins, 'minute')
  const hours = Math.round(mins / 60)
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return rtf.format(days, 'day')
  const months = Math.round(days / 30)
  return rtf.format(months, 'month')
}
