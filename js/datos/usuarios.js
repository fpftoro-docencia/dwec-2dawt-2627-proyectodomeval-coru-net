/**
 * @fileoverview Gestión de usuarios y credenciales en localStorage.
 * Las contraseñas se almacenan únicamente como resumen SHA-256.
 * @module datos/usuarios
 */

import { resumirClave } from '../clave.js';
import { leerJSON, guardarJSON } from './almacen.js';

export const CLAVE_USUARIOS = 'club_usuarios';

/**
 * @typedef {Object} Usuario
 * @property {string} usuario Nombre de usuario único.
 * @property {string} correo Correo electrónico.
 * @property {string} claveHash Resumen SHA-256 de la contraseña.
 * @property {'administrador' | 'usuario'} rol Rol asignado.
 * @property {string} fechaRegistro Fecha ISO de creación.
 */

/**
 * Obtiene la lista completa de usuarios registrados.
 * @param {Storage | { getItem: (k: string) => string | null }} [almacen=localStorage]
 * @returns {Usuario[]}
 */
export function obtenerUsuarios(almacen = localStorage) {
  const lista = leerJSON(almacen, CLAVE_USUARIOS, []);
  return Array.isArray(lista) ? lista : [];
}

/**
 * Comprueba si un nombre de usuario ya está registrado (no sensible a mayúsculas).
 * @param {string} nombreUsuario
 * @param {Storage | { getItem: (k: string) => string | null }} [almacen=localStorage]
 * @returns {boolean}
 */
export function existeUsuario(nombreUsuario, almacen = localStorage) {
  const usuarios = obtenerUsuarios(almacen);
  const busqueda = nombreUsuario.trim().toLowerCase();
  return usuarios.some((u) => u.usuario.toLowerCase() === busqueda);
}

/**
 * Registra un nuevo socio en el sistema.
 * El primer usuario en registrarse recibe el rol de 'administrador' (Requisito 4).
 * @param {Object} datos
 * @param {string} datos.usuario
 * @param {string} datos.correo
 * @param {string} datos.clave
 * @param {Storage | { getItem: (k: string) => string | null, setItem: (k: string, v: string) => void }} [almacen=localStorage]
 * @param {typeof resumirClave} [funcionHash=resumirClave]
 * @returns {Promise<Usuario>} El usuario creado.
 */
export async function registrarUsuario(
  { usuario, correo, clave },
  almacen = localStorage,
  funcionHash = resumirClave,
) {
  const usuarios = obtenerUsuarios(almacen);
  const usuarioLimpio = usuario.trim();

  if (existeUsuario(usuarioLimpio, almacen)) {
    throw new Error(`El nombre de usuario «${usuarioLimpio}» ya está registrado.`);
  }

  // Primer usuario registrado es administrador (Requisito 4)
  const rol = usuarios.length === 0 ? 'administrador' : 'usuario';
  const claveHash = await funcionHash(clave);

  /** @type {Usuario} */
  const nuevoUsuario = {
    usuario: usuarioLimpio,
    correo: correo.trim().toLowerCase(),
    claveHash,
    rol,
    fechaRegistro: new Date().toISOString(),
  };

  usuarios.push(nuevoUsuario);
  guardarJSON(almacen, CLAVE_USUARIOS, usuarios);

  return nuevoUsuario;
}

/**
 * Comprueba las credenciales de acceso de un usuario.
 * @param {string} identificador Nombre de usuario o correo.
 * @param {string} clave Contraseña en texto plano a verificar.
 * @param {Storage | { getItem: (k: string) => string | null }} [almacen=localStorage]
 * @param {typeof resumirClave} [funcionHash=resumirClave]
 * @returns {Promise<Usuario | null>} El usuario si las credenciales coinciden, o null si fallan.
 */
export async function autenticarUsuario(
  identificador,
  clave,
  almacen = localStorage,
  funcionHash = resumirClave,
) {
  const usuarios = obtenerUsuarios(almacen);
  const idLimpio = identificador.trim().toLowerCase();

  const usuarioEncontrado = usuarios.find(
    (u) => u.usuario.toLowerCase() === idLimpio || u.correo.toLowerCase() === idLimpio,
  );

  if (!usuarioEncontrado) {
    return null;
  }

  const hashCalculado = await funcionHash(clave);
  if (hashCalculado === usuarioEncontrado.claveHash) {
    return usuarioEncontrado;
  }

  return null;
}
