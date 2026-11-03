/**
 * Resumen (hash) de las contraseñas (no se modifica).
 *
 * La aplicación no tiene servidor, así que el inicio de sesión es una **simulación**: en lugar de la
 * contraseña se guarda su resumen SHA-256, que no permite recuperarla. Aun así, cualquiera con
 * acceso al navegador puede leer o cambiar `localStorage`: no es seguro para datos reales.
 *
 * `crypto.subtle.digest` es **asíncrono**: devuelve una promesa. Las promesas y `async`/`await` se
 * ven en la UD7; hasta entonces, úsalo como fórmula: `const resumen = await resumirClave(clave);`
 * dentro de una función marcada con `async`.
 *
 * @module clave
 */

/**
 * Calcula el resumen SHA-256 de una contraseña, en hexadecimal.
 * @param {string} clave
 * @returns {Promise<string>} 64 caracteres hexadecimales.
 * @example
 * await resumirClave('abc'); // 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
 */
export async function resumirClave(clave) {
  const bytes = new TextEncoder().encode(clave);
  const resumen = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(resumen)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
