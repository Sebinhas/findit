import { apiLogin, DEMO } from './helpers'

/**
 * Antes de cada corrida: el admin demo elimina (soft-delete) las publicaciones activas que dejaron
 * corridas E2E anteriores. Así no generan coincidencias "fantasma" con las de esta corrida.
 * Usa los permisos normales de administrador (RLS) — nada de service_role.
 * El borrado definitivo de usuarios e2e se hace con supabase/cleanup.sql.
 */
export default async function globalSetup() {
  const { client } = await apiLogin(DEMO.admin)
  const { data: users, error } = await client.from('profiles').select('id').like('first_name', 'E2E%')
  if (error) throw error
  const ids = (users ?? []).map((u) => u.id)
  if (ids.length === 0) return
  const { error: delError } = await client.from('items').update({ deleted_at: new Date().toISOString() })
    .in('user_id', ids).is('deleted_at', null)
  if (delError) throw delError
}
