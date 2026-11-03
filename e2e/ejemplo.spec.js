// Ejemplo de prueba de extremo a extremo con Playwright (UD5, tema 9 y UD6, tema 7).
// Sustitúyelo por tus dos recorridos (requisito 21): la sesión y el CRUD, buscando los elementos como
// un usuario y con direcciones relativas (`page.goto('/registro.html')`), para que funcionen igual con
// `serve` que contra la web desplegada (`BASE_URL`).
import { test, expect } from '@playwright/test';

// Cada prueba empieza con el almacenamiento vacío: un contexto nuevo del navegador.
test('un formulario se rellena y se envía como lo haría una persona', async ({ page }) => {
  // Con tus páginas, aquí irá `await page.goto('/ficha.html')`. Para el ejemplo, un trozo de HTML:
  await page.setContent(`
    <h1>Ejemplo</h1>
    <form>
      <label>Nombre <input name="nombre"></label>
      <button>Saludar</button>
    </form>
    <p></p>`);
  await page.evaluate(() => {
    const formulario = document.querySelector('form');
    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      document.querySelector('p').textContent = `Hola, ${formulario.nombre.value}`;
    });
  });

  await page.getByLabel('Nombre').fill('Ana');
  await page.getByRole('button', { name: 'Saludar' }).click();

  await expect(page.getByText('Hola, Ana')).toBeVisible();
});
