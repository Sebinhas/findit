import { useState } from 'react'
import { Link } from 'react-router'
import { CalendarDays, Check, Lock, Mail, MapPin, PackageCheck, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Claim, ClaimStatus } from '../lib/types'
import { claimStatusLabel, errorMessage, formatDate, timeAgo } from '../lib/utils'
import { ItemImage } from './ItemCard'
import { Alert, Badge, Button, Card, Field, Modal, Textarea, type Tone } from './ui'

const statusTone: Record<ClaimStatus, Tone> = { PENDING: 'amber', ACCEPTED: 'blue', REJECTED: 'red', COMPLETED: 'green', CANCELLED: 'slate' }
export const ClaimStatusBadge = ({ status }: { status: ClaimStatus }) => <Badge tone={statusTone[status]}>{claimStatusLabel[status]}</Badge>

/**
 * Tarjeta de solicitud. `asOwner` = la ve quien publicó el objeto encontrado (puede responder/confirmar);
 * si no, la ve el solicitante (puede cancelar).
 */
export function ClaimCard({ claim, asOwner, onChange, showItem = true }:
  { claim: Claim; asOwner: boolean; onChange: () => void; showItem?: boolean }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [respond, setRespond] = useState<null | 'accept' | 'reject'>(null)
  const [responseMsg, setResponseMsg] = useState('')
  const [contact, setContact] = useState<{ finder_name: string; finder_email: string; requester_name: string; requester_email: string } | null>(null)

  async function run(name: string, fn: () => PromiseLike<{ error: unknown }>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(name); setError('')
    const { error } = await fn()
    setBusy(null)
    if (error) return setError(errorMessage(error))
    setRespond(null)
    onChange()
  }

  async function loadContact() {
    const { data, error } = await supabase.rpc('get_claim_contact', { p_claim_id: claim.id })
    if (error) return setError(errorMessage(error))
    setContact(data?.[0] ?? null)
  }

  const canSeeContact = claim.status === 'ACCEPTED' || claim.status === 'COMPLETED'

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start gap-4">
        {showItem && claim.item && (
          <Link to={`/objetos/${claim.item.id}`} className="flex min-w-0 items-center gap-3">
            <ItemImage item={claim.item} className="size-14 shrink-0 rounded-lg" />
            <div className="min-w-0">
              <p className="truncate font-medium hover:text-primary">{claim.item.title}</p>
              <p className="text-xs text-muted">{claim.item.location?.name}</p>
            </div>
          </Link>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted">{timeAgo(claim.created_at)}</span>
          <ClaimStatusBadge status={claim.status} />
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        {asOwner && claim.requester && <p className="text-muted">Solicitud de <span className="font-medium text-ink">{claim.requester.first_name} {claim.requester.last_name}</span></p>}
        <p className="whitespace-pre-line">{claim.message}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {claim.lost_date && <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" />Lo perdió: {formatDate(claim.lost_date)}</span>}
          {(claim.lost_location || claim.lost_location_detail) && (
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{[claim.lost_location?.name, claim.lost_location_detail].filter(Boolean).join(' · ')}</span>
          )}
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted"><Lock className="size-3" />Características para verificar</p>
          <p className="whitespace-pre-line">{claim.ownership_details}</p>
        </div>
        {claim.response_message && <p className="text-xs text-muted">Respuesta: <span className="text-ink">{claim.response_message}</span></p>}
        {error && <Alert>{error}</Alert>}

        {canSeeContact && (contact ? (
          <Alert tone="blue">
            <p className="font-medium">Coordinen la entrega:</p>
            <p>{asOwner ? contact.requester_name : contact.finder_name} — <a className="underline" href={`mailto:${asOwner ? contact.requester_email : contact.finder_email}`}>{asOwner ? contact.requester_email : contact.finder_email}</a></p>
            {!asOwner && claim.item?.custody_info && <p className="mt-1">Ubicación del objeto: {claim.item.custody_info}</p>}
          </Alert>
        ) : (
          <Button variant="secondary" onClick={loadContact}><Mail className="size-4" />Ver datos de contacto</Button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {asOwner && claim.status === 'PENDING' && <>
          <Button variant="secondary" onClick={() => setRespond('reject')}><X className="size-4" />Rechazar</Button>
          <Button onClick={() => setRespond('accept')}><Check className="size-4" />Aceptar</Button>
        </>}
        {asOwner && claim.status === 'ACCEPTED' && (
          <Button variant="success" loading={busy === 'complete'}
            onClick={() => run('complete', () => supabase.rpc('complete_claim', { p_claim_id: claim.id }),
              '¿Confirmas que ya entregaste el objeto? La publicación quedará resuelta y las demás solicitudes se cerrarán.')}>
            <PackageCheck className="size-4" />Confirmar devolución
          </Button>
        )}
        {!asOwner && (claim.status === 'PENDING' || claim.status === 'ACCEPTED') && (
          <Button variant="ghost" loading={busy === 'cancel'}
            onClick={() => run('cancel', () => supabase.rpc('cancel_claim', { p_claim_id: claim.id }), '¿Seguro que quieres retirar tu solicitud?')}>
            Cancelar solicitud
          </Button>
        )}
      </div>

      <Modal open={respond !== null} onClose={() => setRespond(null)} title={respond === 'accept' ? 'Aceptar solicitud' : 'Rechazar solicitud'}>
        <div className="space-y-4">
          {respond === 'accept' && <Alert tone="amber">Acepta solo si las características coinciden con lo que guardaste en privado. Después podrán ver sus correos para coordinar la entrega.</Alert>}
          <Field label="Mensaje para el solicitante (opcional)"><Textarea rows={3} value={responseMsg} onChange={(e) => setResponseMsg(e.target.value)} /></Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRespond(null)}>Volver</Button>
            <Button variant={respond === 'accept' ? 'primary' : 'danger'} loading={busy === 'respond'}
              onClick={() => run('respond', () => supabase.rpc('respond_claim', { p_claim_id: claim.id, p_accept: respond === 'accept', p_message: responseMsg.trim() || null }))}>
              {respond === 'accept' ? 'Aceptar' : 'Rechazar'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

export const CLAIM_SELECT = '*, item:items!item_id(*, category:categories(id,name,slug), location:locations(id,name)), requester:profiles!requester_id(id,first_name,last_name), lost_location:locations(id,name)'
