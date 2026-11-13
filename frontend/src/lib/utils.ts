import type { ClaimStatus, ItemStatus, ItemType } from './types'

export const typeLabel: Record<ItemType, string> = { LOST: 'Perdido', FOUND: 'Encontrado' }
export const itemStatusLabel: Record<ItemStatus, string> = { ACTIVE: 'Activo', RESOLVED: 'Resuelto', CLOSED: 'Cerrado' }
export const claimStatusLabel: Record<ClaimStatus, string> = {
  PENDING: 'Pendiente', ACCEPTED: 'Aceptada', REJECTED: 'Rechazada', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
}
export const reportReasonLabel: Record<string, string> = {
  SPAM: 'Spam', INAPPROPRIATE: 'Contenido inapropiado', FRAUD: 'Posible fraude',
  SENSITIVE_DATA: 'Expone datos sensibles', OTHER: 'Otro',
}

export function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  // Fechas "YYYY-MM-DD" se interpretan como locales para no correr un día por zona horaria
  const date = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T00:00:00') : new Date(d)
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function timeAgo(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000
  if (s < 60) return 'hace un momento'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  if (s < 86400 * 30) return `hace ${Math.floor(s / 86400)} d`
  return formatDate(d)
}

export const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local

/** Convierte errores de Supabase/Postgres en mensajes legibles. */
export function errorMessage(e: unknown): string {
  if (!e) return 'Ocurrió un error inesperado'
  const msg = typeof e === 'string' ? e : (e as { message?: string }).message ?? String(e)
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos'
  if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese correo'
  if (msg.includes('Email not confirmed')) return 'Debes confirmar tu correo antes de entrar'
  if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres'
  if (msg.includes('row-level security')) return 'No tienes permiso para realizar esta acción'
  return msg
}

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}
