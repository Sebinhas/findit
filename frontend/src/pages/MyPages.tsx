import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Bell, CheckCheck, FileText, Inbox, PlusCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, ITEM_SELECT } from '../lib/supabase'
import type { Claim, Item, Notification } from '../lib/types'
import { errorMessage, formatDate, timeAgo } from '../lib/utils'
import { ItemCard, ItemGrid } from '../components/ItemCard'
import { CLAIM_SELECT, ClaimCard } from '../components/ClaimCard'
import { Alert, Button, Card, EmptyState, Field, Input, PageHeader, Spinner, Tabs } from '../components/ui'

// ---------------------------------------------------------------- Mis publicaciones
export function MyItems() {
  const { session } = useAuth()
  const [items, setItems] = useState<Item[] | null>(null)
  const [tab, setTab] = useState<'ACTIVE' | 'RESOLVED' | 'CLOSED'>('ACTIVE')

  useEffect(() => {
    supabase.from('items').select(ITEM_SELECT).eq('user_id', session!.user.id).is('deleted_at', null)
      .order('created_at', { ascending: false }).then(({ data }) => setItems((data ?? []) as Item[]))
  }, [session])

  const list = (items ?? []).filter((i) => i.status === tab)
  const count = (s: string) => (items ?? []).filter((i) => i.status === s).length

  return (
    <div>
      <PageHeader title="Mis publicaciones" action={<Link to="/reportar"><Button><PlusCircle className="size-4" />Reportar objeto</Button></Link>} />
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'ACTIVE', label: 'Activas', count: count('ACTIVE') },
        { value: 'RESOLVED', label: 'Resueltas', count: count('RESOLVED') },
        { value: 'CLOSED', label: 'Cerradas', count: count('CLOSED') },
      ]} />
      {items === null ? <Spinner /> : list.length === 0
        ? <EmptyState icon={<FileText className="size-5" />} title="No hay publicaciones aquí"
            action={tab === 'ACTIVE' && <Link to="/reportar"><Button>Reportar un objeto</Button></Link>} />
        : <ItemGrid>{list.map((i) => <ItemCard key={i.id} item={i} />)}</ItemGrid>}
    </div>
  )
}

// ---------------------------------------------------------------- Solicitudes
export function MyClaims() {
  const { session } = useAuth()
  const userId = session!.user.id
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as 'enviadas' | 'recibidas') ?? 'enviadas'
  const [sent, setSent] = useState<Claim[] | null>(null)
  const [received, setReceived] = useState<Claim[] | null>(null)

  const load = useCallback(async () => {
    const [s, r] = await Promise.all([
      supabase.from('claims').select(CLAIM_SELECT).eq('requester_id', userId).order('created_at', { ascending: false }),
      supabase.from('claims').select(CLAIM_SELECT.replace('item:items!item_id(', 'item:items!item_id!inner(')).eq('item.user_id', userId)
        .order('created_at', { ascending: false }),
    ])
    setSent((s.data ?? []) as Claim[])
    setReceived((r.data ?? []) as unknown as Claim[])
  }, [userId])
  useEffect(() => { load() }, [load])

  const list = tab === 'enviadas' ? sent : received
  const pendingReceived = (received ?? []).filter((c) => c.status === 'PENDING').length

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Solicitudes de recuperación" subtitle="Reclamaciones que enviaste y las que recibiste sobre objetos que encontraste." />
      <Tabs value={tab} onChange={(v) => setParams({ tab: v })} tabs={[
        { value: 'enviadas', label: 'Enviadas', count: sent?.length },
        { value: 'recibidas', label: pendingReceived ? `Recibidas · ${pendingReceived} por revisar` : 'Recibidas', count: received?.length },
      ]} />
      {list === null ? <Spinner /> : list.length === 0
        ? <EmptyState icon={<Inbox className="size-5" />} title={tab === 'enviadas' ? 'No has enviado solicitudes' : 'No has recibido solicitudes'}
            text={tab === 'enviadas' ? 'Cuando encuentres tu objeto en el catálogo, pulsa "Es mío" para reclamarlo.' : 'Aparecerán aquí cuando alguien reclame un objeto que publicaste como encontrado.'} />
        : <div className="space-y-4">{list.map((c) => <ClaimCard key={c.id} claim={c} asOwner={tab === 'recibidas'} onChange={load} />)}</div>}
    </div>
  )
}

// ---------------------------------------------------------------- Notificaciones
export function Notifications() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Notification[] | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100)
    setItems(data ?? [])
  }, [])
  useEffect(() => { load() }, [load])

  async function open(n: Notification) {
    if (!n.is_read) await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', n.id)
    if (n.related_entity_type === 'item' && n.related_entity_id) navigate(`/objetos/${n.related_entity_id}`)
    else if (n.related_entity_type === 'claim') navigate(n.type === 'CLAIM_RECEIVED' || n.type === 'CLAIM_CANCELLED' ? '/solicitudes?tab=recibidas' : '/solicitudes')
    else load()
  }

  async function readAll() {
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('is_read', false)
    load()
  }

  const unread = (items ?? []).filter((n) => !n.is_read).length

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Notificaciones" subtitle={unread ? `${unread} sin leer` : 'Estás al día'}
        action={unread > 0 && <Button variant="secondary" onClick={readAll}><CheckCheck className="size-4" />Marcar todas como leídas</Button>} />
      {items === null ? <Spinner /> : items.length === 0
        ? <EmptyState icon={<Bell className="size-5" />} title="Sin notificaciones" />
        : (
          <Card className="divide-y divide-slate-100 overflow-hidden">
            {items.map((n) => (
              <button key={n.id} onClick={() => open(n)} className={`flex w-full gap-3 p-4 text-left transition hover:bg-slate-50 ${n.is_read ? '' : 'bg-blue-50/50'}`}>
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.is_read ? 'bg-transparent' : 'bg-primary'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-muted">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                </div>
              </button>
            ))}
          </Card>
        )}
    </div>
  )
}

