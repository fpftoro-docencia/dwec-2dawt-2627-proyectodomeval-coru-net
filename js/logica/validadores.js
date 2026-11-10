/**
 * @fileoverview Funciones puras de validación y expresiones regulares (Requisito 5 y 19).
 * Sin acceso directo al DOM ni al almacenamiento.
 * @module logica/validadores
 */

/**
 * Expresión regular para el nombre de usuario: letras, números o guion bajo, entre 3 y 20 caracteres.
 */
export const REGEX_USUARIO = /^[a-zA-Z0-9_]{3,20}$/;

/**
 * Expresión regular para formato básico de correo electrónico.
 */
export const REGEX_CORREO = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Expresión regular para mayúsculas Unicode (\p{Lu}).
 */
export const REGEX_MAYUSCULA = /\p{Lu}/u;

/**
 * Expresión regular para minúsculas Unicode (\p{Ll}).
 */
export const REGEX_MINUSCULA = /\p{Ll}/u;

/**
 * Expresión regular para cifras (\d).
 */
export const REGEX_CIFRA = /\d/;

/**
 * Evalúa los cuatro requisitos obligatorios de la contraseña (Requisito 5).
 * @param {string} clave
 * @returns {{ longitud: boolean, minuscula: boolean, mayuscula: boolean, cifra: boolean, esValida: boolean }}
 */
export function evaluarRequisitosClave(clave) {
  const longitud = typeof clave === 'string' && clave.length >= 8;
  const minuscula = REGEX_MINUSCULA.test(clave || '');
  const mayuscula = REGEX_MAYUSCULA.test(clave || '');
  const cifra = REGEX_CIFRA.test(clave || '');

  return {
    longitud,
    minuscula,
    mayuscula,
    cifra,
    esValida: longitud && minuscula && mayuscula && cifra,
  };
}

/**
 * Valida un nombre de usuario comprobando formato y disponibilidad.
 * @param {string} usuario
 * @param {(u: string) => boolean} [comprobarExiste] Función opcional para comprobar si ya existe.
 * @returns {{ valido: boolean, motivo?: string }}
 */
export function validarNombreUsuario(usuario, comprobarExiste = () => false) {
  if (!usuario || typeof usuario !== 'string' || usuario.trim() === '') {
    return { valido: false, motivo: 'El nombre de usuario es obligatorio.' };
  }
  const limpio = usuario.trim();
  if (limpio.length < 3) {
    return { valido: false, motivo: 'Debe tener al menos 3 caracteres.' };
  }
  if (limpio.length > 20) {
    return { valido: false, motivo: 'No puede superar los 20 caracteres.' };
  }
  if (!REGEX_USUARIO.test(limpio)) {
    return { valido: false, motivo: 'Solo se permiten letras, números y guiones bajos (_).' };
  }
  if (comprobarExiste(limpio)) {
    return { valido: false, motivo: `El nombre «${limpio}» ya está ocupado.` };
  }
  return { valido: true };
}

/**
 * Valida una dirección de correo electrónico.
 * @param {string} correo
 * @returns {{ valido: boolean, motivo?: string }}
 */
export function validarCorreo(correo) {
  if (!correo || typeof correo !== 'string' || correo.trim() === '') {
    return { valido: false, motivo: 'El correo electrónico es obligatorio.' };
  }
  const limpio = correo.trim();
  if (!REGEX_CORREO.test(limpio)) {
    return {
      valido: false,
      motivo: 'El formato del correo no es válido (ej. usuario@dominio.com).',
    };
  }
  return { valido: true };
}

/**
 * Valida la coincidencia entre la contraseña y su repetición.
 * @param {string} clave
 * @param {string} claveRepetida
 * @returns {{ valido: boolean, motivo?: string }}
 */
export function validarRepeticionClave(clave, claveRepetida) {
  if (!claveRepetida) {
    return { valido: false, motivo: 'Debes repetir la contraseña.' };
  }
  if (clave !== claveRepetida) {
    return { valido: false, motivo: 'Las contraseñas no coinciden.' };
  }
  return { valido: true };
}
