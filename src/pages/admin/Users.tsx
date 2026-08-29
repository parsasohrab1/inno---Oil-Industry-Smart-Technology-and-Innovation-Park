import { useState } from 'react'
import { Users as UsersIcon, Plus, Trash2, ScrollText } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Card, Badge } from '@/components/ui'
import { DataTable, type Column } from '@/components/DataTable'
import { jDateTime } from '@/lib/format'
import type { Role } from '@/store/auth'

interface AdminUser {
  id: string
  email: string
  name: string
  role: Role
  companyId: string | null
  createdAt: string
}
interface AuditRow {
  id: string
  ts: string
  role: string | null
  action: string
  target: string | null
}

const ROLE_LABEL: Record<Role, string> = {
  admin: 'مدیر پارک',
  operator: 'اپراتور',
  company: 'مدیر شرکت',
  startup: 'استارتاپ',
  investor: 'سرمایه‌گذار',
  mentor: 'منتور',
}

export default function AdminUsers() {
  const users = useApi<AdminUser[]>('/api/admin/users')
  const audit = useApi<AuditRow[]>('/api/admin/audit?limit=100')
  const companies = useApi<Array<{ id: string; name: string }>>('/api/public/companies')
  const [msg, setMsg] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'operator' as Role, companyId: '' })

  if (users.loading) return <LoadingState />
  if (users.error) return <ErrorState error={users.error} />

  const needsCompany = form.role === 'company' || form.role === 'startup'

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    try {
      await api.post('/api/admin/users', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        companyId: needsCompany ? form.companyId : null,
      })
      setMsg('کاربر ایجاد شد.')
      setForm({ name: '', email: '', password: '', role: 'operator', companyId: '' })
      users.reload()
      audit.reload()
    } catch (e2) {
      setMsg(e2 instanceof ApiError ? e2.message : 'خطا در ایجاد کاربر')
    }
  }

  async function remove(id: string) {
    try {
      await api.del(`/api/admin/users/${id}`)
      users.reload()
      audit.reload()
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'خطا در حذف')
    }
  }

  const cols: Column<AdminUser>[] = [
    { key: 'name', header: 'نام', sortValue: (r) => r.name },
    { key: 'email', header: 'ایمیل', sortValue: (r) => r.email, render: (r) => <span dir="ltr">{r.email}</span> },
    { key: 'role', header: 'نقش', align: 'center', sortValue: (r) => r.role, render: (r) => <Badge tone="blue">{ROLE_LABEL[r.role]}</Badge> },
    { key: 'companyId', header: 'شرکت', align: 'center', render: (r) => r.companyId ?? '—' },
    {
      key: 'createdAt',
      header: 'ایجاد',
      align: 'center',
      sortValue: (r) => r.createdAt,
      render: (r) => <span className="fa-nums">{jDateTime(r.createdAt)}</span>,
    },
    {
      key: 'act',
      header: '',
      align: 'center',
      render: (r) => (
        <button className="btn !p-1.5 text-oil-rust" onClick={() => remove(r.id)} title="حذف">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ]

  const auditCols: Column<AuditRow>[] = [
    { key: 'ts', header: 'زمان', sortValue: (r) => r.ts, render: (r) => <span className="fa-nums">{jDateTime(r.ts)}</span> },
    { key: 'role', header: 'نقش', align: 'center', render: (r) => r.role ?? '—' },
    { key: 'action', header: 'عملیات', render: (r) => <span dir="ltr" className="font-mono text-xs">{r.action}</span> },
    { key: 'target', header: 'هدف', render: (r) => <span dir="ltr" className="text-xs">{r.target ?? '—'}</span> },
  ]

  return (
    <div>
      <PageHeader title="مدیریت کاربران و دسترسی" subtitle="ایجاد و حذف حساب‌ها و مشاهده لاگ ممیزی سامانه" />
      {msg && <div className="mb-4 rounded-xl bg-petro-600/10 px-4 py-3 text-sm text-petro-700 dark:text-petro-300">{msg}</div>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="کاربر جدید">
          <form onSubmit={create} className="space-y-3">
            <input className="inp" placeholder="نام" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="inp" dir="ltr" type="email" placeholder="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="inp" dir="ltr" type="password" placeholder="رمز (حداقل ۸)" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select className="inp" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
            {needsCompany && (
              <select className="inp" required value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
                <option value="">— شرکت —</option>
                {companies.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <button className="btn btn-primary w-full justify-center">
              <Plus className="h-4 w-4" /> ایجاد کاربر
            </button>
          </form>
        </Card>

        <Card title={<span className="flex items-center gap-2"><UsersIcon className="h-4 w-4" /> کاربران ({users.data?.length ?? 0})</span>} className="lg:col-span-2">
          <DataTable columns={cols} rows={users.data ?? []} pageSize={10} initialSort={{ key: 'createdAt', dir: 'desc' }} />
        </Card>
      </div>

      <div className="mt-4">
        <Card title={<span className="flex items-center gap-2"><ScrollText className="h-4 w-4" /> لاگ ممیزی</span>}>
          <DataTable columns={auditCols} rows={audit.data ?? []} pageSize={12} initialSort={{ key: 'ts', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
