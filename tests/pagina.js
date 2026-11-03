// Prepara el documento de prueba con el contenido de una página de la aplicación.
import { readFileSync } from 'node:fs';

/**
 * Copia en el documento de happy-dom el título y el `<body>` de una página (sin ejecutar sus
 * scripts: los tests inician la página llamando a su módulo con dobles de prueba).
 * @param {string} fichero Ruta desde la raíz del proyecto, por ejemplo `'listado.html'`.
 * @returns {Document}
 */
export function cargarPagina(fichero) {
  // Vitest ejecuta los tests desde la raíz del proyecto (en happy-dom, import.meta.url no es un fichero)
  const html = readFileSync(fichero, 'utf8');
  document.title = html.match(/<title>(.*)<\/title>/)[1];
  document.body.innerHTML = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
  return document;
}

/**
 * Escribe en un campo como el usuario: cambia el valor y lanza `input`, que sube hasta el formulario.
 * @param {HTMLInputElement | HTMLSelectElement} campo
 * @param {string} valor
 */
export function escribir(campo, valor) {
  campo.value = valor;
  campo.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Sale de un campo: lanza `blur`, que **no** sube (lo recibe el formulario en la fase de captura).
 * @param {HTMLElement} campo
 */
export function salir(campo) {
  campo.dispatchEvent(new FocusEvent('blur'));
}
