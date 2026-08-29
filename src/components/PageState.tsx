import { Loader2, AlertTriangle } from 'lucide-react'

export function LoadingState({ label = 'در حال بارگذاری داده‌ها…' }: { label?: string }) {
  return (
    <div className="grid place-items-center py-24 text-[rgb(var(--muted))]">
      <Loader2 className="h-8 w-8 animate-spin text-petro-500" />
      <p className="mt-3 text-sm">{label}</p>
    </div>
  )
}

export function ErrorState({ error }: { error: Error }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-oil-rust/30 bg-oil-rust/5 p-6 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-oil-rust" />
      <p className="mt-3 font-bold text-oil-rust">خطا در بارگذاری داده</p>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">{error.message}</p>
    </div>
  )
}
