import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { BarChart3, Eye, EyeOff, Plus } from 'lucide-react'
import { supabase, ITEM_SELECT } from '../lib/supabase'
import type { Category, Claim, Item, Report } from '../lib/types'
import { errorMessage, formatDate, reportReasonLabel, timeAgo } from '../lib/utils'
import { StatusBadge, TypeBadge } from '../components/ItemCard'
import { CLAIM_SELECT, ClaimStatusBadge } from '../components/ClaimCard'
import { Alert, Badge, Button, Card, Input, PageHeader, Select, Spinner, Tabs } from '../components/ui'

type Tab = 'stats' | 'users' | 'items' | 'categories' | 'claims' | 'reports'

export default function Admin() {
  const [tab, setTab] = useState<Tab>('stats')
  return (
    <div>
      <PageHeader title="Administración" subtitle="Supervisa y modera la plataforma." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'stats', label: 'Resumen' }, { value: 'users', label: 'Usuarios' }, { value: 'items', label: 'Publicaciones' },
        { value: 'categories', label: 'Categorías' }, { value: 'claims', label: 'Solicitudes' }, { value: 'reports', label: 'Reportes' },
      ]} />
      {tab === 'stats' && <Stats />}
      {tab === 'users' && <Users />}
      {tab === 'items' && <Items />}
      {tab === 'categories' && <Categories />}
      {tab === 'claims' && <Claims />}
      {tab === 'reports' && <Reports />}
    </div>
  )
}

const Table = ({ head, children }: { head: string[]; children: React.ReactNode }) => (
  <Card className="overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-muted">
        <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-100">{children}</tbody>
    </table>
  </Card>
)
const Td = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <td className={`px-4 py-3 ${className}`}>{children}</td>

function Stats() {
  const [s, setS] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { supabase.rpc('admin_stats').then(({ data, error }) => error ? setError(errorMessage(error)) : setS(data)) }, [])
  if (error) return <Alert>{error}</Alert>
  if (!s) return <Spinner />
  const cards = [
    ['Usuarios registrados', s.users], ['Objetos publicados', s.items], ['Perdidos', s.lost], ['Encontrados', s.found],
    ['Recuperados', s.resolved], ['Solicitudes pendientes', s.pending_claims], ['Reportes pendientes', s.pending_reports], ['Coincidencias activas', s.active_matches],
  ]
  return (
    <div className="space-y-6">
      <Card className="flex items-center gap-6 bg-gradient-to-br from-primary to-primary-dark p-6 text-white">
        <BarChart3 className="size-10 opacity-80" />
        <div>
          <p className="text-sm text-blue-100">Porcentaje de recuperación</p>
          <p className="text-4xl font-semibold">{s.recovery_rate}%</p>
        </div>
        <div className="ml-auto hidden h-3 w-64 overflow-hidden rounded-full bg-white/20 sm:block">
          <div className="h-full rounded-full bg-white" style={{ width: `${s.recovery_rate}%` }} />
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([l, v]) => <Card key={l} className="p-4"><p className="text-2xl font-semibold tabular-nums">{v}</p><p className="text-xs text-muted">{l}</p></Card>)}
      </div>
    </div>
  )
}

interface AdminUser { id: string; first_name: string; last_name: string; email: string; role: string; is_active: boolean; blocked_reason: string | null; created_at: string; items_count: number }

function Users() {
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(() => { supabase.rpc('admin_list_users').then(({ data, error }) => error ? setError(errorMessage(error)) : setUsers(data)) }, [])
  useEffect(load, [load])

  async function toggle(u: AdminUser) {
    const reason = u.is_active ? window.prompt('Motivo del bloqueo:') : null
    if (u.is_active && reason === null) return
    const { error } = await supabase.from('profiles').update({ is_active: !u.is_active, blocked_reason: u.is_active ? reason : null }).eq('id', u.id)
    if (error) return setError(errorMessage(error))
    load()
  }

  if (!users) return error ? <Alert>{error}</Alert> : <Spinner />
  return (
    <div className="space-y-3">
      {error && <Alert>{error}</Alert>}
      <Table head={['Usuario', 'Correo', 'Rol', 'Publicaciones', 'Registro', 'Estado', '']}>
        {users.map((u) => (
          <tr key={u.id}>
            <Td className="font-medium">{u.first_name} {u.last_name}</Td>
            <Td className="text-muted">{u.email}</Td>
            <Td>{u.role === 'admin' ? <Badge tone="violet">Admin</Badge> : 'Usuario'}</Td>
            <Td>{u.items_count}</Td>
            <Td className="whitespace-nowrap text-muted">{formatDate(u.created_at)}</Td>
            <Td>{u.is_active ? <Badge tone="green">Activo</Badge> : <span title={u.blocked_reason ?? ''}><Badge tone="red">Bloqueado</Badge></span>}</Td>
            <Td>{u.role !== 'admin' && <Button variant={u.is_active ? 'ghost' : 'secondary'} onClick={() => toggle(u)}>{u.is_active ? 'Bloquear' : 'Reactivar'}</Button>}</Td>
          </tr>
        ))}
      </Table>
    </div>
  )
}

