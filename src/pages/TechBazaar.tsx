import { useMemo, useState } from 'react'
import {
  BadgeDollarSign,
  Building2,
  Handshake,
  Lightbulb,
  Search,
  ShoppingBag,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { PageHeader, Kpi, Card, Badge, ProgressBar } from '@/components/ui'
import { rial, nf } from '@/lib/format'

type ListingType = 'عرض فناوری' | 'نیاز فناوری'

type Listing = {
  id: number
  type: ListingType
  title: string
  provider: string
  category: string
  description: string
  maturity: string
  trl: number
  price: number
  tags: string[]
  matches: number
  status: 'فعال' | 'در مذاکره' | 'تکمیل‌شده'
}

const listings: Listing[] = [
  {
    id: 1,
    type: 'عرض فناوری',
    title: 'سامانه پایش هوشمند تجهیزات دوار',
    provider: 'شرکت پایش‌گران انرژی پارس',
    category: 'نگهداشت و پایش وضعیت',
    description: 'پایش ارتعاش، دما و وضعیت تجهیز با تحلیل هوشمند برای کاهش خرابی و توقف تولید.',
    maturity: 'تجاری',
    trl: 9,
    price: 18500000000,
    tags: ['هوش مصنوعی', 'پایش وضعیت', 'تجهیزات دوار'],
    matches: 8,
    status: 'فعال',
  },
  {
    id: 2,
    type: 'عرض فناوری',
    title: 'پلتفرم دوقلوی دیجیتال واحدهای فرایندی',
    provider: 'استارتاپ فرآیندنو',
    category: 'دوقلوی دیجیتال',
    description: 'مدل‌سازی دارایی‌ها و نمایش وضعیت عملیاتی برای تصمیم‌گیری و شبیه‌سازی سناریوها.',
    maturity: 'در حال توسعه بازار',
    trl: 7,
    price: 32000000000,
    tags: ['Digital Twin', 'تحلیل داده', 'شبیه‌سازی'],
    matches: 5,
    status: 'در مذاکره',
  },
  {
    id: 3,
    type: 'نیاز فناوری',
    title: 'کاهش مصرف انرژی در کمپرسورهای فرایندی',
    provider: 'پارک فناوری و نوآوری نفت',
    category: 'انرژی و بهینه‌سازی',
    description: 'نیاز به راهکار قابل‌پیاده‌سازی برای پایش و بهینه‌سازی مصرف انرژی کمپرسورها.',
    maturity: 'مسئله صنعتی',
    trl: 0,
    price: 50000000000,
    tags: ['بهینه‌سازی انرژی', 'کمپرسور', 'کاهش هزینه'],
    matches: 12,
    status: 'فعال',
  },
  {
    id: 4,
    type: 'عرض فناوری',
    title: 'بازرسی هوشمند خطوط لوله با بینایی ماشین',
    provider: 'نگین صنعت هوشمند',
    category: 'بازرسی و ایمنی',
    description: 'تشخیص خودکار عیوب سطحی و خوردگی با استفاده از تصویربرداری و بینایی ماشین.',
    maturity: 'آزمایش صنعتی',
    trl: 8,
    price: 12500000000,
    tags: ['بینایی ماشین', 'خوردگی', 'ایمنی'],
    matches: 10,
    status: 'فعال',
  },
  {
    id: 5,
    type: 'نیاز فناوری',
    title: 'راهکار بومی پایش خوردگی مخازن',
    provider: 'مجتمع‌های نفت و گاز همکار',
    category: 'مواد و خوردگی',
    description: 'راهکار بومی، برخط و کم‌هزینه برای پایش خوردگی و هشدار پیشگیرانه مخازن.',
    maturity: 'مسئله صنعتی',
    trl: 0,
    price: 28000000000,
    tags: ['خوردگی', 'IoT', 'پایش برخط'],
    matches: 7,
    status: 'فعال',
  },
  {
    id: 6,
    type: 'عرض فناوری',
    title: 'حسگر بی‌سیم صنعتی مقاوم در محیط نفت و گاز',
    provider: 'سنسوران صنعت',
    category: 'اینترنت اشیای صنعتی',
    description: 'حسگرهای صنعتی برای جمع‌آوری داده از تجهیزات و ارسال امن اطلاعات به سامانه مرکزی.',
    maturity: 'تجاری',
    trl: 9,
    price: 6900000000,
    tags: ['IoT', 'حسگر', 'شبکه صنعتی'],
    matches: 14,
    status: 'تکمیل‌شده',
  },
]

const categories = ['همه', ...Array.from(new Set(listings.map((x) => x.category)))]

export default function TechBazaar() {
  const [type, setType] = useState<'همه' | ListingType>('همه')
  const [category, setCategory] = useState('همه')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return listings.filter((item) => {
      const typeOk = type === 'همه' || item.type === type
      const categoryOk = category === 'همه' || item.category === category
      const queryOk = !q || `${item.title} ${item.provider} ${item.description} ${item.tags.join(' ')}`.toLowerCase().includes(q)
      return typeOk && categoryOk && queryOk
    })
  }, [type, category, query])

  const active = listings.filter((x) => x.status === 'فعال').length
  const supply = listings.filter((x) => x.type === 'عرض فناوری').length
  const demand = listings.filter((x) => x.type === 'نیاز فناوری').length
  const matches = listings.reduce((sum, x) => sum + x.matches, 0)

  return (
    <div>
      <PageHeader
        title="فن بازار فناوری و نوآوری"
        subtitle="بازار دیجیتال عرضه و تقاضای فناوری برای اتصال مسائل صنعتی به راهکارهای شرکت‌های دانش‌بنیان و فناور"
        actions={
          <div className="flex gap-2">
            <button className="btn btn-primary"><Lightbulb className="h-4 w-4" /> ثبت عرضه فناوری</button>
            <button className="btn"><Target className="h-4 w-4" /> ثبت نیاز فناوری</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="آگهی‌های فعال" value={active} icon={ShoppingBag} />
        <Kpi label="عرضه‌های فناوری" value={supply} icon={Lightbulb} tone="gold" />
        <Kpi label="نیازهای صنعتی" value={demand} icon={Target} tone="rust" />
        <Kpi label="تطبیق‌های ایجادشده" value={matches} icon={Handshake} tone="brand" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card>
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
              <input
                className="input w-full pr-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو در فناوری، شرکت، مسئله صنعتی..."
              />
            </div>
            <div className="flex gap-2">
              {(['همه', 'عرض فناوری', 'نیاز فناوری'] as const).map((item) => (
                <button key={item} className={`btn ${type === item ? 'btn-primary' : ''}`} onClick={() => setType(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card title="دسته‌بندی فناوری">
          <div className="space-y-1">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`w-full rounded-lg px-3 py-2 text-right text-sm transition ${category === item ? 'bg-petro-600/10 font-bold text-petro-700' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.id} className="flex flex-col" title={
            <div className="flex items-center gap-2">
              <Badge tone={item.type === 'عرض فناوری' ? 'blue' : 'amber'}>{item.type}</Badge>
              <Badge tone={item.status === 'فعال' ? 'green' : item.status === 'در مذاکره' ? 'amber' : 'gray'}>{item.status}</Badge>
            </div>
          }>
            <div className="flex h-full flex-col">
              <h3 className="text-base font-bold leading-7">{item.title}</h3>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-[rgb(var(--muted))]">
                <Building2 className="h-3.5 w-3.5" /> {item.provider}
              </div>
              <p className="mt-3 min-h-12 text-sm leading-6 text-[rgb(var(--muted))]">{item.description}</p>

              <div className="mt-4 rounded-xl bg-black/[.025] p-3 dark:bg-white/[.03]">
                <div className="flex items-center justify-between text-xs">
                  <span>سطح آمادگی فناوری (TRL)</span>
                  <strong className="fa-nums">{item.trl ? `${nf(item.trl)} از ۹` : 'مسئله صنعتی'}</strong>
                </div>
                {item.trl > 0 && <div className="mt-2"><ProgressBar value={(item.trl / 9) * 100} /></div>}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => <Badge key={tag} tone="gray">{tag}</Badge>)}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3 text-xs">
                <div>
                  <span className="text-[rgb(var(--muted))]">ارزش/بودجه</span>
                  <div className="mt-1 fa-nums font-bold">{rial(item.price)}</div>
                </div>
                <div>
                  <span className="text-[rgb(var(--muted))]">تطبیق هوشمند</span>
                  <div className="mt-1 flex items-center gap-1 font-bold"><Users className="h-3.5 w-3.5" /> <span className="fa-nums">{nf(item.matches)}</span> مورد</div>
                </div>
              </div>

              <button className="btn mt-4 w-full justify-center"><Sparkles className="h-4 w-4" /> مشاهده و ایجاد ارتباط</button>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="mt-4">
          <div className="py-10 text-center text-sm text-[rgb(var(--muted))]">موردی با فیلترهای انتخاب‌شده پیدا نشد.</div>
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="فرآیند فن بازار">
          <div className="space-y-3 text-sm">
            {['ثبت نیاز یا عرضه فناوری', 'اعتبارسنجی و ارزیابی فناوری', 'تطبیق هوشمند عرضه و تقاضا', 'مذاکره، پایلوت و قرارداد', 'ثبت نتیجه و تجاری‌سازی'].map((step, i) => (
              <div key={step} className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-petro-600/10 text-xs font-bold text-petro-700">{i + 1}</span>{step}</div>
            ))}
          </div>
        </Card>
        <Card title="شاخص‌های تجاری‌سازی">
          <div className="space-y-4 text-sm">
            <div><div className="mb-1 flex justify-between"><span>تبدیل نیاز به پایلوت</span><b className="fa-nums">۳۸٪</b></div><ProgressBar value={38} /></div>
            <div><div className="mb-1 flex justify-between"><span>تبدیل پایلوت به قرارداد</span><b className="fa-nums">۲۴٪</b></div><ProgressBar value={24} tone="gold" /></div>
            <div><div className="mb-1 flex justify-between"><span>رضایت از راهکارها</span><b className="fa-nums">۸۷٪</b></div><ProgressBar value={87} tone="rust" /></div>
          </div>
        </Card>
        <Card title="اتصال به اکوسیستم پارک">
          <div className="space-y-3 text-sm text-[rgb(var(--muted))]">
            <p>فن بازار به‌عنوان لایه اتصال، اطلاعات شرکت‌های مستقر، توسعه بازار، جذب سرمایه، داوری و ارزش‌گذاری و منتورینگ را برای تجاری‌سازی فناوری کنار هم قرار می‌دهد.</p>
            <div className="flex items-center gap-2 font-semibold text-[rgb(var(--text))]"><BadgeDollarSign className="h-4 w-4" /> از «ایده» تا «قرارداد» در یک زنجیره قابل‌ردیابی</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
