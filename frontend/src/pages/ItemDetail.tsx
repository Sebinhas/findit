import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, CalendarDays, CheckCircle2, Flag, Hand, Lock, MapPin, Package, Pencil, SearchX, Sparkles, Tag, Trash2, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, ITEM_SELECT } from '../lib/supabase'
import { useCatalogs, useMyMatches } from '../lib/hooks'
import type { Claim, Item } from '../lib/types'
import { errorMessage, formatDate, reportReasonLabel, today } from '../lib/utils'
import { ItemImage, StatusBadge, TypeBadge } from '../components/ItemCard'
import { MatchCard } from '../components/MatchCard'
import { CLAIM_SELECT, ClaimCard, ClaimStatusBadge } from '../components/ClaimCard'
import { Alert, Button, Card, EmptyState, Field, Input, Modal, Select, Spinner, Textarea } from '../components/ui'

export default function ItemDetail() {
  const { id } = useParams()
  const { session, profile } = useAuth()
  const userId = session!.user.id
  const navigate = useNavigate()
  const justSaved = (useLocation().state as { justSaved?: boolean } | null)?.justSaved
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [privateDetails, setPrivateDetails] = useState<string | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [myClaim, setMyClaim] = useState<Claim | null>(null)
  const [claimOpen, setClaimOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState(justSaved ? 'Publicación guardada. Revisa abajo si hay posibles coincidencias.' : '')

  const isOwner = item?.user_id === userId
  const { matches, reload: reloadMatches } = useMyMatches(isOwner ? userId : undefined, id)

  const load = useCallback(async () => {
    const { data } = await supabase.from('items').select(ITEM_SELECT).eq('id', id!).maybeSingle<Item>()
    setItem(data)
    setLoading(false)
    if (!data) return
    if (data.user_id === userId) {
      const [{ data: priv }, { data: cl }] = await Promise.all([
        supabase.from('item_private_details').select('details').eq('item_id', data.id).maybeSingle(),
        supabase.from('claims').select(CLAIM_SELECT).eq('item_id', data.id).order('created_at', { ascending: false }),
      ])
      setPrivateDetails(priv?.details ?? null)
      setClaims((cl ?? []) as Claim[])
    } else {
      const { data: mine } = await supabase.from('claims').select(CLAIM_SELECT).eq('item_id', data.id).eq('requester_id', userId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
      setMyClaim(mine as Claim | null)
    }
  }, [id, userId])

  useEffect(() => { load() }, [load])

  async function updateItem(patch: Partial<Item>, confirmText: string, after?: () => void) {
    if (!window.confirm(confirmText)) return
    setError('')
    const { error } = await supabase.from('items').update(patch).eq('id', item!.id)
    if (error) return setError(errorMessage(error))
    if (after) after()
    else load()
  }

  if (loading) return <Spinner />
  if (!item) return <EmptyState icon={<SearchX className="size-5" />} title="Publicación no encontrada" text="Puede que haya sido eliminada u ocultada."
    action={<Link to="/explorar" className="text-sm font-medium text-primary hover:underline">Volver al catálogo</Link>} />

  const active = item.status === 'ACTIVE' && !item.is_hidden && !item.deleted_at
  const canClaim = !isOwner && item.type === 'FOUND' && active && profile?.is_active
    && !(myClaim && (myClaim.status === 'PENDING' || myClaim.status === 'ACCEPTED'))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" />Volver</button>
      {flash && <Alert tone="green"><div className="flex justify-between gap-2">{flash}<button onClick={() => setFlash('')}>×</button></div></Alert>}
      {error && <Alert>{error}</Alert>}
      {item.is_hidden && <Alert>Esta publicación fue ocultada por moderación{item.hidden_reason ? `: ${item.hidden_reason}` : ''}.</Alert>}

      <div className="grid gap-6 lg:grid-cols-5">
        <ItemImage item={item} className="aspect-[4/3] w-full rounded-xl lg:col-span-3" />
        <Card className="space-y-4 p-6 lg:col-span-2">
          <div className="flex flex-wrap gap-2"><TypeBadge type={item.type} /><StatusBadge item={item} /></div>
          <h1 className="text-2xl font-semibold tracking-tight">{item.title}</h1>
          <dl className="space-y-2.5 text-sm">
            <Info icon={Tag} label="Categoría" value={item.category?.name} />
            <Info icon={MapPin} label="Lugar" value={[item.location?.name, item.location_detail].filter(Boolean).join(' · ')} />
            <Info icon={CalendarDays} label={item.type === 'LOST' ? 'Perdido el' : 'Encontrado el'} value={formatDate(item.incident_date)} />
            <Info icon={User} label="Publicado por" value={`${item.owner?.first_name ?? ''} ${item.owner?.last_name?.[0] ?? ''}.`} />
            {item.custody_info && <Info icon={Package} label="Dónde está" value={item.custody_info} />}
          </dl>

          {!isOwner && myClaim && (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
              <span>Tu solicitud</span><ClaimStatusBadge status={myClaim.status} />
            </div>
          )}
          {canClaim && <Button className="w-full" onClick={() => setClaimOpen(true)}><Hand className="size-4" />Es mío, quiero reclamarlo</Button>}
          {!isOwner && item.type === 'LOST' && active && (
            <Alert tone="blue">¿Lo encontraste? <Link to="/reportar" className="font-medium underline">Publícalo como encontrado</Link> y el dueño será notificado si coincide.</Alert>
          )}
          {!isOwner && (
            <button onClick={() => setReportOpen(true)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-danger"><Flag className="size-3.5" />Reportar publicación</button>
          )}

          {isOwner && item.status === 'ACTIVE' && !item.deleted_at && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Link to={`/objetos/${item.id}/editar`}><Button variant="secondary"><Pencil className="size-4" />Editar</Button></Link>
              {item.type === 'LOST' && (
                <Button variant="success" onClick={() => updateItem({ status: 'RESOLVED' }, '¿Marcar como recuperado? La publicación dejará de estar activa.')}>
                  <CheckCircle2 className="size-4" />Ya lo recuperé
                </Button>
              )}
              <Button variant="ghost" onClick={() => updateItem({ status: 'CLOSED' }, '¿Cerrar esta publicación? Dejará de aparecer en el catálogo.')}>Cerrar</Button>
            </div>
          )}
          {isOwner && !item.deleted_at && (
            <button className="inline-flex items-center gap-1 text-xs text-danger hover:underline"
              onClick={() => updateItem({ deleted_at: new Date().toISOString() }, '¿Eliminar esta publicación? No se puede deshacer.', () => navigate('/mis-publicaciones'))}>
              <Trash2 className="size-3.5" />Eliminar publicación
            </button>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-2 font-medium">Descripción</h2>
        <p className="whitespace-pre-line text-sm text-slate-700">{item.description}</p>
      </Card>

      {isOwner && privateDetails && (
        <Card className="border-amber-200 bg-amber-50/50 p-6">
          <h2 className="mb-2 flex items-center gap-2 font-medium"><Lock className="size-4" />Características privadas <span className="text-xs font-normal text-muted">(solo tú las ves)</span></h2>
          <p className="whitespace-pre-line text-sm">{privateDetails}</p>
        </Card>
      )}

      {isOwner && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Sparkles className="size-5 text-primary" />Posibles coincidencias</h2>
          {matches.length === 0
            ? <EmptyState icon={<Sparkles className="size-5" />} title="Sin coincidencias todavía" text="Te notificaremos si alguien publica algo parecido." />
            : <div className="grid gap-4 md:grid-cols-2">{matches.map((m) => <MatchCard key={m.id} match={m} userId={userId} onDismiss={reloadMatches} />)}</div>}
        </section>
      )}

      {isOwner && item.type === 'FOUND' && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Solicitudes recibidas ({claims.length})</h2>
          {claims.length === 0
            ? <EmptyState icon={<Hand className="size-5" />} title="Nadie ha reclamado este objeto aún" />
            : <div className="space-y-4">{claims.map((c) => <ClaimCard key={c.id} claim={c} asOwner showItem={false} onChange={load} />)}</div>}
        </section>
      )}

      {!isOwner && myClaim && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Tu solicitud</h2>
          <ClaimCard claim={myClaim} asOwner={false} showItem={false} onChange={load} />
        </section>
      )}

      <ClaimModal open={claimOpen} onClose={() => setClaimOpen(false)} item={item} userId={userId}
        onDone={() => { setClaimOpen(false); setFlash('Solicitud enviada. Te avisaremos cuando la revisen.'); load() }} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} itemId={item.id} userId={userId}
        onDone={() => { setReportOpen(false); setFlash('Gracias, un administrador revisará la publicación.') }} />
    </div>
  )
}

