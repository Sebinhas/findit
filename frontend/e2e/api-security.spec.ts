import { expect, test } from '@playwright/test'
import { DEMO, DEMO_IDS, TINY_PNG, apiClient, apiLogin } from './helpers'

/**
 * Estas pruebas se SALTAN la interfaz y llaman a Supabase directamente con supabase-js,
 * como lo haría alguien malintencionado desde la consola del navegador.
 * Demuestran que las reglas viven en el servidor (RLS + funciones SQL), no solo en el frontend.
 */
test.describe('Seguridad del backend (Supabase directo)', () => {
  test('anónimo: no ve datos privados ni puede usar funciones', async () => {
    const anon = apiClient()
    const priv = await anon.from('item_private_details').select('*')
    expect(priv.data).toEqual([])
    const notif = await anon.from('notifications').select('*')
    expect(notif.data).toEqual([])
    const stats = await anon.rpc('admin_stats')
    expect(stats.error).not.toBeNull()
    const claim = await anon.rpc('create_claim', { p_item_id: DEMO_IDS.camilaFoundCarne, p_message: 'xxxxxxxxxxxx', p_ownership_details: 'xxxxxx' })
    expect(claim.error).not.toBeNull()
  })

  test('anónimo: sí puede ver el catálogo público', async () => {
    const { data } = await apiClient().from('items').select('id,title').limit(5)
    expect(data!.length).toBeGreaterThan(0)
  })

  test('un usuario no ve las características privadas de objetos ajenos', async () => {
    const { client } = await apiLogin(DEMO.laura)
    const { data } = await client.from('item_private_details').select('*').eq('item_id', DEMO_IDS.andresFoundHeadphones)
    expect(data).toEqual([])
  })

  test('un usuario no puede modificar publicaciones ajenas', async () => {
    const { client } = await apiLogin(DEMO.laura)
    await client.from('items').update({ title: 'HACKEADO' }).eq('id', DEMO_IDS.andresFoundHeadphones)
    const { data } = await client.from('items').select('title').eq('id', DEMO_IDS.andresFoundHeadphones).single()
    expect(data!.title).not.toBe('HACKEADO')
  })

  test('un usuario no puede publicar a nombre de otro', async () => {
    const { client } = await apiLogin(DEMO.laura)
    const cat = await client.from('categories').select('id').limit(1).single()
    const loc = await client.from('locations').select('id').limit(1).single()
    const { error } = await client.from('items').insert({
      user_id: DEMO_IDS.andres, type: 'LOST', title: 'Suplantación', description: 'Intento de suplantación de usuario',
      category_id: cat.data!.id, location_id: loc.data!.id, incident_date: '2026-01-01',
    })
    expect(error?.message).toMatch(/row-level security/)
  })

  test('un usuario no puede darse rol de administrador', async () => {
    const { client, userId } = await apiLogin(DEMO.laura)
    const { error } = await client.from('profiles').update({ role: 'admin' }).eq('id', userId)
    expect(error?.message).toContain('No tienes permiso para cambiar el rol')
  })

  test('reglas de solicitudes: propia, duplicada, objeto resuelto y escritura directa', async () => {
    const { client, userId } = await apiLogin(DEMO.laura)
    const base = { p_message: 'Creo que este objeto es mío de verdad', p_ownership_details: 'Detalle particular' }

    const own = await client.rpc('create_claim', { ...base, p_item_id: DEMO_IDS.lauraFoundCap })
    expect(own.error?.message).toBe('No puedes reclamar tu propia publicación')

    const dup = await client.rpc('create_claim', { ...base, p_item_id: DEMO_IDS.camilaFoundCarne })
    expect(dup.error?.message).toBe('Ya tienes una solicitud activa para este objeto')

    const resolved = await client.rpc('create_claim', { ...base, p_item_id: DEMO_IDS.andresFoundHeadphones })
    expect(resolved.error?.message).toBe('Esta publicación ya no está disponible')

    // No hay política de INSERT en claims: solo se puede crear vía create_claim
    const direct = await client.from('claims').insert({ item_id: DEMO_IDS.camilaFoundCarne, requester_id: userId, message: 'x', ownership_details: 'x' })
    expect(direct.error?.message).toMatch(/row-level security/)
  })

  test('el solicitante no puede aceptar su propia solicitud ni ver contactos antes de tiempo', async () => {
    const { client, userId } = await apiLogin(DEMO.laura)
    const { data: pending } = await client.from('claims').select('id').eq('requester_id', userId).eq('status', 'PENDING').limit(1).single()
    const accept = await client.rpc('respond_claim', { p_claim_id: pending!.id, p_accept: true })
    expect(accept.error?.message).toBe('Solo quien publicó el objeto puede responder')
    const contact = await client.rpc('get_claim_contact', { p_claim_id: pending!.id })
    expect(contact.error?.message).toBe('La solicitud aún no ha sido aceptada')
  })

  test('un usuario no puede crear notificaciones ni ver las de otros', async () => {
    const { client } = await apiLogin(DEMO.laura)
    const ins = await client.from('notifications').insert({ user_id: DEMO_IDS.andres, type: 'SYSTEM', title: 'spam', message: 'spam' })
    expect(ins.error?.message).toMatch(/row-level security/)
    const { data } = await client.from('notifications').select('user_id')
    expect(data!.every((n) => n.user_id === DEMO_IDS.laura)).toBe(true)
  })

  test('un usuario normal no puede usar funciones de administrador', async () => {
    const { client } = await apiLogin(DEMO.laura)
    expect((await client.rpc('admin_stats')).error?.message).toBe('Solo administradores')
    expect((await client.rpc('admin_list_users')).error?.message).toBe('Solo administradores')
  })

  test('el administrador sí accede a las estadísticas', async () => {
    const { client } = await apiLogin(DEMO.admin)
    const { data, error } = await client.rpc('admin_stats')
    expect(error).toBeNull()
    expect(data.users).toBeGreaterThanOrEqual(5)
    expect(data.recovery_rate).toBeGreaterThan(0)
  })

  test('storage: solo en tu carpeta, solo imágenes', async () => {
    const { client, userId } = await apiLogin(DEMO.laura)
    const bucket = client.storage.from('item-images')

    const foreign = await bucket.upload(`${DEMO_IDS.andres}/intruso.png`, TINY_PNG, { contentType: 'image/png' })
    expect(foreign.error).not.toBeNull()

    const notImage = await bucket.upload(`${userId}/script.txt`, Buffer.from('hola'), { contentType: 'text/plain' })
    expect(notImage.error).not.toBeNull()

    const okPath = `${userId}/e2e-${Date.now()}.png`
    const ok = await bucket.upload(okPath, TINY_PNG, { contentType: 'image/png' })
    expect(ok.error).toBeNull()
    expect((await bucket.remove([okPath])).error).toBeNull()
  })
})
