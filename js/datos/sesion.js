/**
 * @fileoverview Gestión de sesión activa en sessionStorage y control de acceso (Guards).
 * @module datos/sesion
 */

import { leerJSON, guardarJSON, borrarItem } from './almacen.js';

export const CLAVE_SESION = 'club_sesion_activa';

/**
 * @typedef {Object} Sesion
 * @property {string} usuario Nombre del usuario conectado.
 * @property {'administrador' | 'usuario'} rol Rol activo.
 * @property {string} horaInicio Timestamp ISO del inicio de sesión.
 */

/**
 * Obtiene la sesión activa en el navegador.
 * @param {Storage | { getItem: (k: string) => string | null }} [almacen=sessionStorage]
 * @returns {Sesion | null}
 */
export function obtenerSesion(almacen = sessionStorage) {
  return leerJSON(almacen, CLAVE_SESION, null);
}

/**
 * Guarda los datos de inicio de sesión.
 * @param {Object} usuario
 * @param {string} usuario.usuario
 * @param {'administrador' | 'usuario'} usuario.rol
 * @param {Storage | { setItem: (k: string, v: string) => void }} [almacen=sessionStorage]
 * @returns {Sesion}
 */
export function iniciarSesion({ usuario, rol }, almacen = sessionStorage) {
  /** @type {Sesion} */
  const sesion = {
    usuario,
    rol,
    horaInicio: new Date().toISOString(),
  };
  guardarJSON(almacen, CLAVE_SESION, sesion);
  return sesion;
}

/**
 * Cierra la sesión activa borrándola del almacén.
 * @param {Storage | { removeItem: (k: string) => void }} [almacen=sessionStorage]
 */
export function cerrarSesion(almacen = sessionStorage) {
  borrarItem(almacen, CLAVE_SESION);
}

/**
 * Comprueba si hay una sesión activa con rol administrador.
 * @param {Storage | { getItem: (k: string) => string | null }} [almacen=sessionStorage]
 * @returns {boolean}
 */
export function esAdministrador(almacen = sessionStorage) {
  const sesion = obtenerSesion(almacen);
  return Boolean(sesion && sesion.rol === 'administrador');
}

/**
 * Guard para páginas privadas (listado.html, ficha.html, usuarios.html).
 * Si no hay sesión, redirige inmediatamente a index.html usando location.replace (Requisito 7).
 * @param {Location} [navegacion=window.location]
 * @param {Storage} [almacen=sessionStorage]
 * @returns {Sesion | null} La sesión activa si existe.
 */
export function protegerPaginaPrivada(navegacion = window.location, almacen = sessionStorage) {
  const sesion = obtenerSesion(almacen);
  if (!sesion) {
    navegacion.replace('index.html');
    return null;
  }
  return sesion;
}

/**
 * Guard para la página de administración (usuarios.html).
 * Si no es administrador, redirige a listado.html (Requisito 7).
 * @param {Location} [navegacion=window.location]
 * @param {Storage} [almacen=sessionStorage]
 * @param {(msg: string, tipo: string) => void} [notificar]
 * @returns {Sesion | null}
 */
export function protegerPaginaAdmin(
  navegacion = window.location,
  almacen = sessionStorage,
  notificar = null,
) {
  const sesion = protegerPaginaPrivada(navegacion, almacen);
  if (!sesion) {
    return null;
  }
  if (sesion.rol !== 'administrador') {
    if (notificar) {
      notificar('Acceso restringido: necesitas rol de administrador.', 'danger');
    }
    navegacion.replace('listado.html');
    return null;
  }
  return sesion;
}
