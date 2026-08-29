import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <Compass className="h-10 w-10 text-petro-500" />
      <h2 className="mt-4 text-xl font-bold">صفحه یافت نشد</h2>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">نشانی وارد‌شده در سامانه وجود ندارد.</p>
      <Link to="/" className="btn btn-primary mt-4">
        بازگشت به نمای کلی
      </Link>
    </div>
  )
}
