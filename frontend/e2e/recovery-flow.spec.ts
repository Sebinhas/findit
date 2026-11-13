import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { RUN, createItem, e2eUser, register } from './helpers'

/**
 * Escenario de aceptación del MVP (sección 14 de la documentación), de punta a punta en la UI real:
 * A pierde → B encuentra → coincidencia + notificación → A reclama → B acepta → contacto → B confirma → resuelto.
 */
test.describe.configure({ mode: 'serial' })

const A = e2eUser('A') // perdió el objeto
const B = e2eUser('B') // lo encontró
const LOST_TITLE = `Paraguas amarillo plegable ${RUN}`
const FOUND_TITLE = `Paraguas plegable amarillo ${RUN}`
const SECRET = `Tiene un llavero de un pato ${RUN}`

let ctxA: BrowserContext, ctxB: BrowserContext
let pageA: Page, pageB: Page
let lostId: string, foundId: string

test.beforeAll(async ({ browser }) => {
  ctxA = await browser.newContext()
  ctxB = await browser.newContext()
  pageA = await ctxA.newPage()
  pageB = await ctxB.newPage()
  // Las confirmaciones (window.confirm) se aceptan automáticamente
  pageB.on('dialog', (d) => d.accept())
  pageA.on('dialog', (d) => d.accept())
})
test.afterAll(async () => { await ctxA.close(); await ctxB.close() })

test('1. A se registra y publica que perdió un objeto', async () => {
  await register(pageA, A)
  lostId = await createItem(pageA, {
    type: 'LOST', title: LOST_TITLE,
    description: 'Paraguas amarillo plegable con mango negro, lo dejé colgado en una silla.',
  })
  await expect(pageA.getByText('Perdido el')).toBeVisible()
})