// ---------------------------------------------------------------- Perfil
export function Profile() {
  const { session, profile, refreshProfile } = useAuth()
  const userId = session!.user.id
  const [names, setNames] = useState({ first_name: profile?.first_name ?? '', last_name: profile?.last_name ?? '' })
  const [pwd, setPwd] = useState({ password: '', confirm: '' })
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)
  const [stats, setStats] = useState({ items: 0, recovered: 0, pending: 0 })
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => { if (profile) setNames({ first_name: profile.first_name, last_name: profile.last_name }) }, [profile])
  useEffect(() => {
    (async () => {
      const [items, claims] = await Promise.all([
        supabase.from('items').select('status').eq('user_id', userId).is('deleted_at', null),
        supabase.from('claims').select('status').eq('requester_id', userId),
      ])
      setStats({
        items: items.data?.length ?? 0,
        recovered: (claims.data ?? []).filter((c) => c.status === 'COMPLETED').length + (items.data ?? []).filter((i) => i.status === 'RESOLVED').length,
        pending: (claims.data ?? []).filter((c) => c.status === 'PENDING').length,
      })
    })()
  }, [userId])

  async function saveNames(e: FormEvent) {
    e.preventDefault()
    if (names.first_name.trim().length < 2 || names.last_name.trim().length < 2) return setMsg({ tone: 'red', text: 'Nombre y apellido son obligatorios' })
    setSaving('names')
    const { error } = await supabase.from('profiles').update({ first_name: names.first_name.trim(), last_name: names.last_name.trim() }).eq('id', userId)
    setSaving(null)
    if (error) return setMsg({ tone: 'red', text: errorMessage(error) })
    await refreshProfile()
    setMsg({ tone: 'green', text: 'Perfil actualizado' })
  }

  async function uploadAvatar(file: File | undefined) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024)
      return setMsg({ tone: 'red', text: 'La foto debe ser JPG/PNG/WEBP y pesar menos de 2 MB' })
    const path = `${userId}/avatar-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('item-images').upload(path, file, { contentType: file.type })
    if (error) return setMsg({ tone: 'red', text: errorMessage(error) })
    const url = supabase.storage.from('item-images').getPublicUrl(path).data.publicUrl
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
    await refreshProfile()
    setMsg({ tone: 'green', text: 'Foto actualizada' })
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    if (pwd.password.length < 8) return setMsg({ tone: 'red', text: 'La contraseña debe tener al menos 8 caracteres' })
    if (pwd.password !== pwd.confirm) return setMsg({ tone: 'red', text: 'Las contraseñas no coinciden' })
    setSaving('pwd')
    const { error } = await supabase.auth.updateUser({ password: pwd.password })
    setSaving(null)
    if (error) return setMsg({ tone: 'red', text: errorMessage(error) })
    setPwd({ password: '', confirm: '' })
    setMsg({ tone: 'green', text: 'Contraseña actualizada' })
  }

  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Mi perfil" />
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      <Card className="flex flex-wrap items-center gap-5 p-6">
        <label className="group relative grid size-20 cursor-pointer place-items-center overflow-hidden rounded-full bg-primary-dark text-2xl font-semibold text-white" title="Cambiar foto">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="size-full object-cover" /> : initials}
          <span className="absolute inset-0 grid place-items-center bg-black/40 text-xs opacity-0 transition group-hover:opacity-100">Cambiar</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => uploadAvatar(e.target.files?.[0])} />
        </label>
        <div className="flex-1">
          <p className="text-lg font-semibold">{profile?.first_name} {profile?.last_name}</p>
          <p className="text-sm text-muted">{session!.user.email}</p>
          <p className="text-xs text-muted">Miembro desde {formatDate(profile?.created_at)}{profile?.role === 'admin' && ' · Administrador'}</p>
        </div>
        <div className="grid w-full grid-cols-3 gap-3 text-center sm:w-auto">
          {[['Publicaciones', stats.items], ['Recuperados', stats.recovered], ['Pendientes', stats.pending]].map(([l, v]) => (
            <div key={l} className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-lg font-semibold">{v}</p><p className="text-xs text-muted">{l}</p></div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-medium">Información personal</h2>
        <form onSubmit={saveNames} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre"><Input value={names.first_name} onChange={(e) => setNames({ ...names, first_name: e.target.value })} /></Field>
            <Field label="Apellido"><Input value={names.last_name} onChange={(e) => setNames({ ...names, last_name: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end"><Button type="submit" loading={saving === 'names'}>Guardar</Button></div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-medium">Cambiar contraseña</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nueva contraseña"><Input type="password" autoComplete="new-password" value={pwd.password} onChange={(e) => setPwd({ ...pwd, password: e.target.value })} /></Field>
            <Field label="Confirmar"><Input type="password" autoComplete="new-password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end"><Button type="submit" loading={saving === 'pwd'}>Actualizar contraseña</Button></div>
        </form>
      </Card>
    </div>
  )
}
