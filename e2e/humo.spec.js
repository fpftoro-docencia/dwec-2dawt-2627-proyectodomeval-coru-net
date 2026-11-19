import { test, expect } from '@playwright/test';

test.describe('Prueba de humo de la aplicación pública (Sprint 3)', () => {
  test('la página principal responde con estado 200 y carga el acceso al club', async ({
    page,
  }) => {
    const respuesta = await page.goto('/index.html');
    expect(respuesta?.ok()).toBe(true);

    await expect(page).toHaveTitle(/Pedal & Cadencia/i);
    await expect(page.locator('#formulario-login')).toBeVisible();
    await expect(page.locator('#campo-usuario')).toBeVisible();
    await expect(page.locator('#campo-clave')).toBeVisible();
    await expect(page.locator('#boton-entrar')).toBeEnabled();

    const enlaceRegistro = page.getByRole('link', { name: 'Regístrate como socio' });
    await expect(enlaceRegistro).toBeVisible();
    await enlaceRegistro.click();
    await expect(page).toHaveURL(/registro\.html/);
    await expect(page.locator('#formulario-registro')).toBeVisible();
  });
});
