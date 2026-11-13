import { expect, test } from '@playwright/test'
import { DEMO, RUN, apiLogin, createItem, e2eUser, login, register } from './helpers'

test.describe.configure({ mode: 'serial' })

test.describe('Panel administrativo', () => {
  test('estadísticas, usuarios y reportes', async ({ page }) => {
    await login(page, DEMO.admin)
    await page.getByRole('link', { name: 'Administración' }).click()
    await expect(page.getByText('Porcentaje de recuperación')).toBeVisible()
    await expect(page.getByText('Usuarios registrados')).toBeVisible()

    await page.getByRole('button', { name: 'Usuarios' }).click()
    await expect(page.getByRole('cell', { name: DEMO.laura })).toBeVisible()

    await page.getByRole('button', { name: 'Reportes' }).click()
    await expect(page.getByRole('link', { name: 'Termo metálico verde' })).toBeVisible()

    await page.getByRole('button', { name: 'Solicitudes' }).click()
    await expect(page.getByRole('link', { name: 'Audífonos JBL negros en estuche' })).toBeVisible()
  })

  test('el admin oculta una publicación: desaparece del catálogo y el dueño es notificado', async ({ browser }) => {
    const owner = e2eUser('C')
    const title = `Botella reutilizable ${RUN}`

    const ownerCtx = await browser.newContext()
    const ownerPage = await ownerCtx.newPage()
    await register(ownerPage, owner)
    const itemId = await createItem(ownerPage, { type: 'FOUND', title, description: 'Botella reutilizable azul encontrada en un pasillo.' })

    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    adminPage.on('dialog', (d) => d.accept('Contenido de prueba E2E'))
    await login(adminPage, DEMO.admin)
    await adminPage.goto('/admin')
    await adminPage.getByRole('button', { name: 'Publicaciones' }).click()
    await adminPage.getByPlaceholder('Buscar por título...').fill(RUN)
    const row = adminPage.getByRole('row', { name: new RegExp(title) })
    await row.getByRole('button', { name: /Ocultar/ }).click()
    await expect(row.getByText('Oculto')).toBeVisible()

    // Otro usuario ya no la ve (ni por la API)
    const { client } = await apiLogin(DEMO.laura)
    const { data } = await client.from('items').select('id').eq('id', itemId)
    expect(data).toEqual([])

    // El dueño la sigue viendo, marcada como oculta, y recibe la notificación
    await ownerPage.goto(`/objetos/${itemId}`)
    await expect(ownerPage.getByText(/ocultada por moderación: Contenido de prueba E2E/)).toBeVisible()
    await ownerPage.goto('/notificaciones')
    await expect(ownerPage.getByText('Publicación ocultada')).toBeVisible()

    await ownerCtx.close()
    await adminCtx.close()
  })
})