function Items() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const load = useCallback(() => {
    let query = supabase.from('items').select(ITEM_SELECT).is('deleted_at', null).order('created_at', { ascending: false }).limit(100)
    if (q.trim()) query = query.ilike('title', `%${q.trim()}%`)
    query.then(({ data }) => setItems((data ?? []) as Item[]))
  }, [q])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  async function moderate(i: Item) {
    const reason = i.is_hidden ? null : window.prompt('Motivo para ocultar la publicación:')
    if (!i.is_hidden && reason === null) return
    const patch = i.is_hidden
      ? { is_hidden: false, hidden_reason: null, hidden_by_id: null, hidden_at: null }
      : { is_hidden: true, hidden_reason: reason, hidden_by_id: (await supabase.auth.getUser()).data.user?.id, hidden_at: new Date().toISOString() }
    const { error } = await supabase.from('items').update(patch).eq('id', i.id)
    if (error) return setError(errorMessage(error))
    load()
  }

  return (
    <div className="space-y-3">
      {error && <Alert>{error}</Alert>}
      <Input placeholder="Buscar por título..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      {!items ? <Spinner /> : (
        <Table head={['Objeto', 'Tipo', 'Autor', 'Fecha', 'Estado', '']}>
          {items.map((i) => (
            <tr key={i.id}>
              <Td><Link to={`/objetos/${i.id}`} className="font-medium hover:text-primary">{i.title}</Link><p className="text-xs text-muted">{i.category?.name}</p></Td>
              <Td><TypeBadge type={i.type} /></Td>
              <Td className="text-muted">{i.owner?.first_name} {i.owner?.last_name}</Td>
              <Td className="whitespace-nowrap text-muted">{formatDate(i.created_at)}</Td>
              <Td><StatusBadge item={i} /></Td>
              <Td><Button variant="ghost" onClick={() => moderate(i)}>{i.is_hidden ? <><Eye className="size-4" />Mostrar</> : <><EyeOff className="size-4" />Ocultar</>}</Button></Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}

function Categories() {
  const [cats, setCats] = useState<(Category & { items: { count: number }[] })[] | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const load = useCallback(() => { supabase.from('categories').select('*, items(count)').order('name').then(({ data }) => setCats((data ?? []) as never)) }, [])
  useEffect(load, [load])

  async function add(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (n.length < 3) return
    const slug = n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const { error } = await supabase.from('categories').insert({ name: n, slug })
    if (error) return setError(errorMessage(error))
    setName(''); setError(''); load()
  }
  async function rename(c: Category) {
    const n = window.prompt('Nuevo nombre:', c.name)?.trim()
    if (!n || n === c.name) return
    const { error } = await supabase.from('categories').update({ name: n }).eq('id', c.id)
    if (error) return setError(errorMessage(error))
    load()
  }
  async function toggle(c: Category) {
    const { error } = await supabase.from('categories').update({ is_active: !c.is_active }).eq('id', c.id)
    if (error) return setError(errorMessage(error))
    load()
  }
  async function remove(c: Category & { items: { count: number }[] }) {
    if (c.items[0]?.count) return setError('No se puede eliminar una categoría con publicaciones. Desactívala en su lugar.')
    if (!window.confirm(`¿Eliminar la categoría "${c.name}"?`)) return
    const { error } = await supabase.from('categories').delete().eq('id', c.id)
    if (error) return setError(errorMessage(error))
    load()
  }

  return (
    <div className="max-w-3xl space-y-3">
      {error && <Alert>{error}</Alert>}
      <form onSubmit={add} className="flex gap-2">
        <Input placeholder="Nueva categoría" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit"><Plus className="size-4" />Agregar</Button>
      </form>
      {!cats ? <Spinner /> : (
        <Table head={['Nombre', 'Publicaciones', 'Estado', '']}>
          {cats.map((c) => (
            <tr key={c.id}>
              <Td className="font-medium">{c.name}</Td>
              <Td>{c.items[0]?.count ?? 0}</Td>
              <Td>{c.is_active ? <Badge tone="green">Activa</Badge> : <Badge>Inactiva</Badge>}</Td>
              <Td className="whitespace-nowrap text-right">
                <Button variant="ghost" onClick={() => rename(c)}>Renombrar</Button>
                <Button variant="ghost" onClick={() => toggle(c)}>{c.is_active ? 'Desactivar' : 'Activar'}</Button>
                <Button variant="ghost" className="text-danger" onClick={() => remove(c)}>Eliminar</Button>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}

function Claims() {
  const [claims, setClaims] = useState<Claim[] | null>(null)
  const [status, setStatus] = useState('')
  useEffect(() => {
    let q = supabase.from('claims').select(CLAIM_SELECT).order('created_at', { ascending: false }).limit(100)
    if (status) q = q.eq('status', status)
    q.then(({ data }) => setClaims((data ?? []) as Claim[]))
  }, [status])
  return (
    <div className="space-y-3">
      <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-xs">
        <option value="">Todos los estados</option>
        {['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
      </Select>
      {!claims ? <Spinner /> : (
        <Table head={['Objeto', 'Solicitante', 'Mensaje', 'Fecha', 'Estado']}>
          {claims.map((c) => (
            <tr key={c.id}>
              <Td><Link to={`/objetos/${c.item_id}`} className="font-medium hover:text-primary">{c.item?.title}</Link></Td>
              <Td className="text-muted">{c.requester?.first_name} {c.requester?.last_name}</Td>
              <Td className="max-w-xs truncate text-muted">{c.message}</Td>
              <Td className="whitespace-nowrap text-muted">{timeAgo(c.created_at)}</Td>
              <Td><ClaimStatusBadge status={c.status} /></Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}

function Reports() {
  const [reports, setReports] = useState<Report[] | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(() => {
    supabase.from('reports').select('*, item:items(id,title,is_hidden), reporter:profiles!reporter_id(first_name,last_name)')
      .order('created_at', { ascending: false }).then(({ data }) => setReports((data ?? []) as Report[]))
  }, [])
  useEffect(load, [load])

  async function resolve(r: Report, status: 'REVIEWED' | 'DISMISSED', hide: boolean) {
    const note = window.prompt('Nota de resolución (opcional):') ?? ''
    const uid = (await supabase.auth.getUser()).data.user?.id
    const { error } = await supabase.from('reports').update({ status, resolution_note: note || null, reviewed_by_id: uid, reviewed_at: new Date().toISOString() }).eq('id', r.id)
    if (error) return setError(errorMessage(error))
    if (hide && r.item && !r.item.is_hidden) {
      await supabase.from('items').update({ is_hidden: true, hidden_reason: reportReasonLabel[r.reason], hidden_by_id: uid, hidden_at: new Date().toISOString() }).eq('id', r.item_id)
    }
    load()
  }

  if (!reports) return <Spinner />
  return (
    <div className="space-y-3">
      {error && <Alert>{error}</Alert>}
      {reports.length === 0 ? <p className="text-sm text-muted">No hay reportes.</p> : (
        <Table head={['Publicación', 'Motivo', 'Reportado por', 'Fecha', 'Estado', '']}>
          {reports.map((r) => (
            <tr key={r.id}>
              <Td><Link to={`/objetos/${r.item_id}`} className="font-medium hover:text-primary">{r.item?.title}</Link>{r.item?.is_hidden && <span className="ml-2"><Badge tone="red">Oculta</Badge></span>}</Td>
              <Td>{reportReasonLabel[r.reason]}{r.description && <p className="max-w-xs text-xs text-muted">{r.description}</p>}</Td>
              <Td className="text-muted">{r.reporter?.first_name} {r.reporter?.last_name}</Td>
              <Td className="whitespace-nowrap text-muted">{timeAgo(r.created_at)}</Td>
              <Td><Badge tone={r.status === 'PENDING' ? 'amber' : r.status === 'REVIEWED' ? 'green' : 'slate'}>{{ PENDING: 'Pendiente', REVIEWED: 'Revisado', DISMISSED: 'Descartado' }[r.status]}</Badge></Td>
              <Td className="whitespace-nowrap">{r.status === 'PENDING' && <>
                <Button variant="ghost" className="text-danger" onClick={() => resolve(r, 'REVIEWED', true)}>Ocultar publicación</Button>
                <Button variant="ghost" onClick={() => resolve(r, 'DISMISSED', false)}>Descartar</Button>
              </>}</Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}
