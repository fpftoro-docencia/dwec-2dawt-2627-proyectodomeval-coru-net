/**
 * @fileoverview Controlador para la página privada de ficha de socio (ficha.html).
 * @module paginas/ficha
 */

import { protegerPaginaPrivada } from '../datos/sesion.js';
import { inicializarCabecera } from '../componentes/cabecera.js';
import { iniciarOyenteAvisos, comprobarAvisoPendiente } from '../componentes/avisos.js';

/**
 * Inicializa la página de ficha.
 * @param {Location} [navegacion=window.location]
 */
export function inicializarPaginaFicha(navegacion = window.location) {
  // Proteger la página privada (Requisito 7)
  const sesion = protegerPaginaPrivada(navegacion);
  if (!sesion) {
    return;
  }

  inicializarCabecera('ficha.html', undefined, navegacion);
  iniciarOyenteAvisos();
  comprobarAvisoPendiente();
}

if (
  typeof window !== 'undefined' &&
  document.querySelector('title')?.textContent.includes('Ficha')
) {
  inicializarPaginaFicha();
}
