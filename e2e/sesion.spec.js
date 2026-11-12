import { test, expect } from '@playwright/test';

test.describe('Recorrido E2E 1: Flujo completo de Sesión (Registro Admin, Cierre de sesión y Login)', () => {
  test('protege rutas privadas, registra al primer usuario como administrador, cierra sesión y vuelve a entrar', async ({
    page,
  }) => {
    // 1. Intentar entrar a listado.html sin sesión redirige a index.html
    await page.goto('/listado.html');
    await expect(page).toHaveURL(/index\.html/);

    // 2. Ir al formulario de registro y dar de alta al primer socio (será administrador)
    await page.goto('/registro.html');
    await page.getByLabel('Nombre de usuario').fill('admin_e2e');
    await page.getByLabel('Correo electrónico').fill('admin@pedalcadencia.es');
    await page.getByLabel('Contraseña', { exact: true }).fill('Pedal2026');
    await page.getByLabel('Repetir contraseña').fill('Pedal2026');
    await page.getByLabel(/Acepto el reglamento interno/i).check();

    await page.getByRole('button', { name: /Completar Inscripción/i }).click();

    // 3. Verifica redirección a listado.html, aviso de bienvenida de administrador y enlace Usuarios
    await expect(page).toHaveURL(/listado\.html/);
    await expect(page.getByRole('status')).toContainText('admin_e2e');
    await expect(page.getByRole('link', { name: 'Usuarios' })).toBeVisible();

    // 4. Cerrar sesión y comprobar que vuelve a index.html y protege listado.html
    await page.getByRole('button', { name: /Cerrar sesión/i }).click();
    await expect(page).toHaveURL(/index\.html/);

    await page.goto('/listado.html');
    await expect(page).toHaveURL(/index\.html/);

    // 5. Iniciar sesión de nuevo con las credenciales creadas
    await page.getByLabel('Nombre de usuario').fill('admin_e2e');
    await page.getByLabel('Contraseña', { exact: true }).fill('Pedal2026');
    await page.getByRole('button', { name: /Entrar al Club/i }).click();

    await expect(page).toHaveURL(/listado\.html/);
    await expect(page.getByRole('heading', { name: /Listado de Socios Ciclistas/i })).toBeVisible();
  });
});
