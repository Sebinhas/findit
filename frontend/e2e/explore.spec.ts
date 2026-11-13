import { expect, test } from '@playwright/test'
import { DEMO, login } from './helpers'

test.describe('Catálogo y filtros (datos demo)', () => {
  test.beforeEach(async ({ page }) => { await login(page, DEMO.daniel) })

  test('buscar por palabra clave', async ({ page }) => {
    await page.goto('/explorar')
    await page.getByLabel('Palabra clave').fill('Casio')
    await expect(page).toHaveURL(/q=Casio/)
    await expect(page.getByRole('heading', { name: 'Reloj Casio plateado', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Calculadora Casio fx-991' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Morral gris Totto' })).toHaveCount(0)
  })

  test('filtrar por tipo encontrado/perdido', async ({ page }) => {
    await page.goto('/explorar?q=Casio')
    await page.getByRole('button', { name: 'Encontrados' }).click()
    await expect(page.getByRole('heading', { name: 'Reloj plateado Casio', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Reloj Casio plateado', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Perdidos' }).click()
    await expect(page.getByRole('heading', { name: 'Reloj Casio plateado', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Reloj plateado Casio', exact: true })).toHaveCount(0)
  })

  test('filtrar por categoría', async ({ page }) => {
    await page.goto('/explorar')
    await page.getByLabel('Categoría').selectOption({ label: 'Llaves' })
    await expect(page.getByRole('heading', { name: 'Llavero rojo con tres llaves' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Reloj plateado Casio' })).toHaveCount(0)
  })

  test('los objetos resueltos no aparecen en el catálogo', async ({ page }) => {
    await page.goto('/explorar?q=JBL')
    await expect(page.getByText('No encontramos objetos')).toBeVisible()
  })

  test('abrir el detalle desde una tarjeta', async ({ page }) => {
    await page.goto('/explorar?q=Stewart')
    await page.getByRole('heading', { name: 'Libro Cálculo de Stewart' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Libro Cálculo de Stewart' })).toBeVisible()
    await expect(page.getByText('Lo dejé en la coordinación de ciencias básicas')).toBeVisible()
  })
})
