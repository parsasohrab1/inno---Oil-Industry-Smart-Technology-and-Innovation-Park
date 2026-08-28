import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth, type Role } from '@/store/auth'
import { useApi } from '@/hooks/useApi'
import { ApiError } from '@/lib/api'

type PublicRole = Exclude<Role, 'admin' | 'operator'>

const ROLE_LABELS: Record<PublicRole, string> = {
  company: 'مدیر شرکت مستقر',
  startup: 'بنیان‌گذار استارتاپ',
  investor: 'سرمایه‌گذار',
  mentor: 'منتور / مشاور',
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const companies = useApi<Array<{ id: string; name: string }>>('/api/public/companies')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'company' as PublicRole,
    companyId: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const needsCompany = form.role === 'company' || form.role === 'startup'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        companyId: needsCompany ? form.companyId : undefined,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'خطا در ثبت‌نام')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[rgb(var(--bg))] px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-center font-display text-xl font-bold">ثبت‌نام در سامانه پارک هوشمند نفت</h1>
        <p className="mb-6 text-center text-sm text-[rgb(var(--muted))]">
          مخصوص شرکت‌های مستقر، استارتاپ‌ها، سرمایه‌گذاران و منتورها
        </p>

        <form onSubmit={submit} className="card card-pad space-y-4">
          <Field label="نام و نام خانوادگی">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="inp"
            />
          </Field>
          <Field label="ایمیل">
            <input
              type="email"
              required
              dir="ltr"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="inp"
            />
          </Field>
          <Field label="رمز عبور (حداقل ۸ کاراکتر)">
            <input
              type="password"
              required
              minLength={8}
              dir="ltr"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="inp"
            />
          </Field>
          <Field label="نقش">
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as PublicRole })}
              className="inp"
            >
              {(Object.keys(ROLE_LABELS) as PublicRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>
          {needsCompany && (
            <Field label="شرکت مرتبط">
              <select
                required
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                className="inp"
              >
                <option value="">— انتخاب کنید —</option>
                {companies.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {error && <p className="rounded-lg bg-oil-rust/10 px-3 py-2 text-sm text-oil-rust">{error}</p>}
          <button type="submit" disabled={busy} className="btn btn-primary w-full justify-center disabled:opacity-60">
            <UserPlus className="h-4 w-4" />
            {busy ? 'در حال ثبت…' : 'ثبت‌نام'}
          </button>
          <p className="text-center text-xs text-[rgb(var(--muted))]">
            حساب دارید؟{' '}
            <Link to="/login" className="text-petro-600 hover:underline">
              ورود
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}
