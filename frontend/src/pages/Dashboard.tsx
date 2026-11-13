import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, FileText, Inbox, PlusCircle, Search, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, ITEM_SELECT } from '../lib/supabase'
import { useCatalogs, useMyMatches } from '../lib/hooks'
import type { Item } from '../lib/types'
import { ItemCard, ItemGrid } from '../components/ItemCard'
import { MatchCard } from '../components/MatchCard'
import { Card, EmptyState, Spinner } from '../components/ui'

function useRecent(type: 'LOST' | 'FOUND') {
  const [items, setItems] = useState<Item[] | null>(null)
  useEffect(() => {
    supabase.from('items').select(ITEM_SELECT).eq('type', type).eq('status', 'ACTIVE').eq('is_hidden', false)
      .is('deleted_at', null).order('created_at', { ascending: false }).limit(4)
      .then(({ data }) => setItems((data ?? []) as Item[]))
  }, [type])
  return items
}

export default function Dashboard() {
  const { profile, session } = useAuth()
  const userId = session!.user.id
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const { categories } = useCatalogs()
  const { matches, loading: loadingMatches, reload } = useMyMatches(userId)
  const recentFound = useRecent('FOUND')
  const recentLost = useRecent('LOST')
  const [stats, setStats] = useState({ active: 0, resolved: 0, pendingReceived: 0, pendingSent: 0 })

  useEffect(() => {
    (async () => {
      const [mine, received, sent] = await Promise.all([
        supabase.from('items').select('status').eq('user_id', userId).is('deleted_at', null),
        supabase.from('claims').select('id, item:items!item_id!inner(user_id)', { count: 'exact', head: true })
          .eq('status', 'PENDING').eq('item.user_id', userId),
        supabase.from('claims').select('id', { count: 'exact', head: true }).eq('requester_id', userId).in('status', ['PENDING', 'ACCEPTED']),
      ])
      const rows = mine.data ?? []
      setStats({
        active: rows.filter((r) => r.status === 'ACTIVE').length,
        resolved: rows.filter((r) => r.status === 'RESOLVED').length,
        pendingReceived: received.count ?? 0,
        pendingSent: sent.count ?? 0,
      })
    })()
  }, [userId])

  const search = (e: FormEvent) => { e.preventDefault(); navigate(`/explorar?q=${encodeURIComponent(q.trim())}`) }

  const statCards = [
    { label: 'Publicaciones activas', value: stats.active, icon: FileText, to: '/mis-publicaciones' },
    { label: 'Objetos recuperados', value: stats.resolved, icon: Sparkles, to: '/mis-publicaciones' },
    { label: 'Solicitudes por revisar', value: stats.pendingReceived, icon: Inbox, to: '/solicitudes?tab=recibidas', highlight: stats.pendingReceived > 0 },
    { label: 'Mis solicitudes en curso', value: stats.pendingSent, icon: Inbox, to: '/solicitudes' },
  ]

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-6 text-white sm:p-10">
        <h1 className="text-2xl font-semibold sm:text-3xl">Hola, {profile?.first_name || 'de nuevo'} 👋</h1>
        <p className="mt-1 text-blue-100">¿Perdiste o encontraste algo hoy?</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <form onSubmit={search} className="flex flex-1 items-center gap-2 rounded-lg bg-white px-3 shadow-sm">
            <Search className="size-4 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar: audífonos, carné, llaves..."
              className="h-11 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400" aria-label="Buscar objetos" />
          </form>
          <Link to="/reportar" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white/15 px-5 text-sm font-medium ring-1 ring-white/30 hover:bg-white/25">
            <PlusCircle className="size-4" /> Reportar objeto
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <Link key={s.label} to={s.to}>
            <Card className={`p-4 transition hover:shadow-md ${s.highlight ? 'ring-2 ring-warning/50' : ''}`}>
              <s.icon className="size-4 text-muted" />
              <p className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </Card>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Sparkles className="size-5 text-primary" /> Tus posibles coincidencias</h2>
        {loadingMatches ? <Spinner /> : matches.length === 0
          ? <EmptyState icon={<Sparkles className="size-5" />} title="Sin coincidencias por ahora"
              text="Cuando publiques un objeto, FindIt lo comparará con los reportes del tipo opuesto y te avisará aquí." />
          : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{matches.slice(0, 6).map((m) => <MatchCard key={m.id} match={m} userId={userId} onDismiss={reload} />)}</div>}
      </section>

      <RecentSection title="Encontrados recientemente" items={recentFound} link="/explorar?type=FOUND" />
      <RecentSection title="Perdidos recientemente" items={recentLost} link="/explorar?type=LOST" />

      <section>
        <h2 className="mb-4 text-lg font-semibold">Categorías</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c.id} to={`/explorar?category=${c.id}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm hover:border-primary hover:text-primary">{c.name}</Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function RecentSection({ title, items, link }: { title: string; items: Item[] | null; link: string }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link to={link} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Ver todos <ArrowRight className="size-4" /></Link>
      </div>
      {items === null ? <Spinner /> : items.length === 0
        ? <EmptyState icon={<Search className="size-5" />} title="Aún no hay publicaciones" />
        : <ItemGrid>{items.map((i) => <ItemCard key={i.id} item={i} />)}</ItemGrid>}
    </section>
  )
}
