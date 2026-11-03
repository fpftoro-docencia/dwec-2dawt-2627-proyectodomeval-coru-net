/** Almacenamiento en memoria con la misma interfaz que localStorage, para los tests (UD4, tema 8). */
export class AlmacenFalso {
  #datos = new Map();

  getItem(clave) {
    return this.#datos.has(clave) ? this.#datos.get(clave) : null;
  }

  setItem(clave, valor) {
    this.#datos.set(clave, String(valor)); // como el real: todo se guarda como texto
  }

  removeItem(clave) {
    this.#datos.delete(clave);
  }

  clear() {
    this.#datos.clear();
  }

  get length() {
    return this.#datos.size;
  }
}
