/**
 * @fileoverview Funciones auxiliares para el acceso seguro al almacenamiento web.
 * Permite inyección de dependencias para tests unitarios (AlmacenFalso).
 * @module datos/almacen
 */

/**
 * Lee y parsea un valor JSON del almacén. Si no existe o está corrupto, devuelve el valor por defecto.
 * @template T
 * @param {Storage | { getItem: (k: string) => string | null }} almacen Almacén (localStorage, sessionStorage o AlmacenFalso).
 * @param {string} clave Clave a recuperar.
 * @param {T} valorPorDefecto Valor a devolver si no existe o hay error de parsing.
 * @returns {T}
 */
export function leerJSON(almacen, clave, valorPorDefecto) {
  try {
    const serializado = almacen.getItem(clave);
    if (serializado === null || serializado === undefined) {
      return valorPorDefecto;
    }
    return JSON.parse(serializado);
  } catch {
    // Si los datos están estropeados (Requisito 3 y 14), devuelve el valor por defecto
    return valorPorDefecto;
  }
}

/**
 * Serializa y guarda un valor en el almacén.
 * @param {Storage | { setItem: (k: string, v: string) => void }} almacen
 * @param {string} clave
 * @param {unknown} valor
 */
export function guardarJSON(almacen, clave, valor) {
  almacen.setItem(clave, JSON.stringify(valor));
}

/**
 * Elimina una clave del almacén.
 * @param {Storage | { removeItem: (k: string) => void }} almacen
 * @param {string} clave
 */
export function borrarItem(almacen, clave) {
  almacen.removeItem(clave);
}
