import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { SearchX, SlidersHorizontal } from 'lucide-react'
import { supabase, ITEM_SELECT } from '../lib/supabase'
import { useCatalogs } from '../lib/hooks'
import type { Item } from '../lib/types'
import { ItemCard, ItemGrid } from '../components/ItemCard'
import { Button, EmptyState, Input, PageHeader, Select, Spinner } from '../components/ui'

const PAGE_SIZE = 12

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const { categories, locations } = useCatalogs()
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [qInput, setQInput] = useState(params.get('q') ?? '')

  const f = {
    q: params.get('q') ?? '',
    type: params.get('type') ?? '',
    category: params.get('category') ?? '',
    location: params.get('location') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    sort: params.get('sort') ?? 'recent',
    page: Number(params.get('page') ?? 1),
  }

  const update = (patch: Partial<Record<keyof typeof f, string>>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (!('page' in patch)) next.delete('page')
    setParams(next)
  }

  // Búsqueda con pequeño debounce
  useEffect(() => {
    const t = setTimeout(() => { if (qInput !== f.q) update({ q: qInput.trim() }) }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput])

  useEffect(() => {
    setLoading(true)
    let query = supabase.from('items').select(ITEM_SELECT, { count: 'exact' })
      .eq('status', 'ACTIVE').eq('is_hidden', false).is('deleted_at', null)
    if (f.type) query = query.eq('type', f.type)
    if (f.category) query = query.eq('category_id', f.category)
    if (f.location) query = query.eq('location_id', f.location)
    if (f.from) query = query.gte('incident_date', f.from)
    if (f.to) query = query.lte('incident_date', f.to)
    if (f.q) {
      const safe = f.q.replace(/[,()%]/g, ' ')
      query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
    }
    const fromIdx = (f.page - 1) * PAGE_SIZE
    query.order('created_at', { ascending: f.sort === 'oldest' }).range(fromIdx, fromIdx + PAGE_SIZE - 1)
      .then(({ data, count }) => {
        setItems((data ?? []) as Item[])
        setTotal(count ?? 0)
        setLoading(false)
      })
  }, [f.q, f.type, f.category, f.location, f.from, f.to, f.sort, f.page])

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasFilters = f.q || f.type || f.category || f.location || f.from || f.to

  return (
    <div>
      <PageHeader title="Explorar objetos" subtitle={`${total} publicaci${total === 1 ? 'ón activa' : 'ones activas'}`} />

      <div className="mb-6 space-y-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Buscar por palabra clave..." className="flex-1" aria-label="Palabra clave" />
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {[['', 'Todos'], ['LOST', 'Perdidos'], ['FOUND', 'Encontrados']].map(([v, l]) => (
              <button key={v} onClick={() => update({ type: v })}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${f.type === v ? 'bg-white shadow-sm' : 'text-muted'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Select value={f.category} onChange={(e) => update({ category: e.target.value })} aria-label="Categoría">
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={f.location} onChange={(e) => update({ location: e.target.value })} aria-label="Lugar">
            <option value="">Todos los lugares</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
          <Input type="date" value={f.from} onChange={(e) => update({ from: e.target.value })} aria-label="Desde" title="Desde" />
          <Input type="date" value={f.to} onChange={(e) => update({ to: e.target.value })} aria-label="Hasta" title="Hasta" />
          <Select value={f.sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Ordenar">
            <option value="recent">Más recientes</option>
            <option value="oldest">Más antiguos</option>
          </Select>
        </div>
        {hasFilters && (
          <button onClick={() => { setQInput(''); setParams({}) }} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <SlidersHorizontal className="size-3.5" /> Limpiar filtros
          </button>
        )}
      </div>

      {loading ? <Spinner /> : items.length === 0
        ? <EmptyState icon={<SearchX className="size-5" />} title="No encontramos objetos" text="Prueba con otras palabras o quita algunos filtros." />
        : <ItemGrid>{items.map((i) => <ItemCard key={i.id} item={i} />)}</ItemGrid>}

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="secondary" disabled={f.page <= 1} onClick={() => update({ page: String(f.page - 1) })}>Anterior</Button>
          <span className="text-sm text-muted">Página {f.page} de {pages}</span>
          <Button variant="secondary" disabled={f.page >= pages} onClick={() => update({ page: String(f.page + 1) })}>Siguiente</Button>
        </div>
      )}
    </div>
  )
}
