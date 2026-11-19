/**
 * @fileoverview Funciones auxiliares para el acceso seguro al almacenamiento web.
 * Permite inyección de dependencias para tests unitarios (AlmacenFalso).
 * @module datos/almacen
 */

/**
 * Lee y parsea un valor JSON del almacén. Si no existe o está corrupto, devuelve el valor por defecto.
 * @param {Storage|Object} almacen Almacén (localStorage, sessionStorage o AlmacenFalso).
 * @param {string} clave Clave a recuperar.
 * @param {*} valorPorDefecto Valor a devolver si no existe o hay error de parsing.
 * @returns {*} El valor deserializado o el valor por defecto.
 * @example
 * leerJSON(localStorage, 'club_usuarios', []);
 */
export function leerJSON(almacen, clave, valorPorDefecto) {
  try {
    const serializado = almacen.getItem(clave);
    if (serializado === null || serializado === undefined) {
      return valorPorDefecto;
    }
    return JSON.parse(serializado);
  } catch {
    return valorPorDefecto;
  }
}

/**
 * Serializa y guarda un valor en el almacén.
 * @param {Storage|Object} almacen Almacén donde persistir el valor.
 * @param {string} clave Clave de almacenamiento.
 * @param {*} valor Valor a serializar en JSON.
 */
export function guardarJSON(almacen, clave, valor) {
  almacen.setItem(clave, JSON.stringify(valor));
}

/**
 * Elimina una clave del almacén.
 * @param {Storage|Object} almacen Almacén del que eliminar la clave.
 * @param {string} clave Clave a borrar.
 */
export function borrarItem(almacen, clave) {
  almacen.removeItem(clave);
}
