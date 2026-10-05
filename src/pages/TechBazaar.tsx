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

type ListingType = 'Technology supply' | 'Technology need'

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
  status: 'Active' | 'In negotiation' | 'Completed'
}

const listings: Listing[] = [
  {
    id: 1,
    type: 'Technology supply',
    title: 'Smart condition monitoring system for rotating equipment',
    provider: 'Pars Energy Monitors Company',
    category: 'Maintenance and condition monitoring',
    description: 'Vibration, temperature and equipment condition monitoring with smart analysis to reduce failures and production downtime.',
    maturity: 'Commercial',
    trl: 9,
    price: 18500000000,
    tags: ['Artificial intelligence', 'Condition monitoring', 'Rotating equipment'],
    matches: 8,
    status: 'Active',
  },
  {
    id: 2,
    type: 'Technology supply',
    title: 'Digital twin platform for process units',
    provider: 'Farayandno Startup',
    category: 'Digital twin',
    description: 'Asset modeling and display of operational status for decision-making and scenario simulation.',
    maturity: 'Market development',
    trl: 7,
    price: 32000000000,
    tags: ['Digital Twin', 'Data analytics', 'Simulation'],
    matches: 5,
    status: 'In negotiation',
  },
  {
    id: 3,
    type: 'Technology need',
    title: 'Reducing energy consumption in process compressors',
    provider: 'Oil Technology and Innovation Park',
    category: 'Energy and optimization',
    description: 'A need for an implementable solution to monitor and optimize the energy consumption of compressors.',
    maturity: 'Industrial problem',
    trl: 0,
    price: 50000000000,
    tags: ['Energy optimization', 'Compressor', 'Cost reduction'],
    matches: 12,
    status: 'Active',
  },
  {
    id: 4,
    type: 'Technology supply',
    title: 'Smart pipeline inspection with machine vision',
    provider: 'Negin Smart Industry',
    category: 'Inspection and safety',
    description: 'Automatic detection of surface defects and corrosion using imaging and machine vision.',
    maturity: 'Industrial pilot',
    trl: 8,
    price: 12500000000,
    tags: ['Machine vision', 'Corrosion', 'Safety'],
    matches: 10,
    status: 'Active',
  },
  {
    id: 5,
    type: 'Technology need',
    title: 'Domestic tank corrosion monitoring solution',
    provider: 'Partner oil and gas complexes',
    category: 'Materials and corrosion',
    description: 'A domestic, online and low-cost solution for tank corrosion monitoring and preventive alerts.',
    maturity: 'Industrial problem',
    trl: 0,
    price: 28000000000,
    tags: ['Corrosion', 'IoT', 'Online monitoring'],
    matches: 7,
    status: 'Active',
  },
  {
    id: 6,
    type: 'Technology supply',
    title: 'Rugged industrial wireless sensor for oil and gas environments',
    provider: 'Industrial Sensors Co.',
    category: 'Industrial Internet of Things',
    description: 'Industrial sensors for collecting data from equipment and securely sending information to the central system.',
    maturity: 'Commercial',
    trl: 9,
    price: 6900000000,
    tags: ['IoT', 'Sensor', 'Industrial network'],
    matches: 14,
    status: 'Completed',
  },
]

const categories = ['All', ...Array.from(new Set(listings.map((x) => x.category)))]