function Info({ icon: Icon, label, value }: { icon: typeof Tag; label: string; value?: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted" />
      <div><dt className="text-xs text-muted">{label}</dt><dd>{value || '—'}</dd></div>
    </div>
  )
}

function ClaimModal({ open, onClose, item, userId, onDone }: { open: boolean; onClose: () => void; item: Item; userId: string; onDone: () => void }) {
  const { locations } = useCatalogs()
  const [myLost, setMyLost] = useState<Pick<Item, 'id' | 'title'>[]>([])
  const [form, setForm] = useState({ message: '', ownership_details: '', lost_date: '', lost_location_id: '', lost_location_detail: '', lost_item_id: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    supabase.from('items').select('id,title').eq('user_id', userId).eq('type', 'LOST').eq('status', 'ACTIVE').is('deleted_at', null)
      .then(({ data }) => setMyLost(data ?? []))
  }, [open, userId])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.message.trim().length < 10) return setError('Explica por qué crees que es tuyo (mínimo 10 caracteres)')
    if (form.ownership_details.trim().length < 5) return setError('Describe alguna característica particular del objeto')
    setSaving(true)
    const { error } = await supabase.rpc('create_claim', {
      p_item_id: item.id, p_message: form.message, p_ownership_details: form.ownership_details,
      p_lost_date: form.lost_date || null, p_lost_location_id: form.lost_location_id || null,
      p_lost_location_detail: form.lost_location_detail.trim() || null, p_lost_item_id: form.lost_item_id || null,
    })
    setSaving(false)
    if (error) return setError(errorMessage(error))
    setForm({ message: '', ownership_details: '', lost_date: '', lost_location_id: '', lost_location_detail: '', lost_item_id: '' })
    onDone()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Reclamar "${item.title}"`}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="¿Por qué crees que es tuyo?" required><Textarea rows={3} value={form.message} onChange={set('message')} /></Field>
        <Field label="Características particulares" required hint="Detalles que no aparecen en la publicación: marcas, stickers, contenido, fondo de pantalla...">
          <Textarea rows={3} value={form.ownership_details} onChange={set('ownership_details')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="¿Cuándo lo perdiste?"><Input type="date" max={today()} value={form.lost_date} onChange={set('lost_date')} /></Field>
          <Field label="¿Dónde?">
            <Select value={form.lost_location_id} onChange={set('lost_location_id')}>
              <option value="">Selecciona...</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Detalle del lugar"><Input value={form.lost_location_detail} onChange={set('lost_location_detail')} maxLength={200} /></Field>
        {myLost.length > 0 && (
          <Field label="Vincular con mi reporte de objeto perdido" hint="Si se confirma la devolución, tu reporte también se marcará como resuelto.">
            <Select value={form.lost_item_id} onChange={set('lost_item_id')}>
              <option value="">No vincular</option>
              {myLost.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </Select>
          </Field>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={saving}>Enviar solicitud</Button>
        </div>
      </form>
    </Modal>
  )
}

function ReportModal({ open, onClose, itemId, userId, onDone }: { open: boolean; onClose: () => void; itemId: string; userId: string; onDone: () => void }) {
  const [reason, setReason] = useState('INAPPROPRIATE')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const { error } = await supabase.from('reports').insert({ item_id: itemId, reporter_id: userId, reason, description: description.trim() || null })
    setSaving(false)
    if (error) return setError(errorMessage(error))
    setDescription('')
    onDone()
  }

  return (
    <Modal open={open} onClose={onClose} title="Reportar publicación">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Motivo">
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {Object.entries(reportReasonLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Detalles (opcional)"><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="danger" loading={saving}>Enviar reporte</Button>
        </div>
      </form>
    </Modal>
  )
}
