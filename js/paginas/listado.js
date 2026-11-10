/**
 * @fileoverview Controlador para la página privada de listado (listado.html).
 * @module paginas/listado
 */

import { protegerPaginaPrivada } from '../datos/sesion.js';
import { inicializarCabecera } from '../componentes/cabecera.js';
import { iniciarOyenteAvisos, comprobarAvisoPendiente } from '../componentes/avisos.js';

/**
 * Inicializa la página del listado.
 * @param {Location} [navegacion=window.location]
 */
export function inicializarPaginaListado(navegacion = window.location) {
  // Proteger la página: sin sesión redirige con location.replace('index.html') (Requisito 7)
  const sesion = protegerPaginaPrivada(navegacion);
  if (!sesion) {
    return;
  }

  inicializarCabecera('listado.html', undefined, navegacion);
  iniciarOyenteAvisos();
  comprobarAvisoPendiente();
}

if (
  typeof window !== 'undefined' &&
  document.querySelector('title')?.textContent.includes('Listado')
) {
  inicializarPaginaListado();
}
