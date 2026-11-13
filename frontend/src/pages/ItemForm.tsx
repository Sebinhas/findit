import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ImagePlus, Lock, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useCatalogs } from '../lib/hooks'
import type { Item, ItemType } from '../lib/types'
import { errorMessage, today } from '../lib/utils'
import { Alert, Button, Card, Field, Input, PageHeader, Select, Spinner, Textarea } from '../components/ui'

const MAX_MB = 5
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

const empty = {
  type: 'LOST' as ItemType, title: '', description: '', category_id: '', location_id: '',
  location_detail: '', incident_date: today(), custody_info: '', private_details: '',
}

export default function ItemForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { session, profile } = useAuth()
  const userId = session!.user.id
  const navigate = useNavigate()
  const { categories, locations } = useCatalogs()
  const [form, setForm] = useState(empty)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const { data: item } = await supabase.from('items').select('*').eq('id', id).single<Item>()
      if (!item || item.user_id !== userId || item.status !== 'ACTIVE') { navigate(`/objetos/${id}`, { replace: true }); return }
      const { data: priv } = await supabase.from('item_private_details').select('details').eq('item_id', id).maybeSingle()
      setForm({
        type: item.type, title: item.title, description: item.description, category_id: item.category_id,
        location_id: item.location_id, location_detail: item.location_detail ?? '', incident_date: item.incident_date,
        custody_info: item.custody_info ?? '', private_details: priv?.details ?? '',
      })
      setImageUrl(item.image_url)
      setLoading(false)
    })()
  }, [id, userId, navigate])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  function pickFile(f: File | undefined) {
    setError('')
    if (!f) return
    if (!ALLOWED.includes(f.type)) return setError('La imagen debe ser JPG, PNG o WEBP')
    if (f.size > MAX_MB * 1024 * 1024) return setError(`La imagen no puede superar ${MAX_MB} MB`)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.title.trim().length < 3) return setError('El nombre del objeto debe tener al menos 3 caracteres')
    if (form.description.trim().length < 10) return setError('La descripción debe tener al menos 10 caracteres')
    if (!form.category_id || !form.location_id) return setError('Selecciona categoría y lugar')
    if (form.incident_date > today()) return setError('La fecha no puede estar en el futuro')

    setSaving(true)
    try {
      let image_url = imageUrl
      if (file) {
        const path = `${userId}/${crypto.randomUUID()}.${file.name.split('.').pop()?.toLowerCase() ?? 'jpg'}`
        const { error: upErr } = await supabase.storage.from('item-images').upload(path, file, { contentType: file.type })
        if (upErr) throw upErr
        image_url = supabase.storage.from('item-images').getPublicUrl(path).data.publicUrl
      }
      const payload = {
        title: form.title.trim(), description: form.description.trim(), category_id: form.category_id,
        location_id: form.location_id, location_detail: form.location_detail.trim() || null,
        incident_date: form.incident_date, custody_info: form.custody_info.trim() || null, image_url,
      }
      let itemId = id
      if (isEdit) {
        const { error } = await supabase.from('items').update(payload).eq('id', id!)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('items').insert({ ...payload, type: form.type, user_id: userId }).select('id').single()
        if (error) throw error
        itemId = data.id
      }
      const details = form.private_details.trim()
      if (details) {
        const { error } = await supabase.from('item_private_details').upsert({ item_id: itemId!, details })
        if (error) throw error
      } else if (isEdit) {
        await supabase.from('item_private_details').delete().eq('item_id', itemId!)
      }
      navigate(`/objetos/${itemId}`, { state: { justSaved: true } })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />
  const isFound = form.type === 'FOUND'
  const shownImage = preview ?? imageUrl

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={isEdit ? 'Editar publicación' : 'Reportar objeto'}
        subtitle={isEdit ? undefined : 'Al publicar, buscaremos automáticamente posibles coincidencias.'} />
      {profile && !profile.is_active && <div className="mb-4"><Alert>Tu cuenta está bloqueada y no puede publicar.</Alert></div>}

      <form onSubmit={submit} className="space-y-6">
        {!isEdit && (
          <div className="grid grid-cols-2 gap-3">
            {(['LOST', 'FOUND'] as const).map((t) => (
              <button type="button" key={t} onClick={() => setForm({ ...form, type: t })}
                className={`rounded-xl border-2 p-4 text-left transition ${form.type === t ? 'border-primary bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <p className="font-medium">{t === 'LOST' ? 'Perdí algo' : 'Encontré algo'}</p>
                <p className="mt-1 text-xs text-muted">{t === 'LOST' ? 'Publica lo que buscas' : 'Ayuda a devolverlo a su dueño'}</p>
              </button>
            ))}
          </div>
        )}

        <Card className="space-y-4 p-6">
          {error && <Alert>{error}</Alert>}
          <Field label="Nombre del objeto" required><Input value={form.title} onChange={set('title')} maxLength={120} placeholder="Ej: Audífonos inalámbricos negros" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría" required>
              <Select value={form.category_id} onChange={set('category_id')}>
                <option value="">Selecciona...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label={isFound ? 'Fecha en que lo encontraste' : 'Fecha aproximada de pérdida'} required>
              <Input type="date" max={today()} value={form.incident_date} onChange={set('incident_date')} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lugar" required>
              <Select value={form.location_id} onChange={set('location_id')}>
                <option value="">Selecciona...</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>
            <Field label="Detalle del lugar"><Input value={form.location_detail} onChange={set('location_detail')} maxLength={200} placeholder="Ej: segundo piso, mesas del fondo" /></Field>
          </div>
          <Field label="Descripción pública" required hint="No incluyas números de documento, contraseñas ni datos que permitan a cualquiera reclamarlo.">
            <Textarea value={form.description} onChange={set('description')} placeholder="Color, marca, tamaño, estado..." />
          </Field>
          {isFound && (
            <Field label="¿Dónde está ahora / cómo coordinar la entrega?" hint="Ej: lo dejé en portería del Bloque A">
              <Input value={form.custody_info} onChange={set('custody_info')} />
            </Field>
          )}
        </Card>

        <Card className="space-y-3 p-6">
          <div className="flex items-center gap-2"><Lock className="size-4 text-muted" /><h2 className="font-medium">Características privadas</h2></div>
          <p className="text-xs text-muted">
            {isFound
              ? 'Un detalle que solo el verdadero dueño conocería (ej: sticker en la parte trasera, fondo de pantalla). Nadie más lo verá; úsalo para verificar solicitudes.'
              : 'Detalles que te ayudarán a demostrar que es tuyo. Solo tú los verás.'}
          </p>
          <Textarea rows={3} aria-label="Características privadas" value={form.private_details} onChange={set('private_details')} />
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 font-medium">Fotografía <span className="text-sm font-normal text-muted">(opcional)</span></h2>
          {shownImage ? (
            <div className="relative">
              <img src={shownImage} alt="Vista previa" className="max-h-72 w-full rounded-lg object-cover" />
              <Button type="button" variant="secondary" className="absolute right-2 top-2"
                onClick={() => { setFile(null); setPreview(null); setImageUrl(null) }}><Trash2 className="size-4" />Quitar</Button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-slate-300 py-10 text-muted hover:border-primary hover:text-primary">
              <ImagePlus className="size-8" />
              <span className="mt-2 text-sm">Haz clic para subir una imagen</span>
              <span className="text-xs">JPG, PNG o WEBP · máx {MAX_MB} MB</span>
              <input type="file" accept={ALLOWED.join(',')} className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} />
            </label>
          )}
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" loading={saving} disabled={profile ? !profile.is_active : false}>{isEdit ? 'Guardar cambios' : 'Publicar'}</Button>
        </div>
      </form>
    </div>
  )
}
