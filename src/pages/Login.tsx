import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flame, LogIn } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { ApiError } from '@/lib/api'

const DEMO: Array<{ label: string; email: string; password: string }> = [
  { label: 'مدیر پارک', email: 'admin@naftpark.ir', password: 'admin1234' },
  { label: 'اپراتور', email: 'operator@naftpark.ir', password: 'operator1234' },
  { label: 'مدیر شرکت', email: 'company@naftpark.ir', password: 'company1234' },
  { label: 'استارتاپ', email: 'startup@naftpark.ir', password: 'startup1234' },
  { label: 'سرمایه‌گذار', email: 'investor@naftpark.ir', password: 'investor1234' },
  { label: 'منتور', email: 'mentor@naftpark.ir', password: 'mentor1234' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent, creds?: { email: string; password: string }) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(creds?.email ?? email, creds?.password ?? password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'خطا در برقراری ارتباط با سرور')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[rgb(var(--bg))] px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-petro-600 text-white">
            <Flame className="h-7 w-7" />
          </span>
          <h1 className="font-display text-xl font-bold">سامانه پارک هوشمند نفت</h1>
          <p className="text-sm text-[rgb(var(--muted))]">برای ورود، حساب کاربری خود را وارد کنید</p>
        </div>

        <form onSubmit={submit} className="card card-pad space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">ایمیل</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus:border-petro-500"
              placeholder="you@example.com"
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">رمز عبور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus:border-petro-500"
              dir="ltr"
            />
          </div>
          {error && <p className="rounded-lg bg-oil-rust/10 px-3 py-2 text-sm text-oil-rust">{error}</p>}
          <button type="submit" disabled={busy} className="btn btn-primary w-full justify-center disabled:opacity-60">
            <LogIn className="h-4 w-4" />
            {busy ? 'در حال ورود…' : 'ورود'}
          </button>
          <p className="text-center text-xs text-[rgb(var(--muted))]">
            حساب ندارید؟{' '}
            <Link to="/register" className="text-petro-600 hover:underline">
              ثبت‌نام شرکت / سرمایه‌گذار / منتور
            </Link>
          </p>
        </form>

        <div className="mt-4">
          <p className="mb-2 text-center text-xs text-[rgb(var(--muted))]">ورود سریع با حساب‌های نمونه</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO.map((d) => (
              <button
                key={d.email}
                onClick={(e) => submit(e, d)}
                disabled={busy}
                className="btn justify-center !py-1.5 text-xs disabled:opacity-60"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
