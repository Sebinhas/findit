import { expect, test } from '@playwright/test'
import { DEMO, login } from './helpers'

test.describe('Autenticación y protección de rutas', () => {
  test('la landing pública carga', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Lo que pierdes/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Crear cuenta' })).toBeVisible()
  })

  test('una ruta privada sin sesión redirige a /login', async ({ page }) => {
    await page.goto('/inicio')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('login con contraseña incorrecta muestra error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/^Correo electrónico/).fill(DEMO.laura)
    await page.getByLabel(/^Contraseña/).fill('no-es-la-clave')
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page.getByText('Correo o contraseña incorrectos')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('el registro valida que las contraseñas coincidan', async ({ page }) => {
    await page.goto('/registro')
    await page.getByLabel(/^Nombre/).fill('Test')
    await page.getByLabel(/^Apellido/).fill('Usuario')
    await page.getByLabel(/^Correo electrónico/).fill('no-se-crea@example.com')
    await page.getByLabel(/^Contraseña/).fill('Password-123')
    await page.getByLabel(/^Confirmar contraseña/).fill('Password-999')
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible()
  })

  test('login correcto, cerrar sesión y volver a quedar protegido', async ({ page }) => {
    await login(page, DEMO.laura)
    await expect(page.getByRole('heading', { name: /Hola, Laura/ })).toBeVisible()
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/mis-publicaciones')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('un usuario normal no puede entrar al panel admin', async ({ page }) => {
    await login(page, DEMO.laura)
    await expect(page.getByRole('link', { name: 'Administración' })).toHaveCount(0)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/inicio$/)
  })
})
