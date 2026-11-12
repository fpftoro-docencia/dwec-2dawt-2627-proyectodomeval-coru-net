/**
 * @fileoverview Funciones puras de validación y expresiones regulares (Requisito 5, 13 y 19).
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
 * Expresión regular para el formato de DNI español: 8 dígitos seguidos de una letra.
 */
export const REGEX_DNI = /^\d{8}[A-Za-z]$/;

/**
 * Tabla oficial de letras de control del DNI español (módulo 23).
 */
export const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';

/**
 * Expresión regular para el código de licencia federativa (4 a 20 caracteres alfanuméricos o guiones).
 */
export const REGEX_LICENCIA = /^[A-Za-z0-9-]{4,20}$/;

/**
 * Evalúa los cuatro requisitos obligatorios de la contraseña (Requisito 5).
 * @param {string} clave
 * @returns {{ longitud: boolean, minuscula: boolean, mayuscula: boolean, cifra: boolean, esValida: boolean }}
 * @example
 * evaluarRequisitosClave('Pedal2026'); // { longitud: true, minuscula: true, mayuscula: true, cifra: true, esValida: true }
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

/**
 * Valida el nombre completo de un socio ciclista.
 * @param {string} nombre
 * @returns {{ valido: boolean, motivo?: string }}
 */
export function validarNombreSocio(nombre) {
  const limpio = String(nombre || '').trim();
  if (!limpio) {
    return { valido: false, motivo: 'El nombre completo del socio es obligatorio.' };
  }
  if (limpio.length < 3) {
    return { valido: false, motivo: 'El nombre debe tener al menos 3 caracteres.' };
  }
  if (limpio.length > 80) {
    return { valido: false, motivo: 'El nombre no puede superar los 80 caracteres.' };
  }
  return { valido: true };
}

/**
 * Valida un DNI español comprobando formato Regex, letra de control (módulo 23) y duplicados.
 * @param {string} dni
 * @param {(dniNormalizado: string) => boolean} [comprobarDuplicado]
 * @returns {{ valido: boolean, motivo?: string }}
 * @example
 * validarDni('12345678Z'); // { valido: true }
 */
export function validarDni(dni, comprobarDuplicado = () => false) {
  const limpio = String(dni || '')
    .trim()
    .toUpperCase();
  if (!limpio) {
    return { valido: false, motivo: 'El DNI es obligatorio.' };
  }
  if (!REGEX_DNI.test(limpio)) {
    return {
      valido: false,
      motivo: 'El DNI debe constar de 8 cifras seguidas de una letra (ej. 12345678Z).',
    };
  }

  const numero = Number.parseInt(limpio.slice(0, 8), 10);
  const letraIntroducida = limpio.slice(8);
  const letraEsperada = LETRAS_DNI[numero % 23];

  if (letraIntroducida !== letraEsperada) {
    return {
      valido: false,
      motivo: `La letra del DNI no es correcta (para ${limpio.slice(0, 8)} corresponde la «${letraEsperada}»).`,
    };
  }

  if (comprobarDuplicado(limpio)) {
    return {
      valido: false,
      motivo: `Ya existe un socio registrado con el DNI «${limpio}».`,
    };
  }

  return { valido: true };
}

/**
 * Valida la fecha de nacimiento de un socio ciclista (formato YYYY-MM-DD y fecha pasada coherente).
 * @param {string} fechaIso
 * @returns {{ valido: boolean, motivo?: string }}
 */
export function validarFechaNacimiento(fechaIso) {
  const limpio = String(fechaIso || '').trim();
  if (!limpio) {
    return { valido: false, motivo: 'La fecha de nacimiento es obligatoria.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(limpio)) {
    return { valido: false, motivo: 'El formato de la fecha debe ser AAAA-MM-DD.' };
  }

  const [anioStr, mesStr, diaStr] = limpio.split('-');
  const anio = Number.parseInt(anioStr, 10);
  const mes = Number.parseInt(mesStr, 10);
  const dia = Number.parseInt(diaStr, 10);

  const fechaObj = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    fechaObj.getUTCFullYear() !== anio ||
    fechaObj.getUTCMonth() + 1 !== mes ||
    fechaObj.getUTCDate() !== dia
  ) {
    return { valido: false, motivo: 'La fecha introducida no existe en el calendario.' };
  }

  if (anio < 1920) {
    return { valido: false, motivo: 'El año de nacimiento debe ser igual o posterior a 1920.' };
  }

  const hoy = new Date();
  const hoyUtc = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
  if (fechaObj > hoyUtc) {
    return { valido: false, motivo: 'La fecha de nacimiento no puede ser futura.' };
  }

  return { valido: true };
}

/**
 * Valida la cuota mensual del socio ciclista (entre 10 y 500 €).
 * @param {number | string} cuota
 * @returns {{ valido: boolean, motivo?: string }}
 */
export function validarCuotaMensual(cuota) {
  const texto = String(cuota ?? '').trim();
  if (texto === '') {
    return { valido: false, motivo: 'La cuota mensual es obligatoria.' };
  }
  const valor = Number(texto);
  if (!Number.isFinite(valor)) {
    return { valido: false, motivo: 'La cuota mensual debe ser un número válido.' };
  }
  if (valor < 10 || valor > 500) {
    return { valido: false, motivo: 'La cuota mensual debe situarse entre 10 € y 500 €.' };
  }
  return { valido: true };
}

/**
 * Valida el código de licencia federativa cuando la casilla ¿Federado? está activa.
 * @param {string} licencia
 * @param {boolean} esFederado
 * @returns {{ valido: boolean, motivo?: string }}
 */
export function validarLicenciaFederativa(licencia, esFederado) {
  if (!esFederado) {
    return { valido: true };
  }
  const limpio = String(licencia || '').trim();
  if (!limpio) {
    return {
      valido: false,
      motivo: 'El número de licencia es obligatorio para socios federados.',
    };
  }
  if (!REGEX_LICENCIA.test(limpio)) {
    return {
      valido: false,
      motivo: 'La licencia debe tener entre 4 y 20 caracteres alfanuméricos o guiones.',
    };
  }
  return { valido: true };
}

/**
 * Valida la marca o el modelo de una bicicleta dentro del grupo dinámico.
 * @param {string} valor
 * @param {'marca' | 'modelo'} tipoCampo
 * @returns {{ valido: boolean, motivo?: string }}
 */
export function validarCampoBicicleta(valor, tipoCampo = 'marca') {
  const limpio = String(valor || '').trim();
  const etiqueta = tipoCampo === 'modelo' ? 'El modelo' : 'La marca';
  if (!limpio) {
    return { valido: false, motivo: `${etiqueta} de la bicicleta es obligatorio.` };
  }
  if (limpio.length < 2) {
    return { valido: false, motivo: `${etiqueta} debe tener al menos 2 caracteres.` };
  }
  return { valido: true };
}
