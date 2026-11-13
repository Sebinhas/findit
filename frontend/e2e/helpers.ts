import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// --- Entorno (.env de Vite) -------------------------------------------------
const envFile = readFileSync(fileURLToPath(new URL('../.env', import.meta.url)), 'utf8')
const env = Object.fromEntries(
  envFile.split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
export const SUPABASE_URL = env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY

/** Cliente supabase-js "crudo", para probar que el backend aplica las reglas aunque se salte la UI. */
export function apiClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
}
export async function apiLogin(email: string, password = DEMO_PASSWORD) {
  const c = apiClient()
  const { data, error } = await c.auth.signInWithPassword({ email, password })
  if (error) throw error
  return { client: c, userId: data.user.id }
}

// --- Datos ------------------------------------------------------------------
export const DEMO_PASSWORD = 'FindIt2026!'
export const DEMO = {
  laura: 'demo.laura@example.com',
  andres: 'demo.andres@example.com',
  camila: 'demo.camila@example.com',
  daniel: 'demo.daniel@example.com',
  admin: 'demo.admin@example.com',
}
export const DEMO_IDS = {
  laura: 'd0000000-0000-4000-8000-000000000001',
  andres: 'd0000000-0000-4000-8000-000000000002',
  lauraFoundCap: 'e0000000-0000-4000-8000-000000000014', // "Gorra azul New Era" (FOUND de Laura)
  andresFoundHeadphones: 'e0000000-0000-4000-8000-000000000003',
  camilaFoundCarne: 'e0000000-0000-4000-8000-000000000006', // Laura ya tiene solicitud PENDIENTE aquí
}

/** Identificador único por ejecución: se usa en correos y títulos para no chocar con otras corridas. */
export const RUN = Date.now().toString(36)

export function e2eUser(tag: string) {
  return { first: `E2E${tag}`, last: `Prueba`, email: `e2e-${RUN}-${tag.toLowerCase()}@example.com`, password: 'E2e-Password-123' }
}
export type E2EUser = ReturnType<typeof e2eUser>

/** PNG 1x1 válido para probar la subida de fotos. */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')

// --- Acciones de UI -----------------------------------------------------------
export async function register(page: Page, u: E2EUser) {
  await page.goto('/registro')
  await page.getByLabel(/^Nombre/).fill(u.first)
  await page.getByLabel(/^Apellido/).fill(u.last)
  await page.getByLabel(/^Correo electrónico/).fill(u.email)
  await page.getByLabel(/^Contraseña/).fill(u.password)
  await page.getByLabel(/^Confirmar contraseña/).fill(u.password)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page).toHaveURL(/\/inicio$/)
  await expect(page.getByRole('heading', { name: new RegExp(`Hola, ${u.first}`) })).toBeVisible()
}

export async function login(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto('/login')
  await page.getByLabel(/^Correo electrónico/).fill(email)
  await page.getByLabel(/^Contraseña/).fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/inicio$/)
}

export interface NewItem {
  type: 'LOST' | 'FOUND'
  title: string
  description: string
  category?: string
  location?: string
  privateDetails?: string
  custody?: string
  photo?: boolean
}

/** Publica un objeto desde el formulario y devuelve el id de la publicación creada. */
export async function createItem(page: Page, it: NewItem) {
  await page.goto('/reportar')
  await page.getByRole('button', { name: it.type === 'LOST' ? /Perdí algo/ : /Encontré algo/ }).click()
  await page.getByLabel(/^Nombre del objeto/).fill(it.title)
  await page.getByLabel(/^Categoría/).selectOption({ label: it.category ?? 'Otros' })
  await page.getByLabel(/^Lugar/).selectOption({ label: it.location ?? 'Otro' })
  await page.getByLabel(/^Descripción pública/).fill(it.description)
  if (it.custody) await page.getByLabel(/^¿Dónde está ahora/).fill(it.custody)
  if (it.privateDetails) await page.getByLabel('Características privadas').fill(it.privateDetails)
  if (it.photo) {
    await page.locator('input[type=file]').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: TINY_PNG })
    await expect(page.getByAltText('Vista previa')).toBeVisible()
  }
  await page.getByRole('button', { name: 'Publicar' }).click()
  await expect(page).toHaveURL(/\/objetos\/[0-9a-f-]{36}$/)
  await expect(page.getByText('Publicación guardada')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: it.title })).toBeVisible()
  return page.url().split('/').pop()!
}