export default function TechBazaar() {
  const [type, setType] = useState<'All' | ListingType>('All')
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return listings.filter((item) => {
      const typeOk = type === 'All' || item.type === type
      const categoryOk = category === 'All' || item.category === category
      const queryOk = !q || `${item.title} ${item.provider} ${item.description} ${item.tags.join(' ')}`.toLowerCase().includes(q)
      return typeOk && categoryOk && queryOk
    })
  }, [type, category, query])

  const active = listings.filter((x) => x.status === 'Active').length
  const supply = listings.filter((x) => x.type === 'Technology supply').length
  const demand = listings.filter((x) => x.type === 'Technology need').length
  const matches = listings.reduce((sum, x) => sum + x.matches, 0)

  return (
    <div>
      <PageHeader
        title="Technology and Innovation Bazaar"
        subtitle="A digital marketplace for technology supply and demand connecting industrial problems to the solutions of knowledge-based and technology companies"
        actions={
          <div className="flex gap-2">
            <button className="btn btn-primary"><Lightbulb className="h-4 w-4" /> Register technology supply</button>
            <button className="btn"><Target className="h-4 w-4" /> Register technology need</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Active listings" value={active} icon={ShoppingBag} />
        <Kpi label="Technology supplies" value={supply} icon={Lightbulb} tone="gold" />
        <Kpi label="Industrial needs" value={demand} icon={Target} tone="rust" />
        <Kpi label="Matches created" value={matches} icon={Handshake} tone="brand" />
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
                placeholder="Search technology, company, industrial problem..."
              />
            </div>
            <div className="flex gap-2">
              {(['All', 'Technology supply', 'Technology need'] as const).map((item) => (
                <button key={item} className={`btn ${type === item ? 'btn-primary' : ''}`} onClick={() => setType(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Technology categories">
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
              <Badge tone={item.type === 'Technology supply' ? 'blue' : 'amber'}>{item.type}</Badge>
              <Badge tone={item.status === 'Active' ? 'green' : item.status === 'In negotiation' ? 'amber' : 'gray'}>{item.status}</Badge>
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
                  <span>Technology readiness level (TRL)</span>
                  <strong className="fa-nums">{item.trl ? `${nf(item.trl)} of 9` : 'Industrial problem'}</strong>
                </div>
                {item.trl > 0 && <div className="mt-2"><ProgressBar value={(item.trl / 9) * 100} /></div>}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => <Badge key={tag} tone="gray">{tag}</Badge>)}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3 text-xs">
                <div>
                  <span className="text-[rgb(var(--muted))]">Value/budget</span>
                  <div className="mt-1 fa-nums font-bold">{rial(item.price)}</div>
                </div>
                <div>
                  <span className="text-[rgb(var(--muted))]">Smart matching</span>
                  <div className="mt-1 flex items-center gap-1 font-bold"><Users className="h-3.5 w-3.5" /> <span className="fa-nums">{nf(item.matches)}</span> items</div>
                </div>
              </div>

              <button className="btn mt-4 w-full justify-center"><Sparkles className="h-4 w-4" /> View and connect</button>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="mt-4">
          <div className="py-10 text-center text-sm text-[rgb(var(--muted))]">No item was found for the selected filters.</div>
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Tech Bazaar process">
          <div className="space-y-3 text-sm">
            {['Register a technology need or supply', 'Technology validation and assessment', 'Smart matching of supply and demand', 'Negotiation, pilot and contract', 'Recording the result and commercialization'].map((step, i) => (
              <div key={step} className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-petro-600/10 text-xs font-bold text-petro-700">{i + 1}</span>{step}</div>
            ))}
          </div>
        </Card>
        <Card title="Commercialization indicators">
          <div className="space-y-4 text-sm">
            <div><div className="mb-1 flex justify-between"><span>Need-to-pilot conversion</span><b className="fa-nums">38%</b></div><ProgressBar value={38} /></div>
            <div><div className="mb-1 flex justify-between"><span>Pilot-to-contract conversion</span><b className="fa-nums">24%</b></div><ProgressBar value={24} tone="gold" /></div>
            <div><div className="mb-1 flex justify-between"><span>Satisfaction with solutions</span><b className="fa-nums">87%</b></div><ProgressBar value={87} tone="rust" /></div>
          </div>
        </Card>
        <Card title="Connection to the park ecosystem">
          <div className="space-y-3 text-sm text-[rgb(var(--muted))]">
            <p>As a connecting layer, the Tech Bazaar brings together the information of resident companies, market development, fundraising, judging and valuation, and mentoring for technology commercialization.</p>
            <div className="flex items-center gap-2 font-semibold text-[rgb(var(--text))]"><BadgeDollarSign className="h-4 w-4" /> From "idea" to "contract" in one traceable chain</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
