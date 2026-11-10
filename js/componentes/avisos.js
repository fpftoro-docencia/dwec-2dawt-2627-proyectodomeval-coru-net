/**
 * @fileoverview Sistema desacoplado de avisos mediante CustomEvent (Requisito 8).
 * @module componentes/avisos
 */

const CLAVE_AVISO_PENDIENTE = 'club_aviso_pendiente';

/**
 * Lanza un evento personalizado 'aviso' que burbujea hasta document.
 * @param {EventTarget} [elementoOrigen=document] Elemento desde el que se dispara el evento.
 * @param {string} mensaje Texto a mostrar en el aviso.
 * @param {'success' | 'danger' | 'warning' | 'info'} [tipo='info'] Tipo de alerta de Bootstrap.
 */
export function lanzarAviso(elementoOrigen = document, mensaje, tipo = 'info') {
  const evento = new CustomEvent('aviso', {
    bubbles: true,
    detail: { mensaje, tipo },
  });
  elementoOrigen.dispatchEvent(evento);
}

/**
 * Registra el oyente único en document para capturar todos los eventos 'aviso' y mostrarlos.
 * @param {string} [idContenedor='contenedor-avisos'] ID del elemento con role="status".
 */
export function iniciarOyenteAvisos(idContenedor = 'contenedor-avisos') {
  document.addEventListener('aviso', (evento) => {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) {
      return;
    }

    const { mensaje, tipo } = /** @type {CustomEvent} */ (evento).detail;

    // Crear la alerta con las clases de Bootstrap
    contenedor.innerHTML = `
      <div class="alert alert-${tipo} alert-dismissible fade show d-flex align-items-center justify-content-between my-2" role="alert">
        <div>${mensaje}</div>
        <button type="button" class="btn-close" aria-label="Cerrar aviso"></button>
      </div>
    `;

    // Cerrar al pulsar el botón de cierre (sin JS de Bootstrap)
    const botonCerrar = contenedor.querySelector('.btn-close');
    if (botonCerrar) {
      botonCerrar.addEventListener('click', () => {
        contenedor.innerHTML = '';
      });
    }
  });
}

/**
 * Guarda un aviso en sessionStorage para mostrarlo en la página siguiente (Requisito 8).
 * @param {string} mensaje
 * @param {'success' | 'danger' | 'warning' | 'info'} [tipo='success']
 * @param {Storage} [almacen=sessionStorage]
 */
export function guardarAvisoPendiente(mensaje, tipo = 'success', almacen = sessionStorage) {
  almacen.setItem(CLAVE_AVISO_PENDIENTE, JSON.stringify({ mensaje, tipo }));
}

/**
 * Comprueba si hay un aviso pendiente de una página anterior y lo lanza si existe.
 * @param {EventTarget} [elementoOrigen=document]
 * @param {Storage} [almacen=sessionStorage]
 */
export function comprobarAvisoPendiente(elementoOrigen = document, almacen = sessionStorage) {
  const guardado = almacen.getItem(CLAVE_AVISO_PENDIENTE);
  if (guardado) {
    try {
      const { mensaje, tipo } = JSON.parse(guardado);
      lanzarAviso(elementoOrigen, mensaje, tipo);
    } catch {
      // Ignorar si está corrupto
    } finally {
      almacen.removeItem(CLAVE_AVISO_PENDIENTE);
    }
  }
}
