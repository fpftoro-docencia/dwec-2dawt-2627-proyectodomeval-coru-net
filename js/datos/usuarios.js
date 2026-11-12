/**
 * @fileoverview Gestión de usuarios, credenciales y roles en localStorage.
 * Las contraseñas se almacenan únicamente como resumen SHA-256.
 * @module datos/usuarios
 */

import { resumirClave } from '../clave.js';
import { leerJSON, guardarJSON } from './almacen.js';
import { normalizarTextoBusqueda } from './socios.js';

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
 * @param {Storage|Object} [almacen=localStorage]
 * @returns {Usuario[]}
 */
export function obtenerUsuarios(almacen = localStorage) {
  const lista = leerJSON(almacen, CLAVE_USUARIOS, []);
  return Array.isArray(lista) ? lista : [];
}

/**
 * Comprueba si un nombre de usuario ya está registrado (no sensible a mayúsculas).
 * @param {string} nombreUsuario
 * @param {Storage|Object} [almacen=localStorage]
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
 * @param {Storage|Object} [almacen=localStorage]
 * @param {Function} [funcionHash=resumirClave]
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
 * @param {Storage|Object} [almacen=localStorage]
 * @param {Function} [funcionHash=resumirClave]
 * @returns {Promise<Usuario|null>} El usuario si las credenciales coinciden, o null si fallan.
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

/**
 * Cambia el rol de un usuario registrado ('administrador' <-> 'usuario').
 * Impide que el administrador activo se quite su propio rol (Requisito 20).
 * @param {string} nombreUsuario Usuario objetivo cuyo rol se desea modificar.
 * @param {string} nuevoRol Nuevo rol a asignar ('administrador' o 'usuario').
 * @param {string} [usuarioSolicitante=''] Nombre del administrador con sesión activa.
 * @param {Storage|Object} [almacen=localStorage]
 * @returns {Usuario} El usuario actualizado.
 */
export function cambiarRolUsuario(
  nombreUsuario,
  nuevoRol,
  usuarioSolicitante = '',
  almacen = localStorage,
) {
  if (nuevoRol !== 'administrador' && nuevoRol !== 'usuario') {
    throw new Error('El rol indicado no es válido.');
  }

  const objetivoLimpio = String(nombreUsuario || '')
    .trim()
    .toLowerCase();
  const solicitanteLimpio = String(usuarioSolicitante || '')
    .trim()
    .toLowerCase();

  if (solicitanteLimpio && objetivoLimpio === solicitanteLimpio && nuevoRol !== 'administrador') {
    throw new Error('El administrador activo no puede quitarse su propio rol de administrador.');
  }

  const usuarios = obtenerUsuarios(almacen);
  const indice = usuarios.findIndex((u) => u.usuario.toLowerCase() === objetivoLimpio);

  if (indice === -1) {
    throw new Error(`No existe ningún usuario registrado con el nombre «${nombreUsuario}».`);
  }

  const actualizado = {
    ...usuarios[indice],
    rol: nuevoRol,
  };

  usuarios[indice] = actualizado;
  guardarJSON(almacen, CLAVE_USUARIOS, usuarios);

  return actualizado;
}

/**
 * Filtra la lista de usuarios por nombre de usuario, correo o rol ignorando mayúsculas y tildes.
 * @param {Usuario[]} usuarios
 * @param {string} termino
 * @returns {Usuario[]}
 */
export function filtrarUsuarios(usuarios, termino) {
  if (!Array.isArray(usuarios)) {
    return [];
  }
  const busqueda = normalizarTextoBusqueda(termino);
  if (!busqueda) {
    return [...usuarios];
  }
  return usuarios.filter((u) =>
    [u.usuario, u.correo, u.rol].some((campo) => normalizarTextoBusqueda(campo).includes(busqueda)),
  );
}
