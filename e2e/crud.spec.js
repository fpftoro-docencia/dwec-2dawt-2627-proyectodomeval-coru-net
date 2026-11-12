import { test, expect } from '@playwright/test';

test.describe('Recorrido E2E 2: Flujo completo del CRUD de Socios Ciclistas y Persistencia', () => {
  test('crea un socio con licencia condicional y bicicleta dinámica, persiste al recargar, lo edita y lo elimina con confirmación en dialog', async ({
    page,
  }) => {
    // 1. Registrar cuenta para acceder al área privada
    await page.goto('/registro.html');
    await page.getByLabel('Nombre de usuario').fill('ciclista_crud');
    await page.getByLabel('Correo electrónico').fill('crud@pedalcadencia.es');
    await page.getByLabel('Contraseña', { exact: true }).fill('Pedal2026');
    await page.getByLabel('Repetir contraseña').fill('Pedal2026');
    await page.getByLabel(/Acepto el reglamento interno/i).check();
    await page.getByRole('button', { name: /Completar Inscripción/i }).click();

    await expect(page).toHaveURL(/listado\.html/);

    // 2. Ir a Nueva Ficha y dar de alta un socio con licencia federativa y 1 bicicleta
    await page.getByRole('link', { name: /\+ Nuevo Socio/i }).click();
    await expect(page).toHaveURL(/ficha\.html/);

    await page.getByLabel('Nombre y apellidos').fill('Alejandro Valverde');
    await page.getByLabel(/DNI/i).fill('12345678Z');
    await page.getByLabel('Fecha de nacimiento').fill('1980-04-25');
    await page.getByLabel('Categoría').selectOption('Élite');
    await page.getByLabel(/Cuota mensual/i).fill('50');

    // Activar campo condicional de licencia federativa
    await page.getByLabel(/dispone de licencia federativa/i).check();
    await page.getByLabel(/Código de licencia federativa/i).fill('ESP-VAL-2026');

    // Añadir una bicicleta al grupo dinámico
    await page.getByRole('button', { name: /\+ Añadir bicicleta/i }).click();
    await page.getByLabel('Marca').fill('Specialized');
    await page.getByLabel('Modelo').fill('S-Works Tarmac SL8');

    await page.getByRole('button', { name: /Guardar Ficha de Socio/i }).click();

    // 3. Verificar que aparece en el listado y persiste tras recargar la página
    await expect(page).toHaveURL(/listado\.html/);
    await expect(page.getByText('Alejandro Valverde', { exact: true })).toBeVisible();
    await expect(page.getByText('ESP-VAL-2026', { exact: true })).toBeVisible();
    await expect(page.getByText(/Specialized S-Works Tarmac SL8/i)).toBeVisible();

    await page.reload();
    await expect(page.getByText('Alejandro Valverde', { exact: true })).toBeVisible();

    // 4. Editar la ficha del socio creado
    await page.getByRole('link', { name: /Editar ficha de Alejandro Valverde/i }).click();
    await expect(page).toHaveURL(/ficha\.html\?id=/);

    await page.getByLabel('Nombre y apellidos').fill('Alejandro Valverde Belmonte');
    await page.getByRole('button', { name: /Guardar Cambios/i }).click();

    await expect(page).toHaveURL(/listado\.html/);
    await expect(page.getByText('Alejandro Valverde Belmonte', { exact: true })).toBeVisible();

    // 5. Eliminar el socio confirmando en el diálogo modal <dialog>
    await page
      .getByRole('button', { name: /Borrar ficha de Alejandro Valverde Belmonte/i })
      .click();
    const dialogo = page.locator('#dialogo-confirmar-borrado');
    await expect(dialogo).toBeVisible();
    await expect(dialogo).toContainText('Alejandro Valverde Belmonte');

    await page.getByRole('button', { name: /Sí, eliminar socio/i }).click();

    await expect(page.getByText('No hay socios registrados todavía')).toBeVisible();
  });
});
