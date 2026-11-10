/**
 * @fileoverview Controlador para la zona de administración (usuarios.html).
 * Incluye protección estricta por rol (Requisito 7).
 * @module paginas/usuarios
 */

import { protegerPaginaAdmin } from '../datos/sesion.js';
import { inicializarCabecera } from '../componentes/cabecera.js';
import {
  iniciarOyenteAvisos,
  guardarAvisoPendiente,
  comprobarAvisoPendiente,
} from '../componentes/avisos.js';

/**
 * Inicializa la página de administración de usuarios.
 * @param {Location} [navegacion=window.location]
 */
export function inicializarPaginaUsuarios(navegacion = window.location) {
  // Proteger por rol: si no es admin, redirige al listado con aviso de error (Requisito 7)
  const sesion = protegerPaginaAdmin(navegacion, undefined, (mensaje, tipo) => {
    guardarAvisoPendiente(mensaje, tipo);
  });

  if (!sesion) {
    return;
  }

  inicializarCabecera('usuarios.html', undefined, navegacion);
  iniciarOyenteAvisos();
  comprobarAvisoPendiente();
}

if (
  typeof window !== 'undefined' &&
  document.querySelector('title')?.textContent.includes('Usuarios')
) {
  inicializarPaginaUsuarios();
}