test('2. B se registra y publica el objeto encontrado, con foto y característica privada', async () => {
  await register(pageB, B)
  foundId = await createItem(pageB, {
    type: 'FOUND', title: FOUND_TITLE,
    description: 'Encontré un paraguas amarillo plegable, mango negro, colgado de una silla.',
    custody: 'Lo tengo en mi casillero', privateDetails: SECRET, photo: true,
  })
  // La foto se subió a Supabase Storage y se muestra desde su URL pública
  const img = pageB.getByRole('img', { name: FOUND_TITLE }).first()
  await expect(img).toBeVisible()
  await expect(img).toHaveAttribute('src', /\/storage\/v1\/object\/public\/item-images\//)
  // El dueño ve su característica privada
  await expect(pageB.getByText(SECRET)).toBeVisible()
  // El dueño no puede reclamar su propio objeto
  await expect(pageB.getByRole('button', { name: /Es mío/ })).toHaveCount(0)
})

test('3. El sistema detecta la coincidencia y se la muestra a B con su puntuación', async () => {
  await pageB.reload()
  const link = pageB.getByRole('link', { name: new RegExp(LOST_TITLE) })
  await expect(link).toBeVisible()
  const card = link.locator('xpath=..') // la tarjeta MatchCard que contiene ese enlace
  await expect(card).toContainText('100%')
  await card.getByRole('button', { name: /Ver cómo se calculó/ }).click()
  await expect(card).toContainText('Categoría30/30')
  await expect(card).toContainText('Palabras clave30/30')
  await expect(card).toContainText('Ubicación25/25')
  await expect(card).toContainText('Fecha15/15')
})

test('4. A recibe la notificación y ve la coincidencia en su dashboard', async () => {
  await pageA.goto('/inicio')
  await expect(pageA.getByRole('link', { name: /Notificaciones/ })).toContainText(/\d/)
  const matchesSection = pageA.locator('section').filter({ has: pageA.getByRole('heading', { name: 'Tus posibles coincidencias' }) })
  await expect(matchesSection.getByRole('link', { name: new RegExp(FOUND_TITLE) })).toBeVisible()

  await pageA.goto('/notificaciones')
  await expect(pageA.getByText(`Alguien encontró algo parecido a "${LOST_TITLE}"`)).toBeVisible()
})

test('5. A abre el objeto encontrado: NO ve la característica privada y envía una solicitud', async () => {
  await pageA.getByText(`Alguien encontró algo parecido a "${LOST_TITLE}"`).click()
  await expect(pageA).toHaveURL(new RegExp(`/objetos/${foundId}$`))
  await expect(pageA.getByRole('heading', { level: 1, name: FOUND_TITLE })).toBeVisible()
  await expect(pageA.getByText(SECRET)).toHaveCount(0)
  await expect(pageA.getByText('Lo tengo en mi casillero')).toBeVisible()

  await pageA.getByRole('button', { name: /Es mío, quiero reclamarlo/ }).click()
  const dialog = pageA.getByRole('dialog')
  await dialog.getByLabel(/^¿Por qué crees que es tuyo/).fill('Es mi paraguas, lo dejé ayer en una silla.')
  await dialog.getByLabel(/^Características particulares/).fill('Tiene un llavero de un pato colgado del mango.')
  await dialog.getByLabel(/^Vincular con mi reporte/).selectOption({ label: LOST_TITLE })
  await dialog.getByRole('button', { name: 'Enviar solicitud' }).click()

  await expect(pageA.getByText('Solicitud enviada')).toBeVisible()
  await expect(pageA.getByRole('button', { name: /Es mío/ })).toHaveCount(0) // no puede duplicar
  await expect(pageA.getByText('Pendiente').first()).toBeVisible()
})

test('6. B revisa la solicitud recibida y la acepta', async () => {
  await pageB.goto('/solicitudes?tab=recibidas')
  const card = pageB.locator('div').filter({ hasText: 'Es mi paraguas, lo dejé ayer en una silla.' }).last()
  await expect(card.getByText('Tiene un llavero de un pato colgado del mango.')).toBeVisible()
  await pageB.getByRole('button', { name: 'Aceptar' }).click()
  const dialog = pageB.getByRole('dialog')
  await dialog.getByLabel(/^Mensaje para el solicitante/).fill('Coincide el llavero, ¡es tuyo!')
  await dialog.getByRole('button', { name: 'Aceptar' }).click()
  await expect(pageB.getByText('Aceptada').first()).toBeVisible()

  // Tras aceptar, B puede ver el correo de A para coordinar
  await pageB.getByRole('button', { name: /Ver datos de contacto/ }).click()
  await expect(pageB.getByRole('link', { name: A.email })).toBeVisible()
})

test('7. A ve su solicitud aceptada y el contacto de B', async () => {
  await pageA.goto('/solicitudes')
  await expect(pageA.getByText('Aceptada').first()).toBeVisible()
  await expect(pageA.getByText('Coincide el llavero, ¡es tuyo!')).toBeVisible()
  await pageA.getByRole('button', { name: /Ver datos de contacto/ }).click()
  await expect(pageA.getByRole('link', { name: B.email })).toBeVisible()
})

test('8. B confirma la devolución y ambas publicaciones quedan resueltas', async () => {
  await pageB.goto('/solicitudes?tab=recibidas')
  await pageB.getByRole('button', { name: /Confirmar devolución/ }).click()
  await expect(pageB.getByText('Completada').first()).toBeVisible()

  await pageB.goto(`/objetos/${foundId}`)
  await expect(pageB.getByText('Resuelto').first()).toBeVisible()
  await expect(pageB.getByRole('button', { name: 'Editar' })).toHaveCount(0) // ya no se puede editar

  // El reporte de A estaba vinculado → también queda resuelto
  await pageA.goto(`/objetos/${lostId}`)
  await expect(pageA.getByText('Resuelto').first()).toBeVisible()
})

test('9. A recibe la confirmación y el objeto deja de aparecer en el catálogo', async () => {
  await pageA.goto('/notificaciones')
  await expect(pageA.getByText('¡Objeto recuperado!')).toBeVisible()

  await pageA.goto(`/explorar?q=${RUN}`)
  await expect(pageA.getByText('No encontramos objetos')).toBeVisible()

  await pageA.goto('/mis-publicaciones')
  await pageA.getByRole('button', { name: /Resueltas/ }).click()
  await expect(pageA.getByText(LOST_TITLE)).toBeVisible()
})
