/**
 * @fileoverview Sistema desacoplado de avisos mediante CustomEvent (Requisito 8).
 * @module componentes/avisos
 */

const CLAVE_AVISO_PENDIENTE = 'club_aviso_pendiente';

/**
 * Normaliza el tipo de aviso a una clase de alerta Bootstrap válida.
 * @param {string} [tipo='info']
 * @returns {'success' | 'danger' | 'warning' | 'info'}
 */
function normalizarTipoAviso(tipo = 'info') {
  const mapa = {
    exito: 'success',
    success: 'success',
    error: 'danger',
    danger: 'danger',
    aviso: 'warning',
    warning: 'warning',
    info: 'info',
  };
  return mapa[tipo] || 'info';
}

/**
 * Lanza un evento personalizado 'aviso' que burbujea hasta document.
 * @param {EventTarget} [elementoOrigen=document] Elemento desde el que se dispara el evento.
 * @param {string} mensaje Texto a mostrar en el aviso.
 * @param {'success' | 'danger' | 'warning' | 'info' | 'exito' | 'error'} [tipo='info'] Tipo de alerta.
 * @fires CustomEvent#aviso
 */
export function lanzarAviso(elementoOrigen = document, mensaje = '', tipo = 'info') {
  const destino =
    elementoOrigen && typeof elementoOrigen.dispatchEvent === 'function'
      ? elementoOrigen
      : document;
  const evento = new CustomEvent('aviso', {
    bubbles: true,
    detail: { mensaje, tipo: normalizarTipoAviso(tipo) },
  });
  destino.dispatchEvent(evento);
}

export { lanzarAviso as emitirAviso };

/**
 * Registra el oyente único en document para capturar todos los eventos 'aviso' y mostrarlos
 * usando exclusivamente createElement y textContent (sin innerHTML).
 * @param {string} [idContenedor='contenedor-avisos'] ID del elemento con role="status".
 * @listens CustomEvent#aviso
 */
export function iniciarOyenteAvisos(idContenedor = 'contenedor-avisos') {
  if (document.body?.dataset.oyenteAvisosActivo === 'true') {
    return;
  }
  if (document.body) {
    document.body.dataset.oyenteAvisosActivo = 'true';
  }

  document.addEventListener('aviso', (evento) => {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) {
      return;
    }

    const detalle = /** @type {CustomEvent} */ (evento).detail || {};
    const mensaje = String(detalle.mensaje || '');
    const tipo = normalizarTipoAviso(detalle.tipo);

    contenedor.replaceChildren();

    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show d-flex align-items-center justify-content-between my-2`;
    alerta.setAttribute('role', 'alert');

    const textoDiv = document.createElement('div');
    textoDiv.textContent = mensaje;

    const botonCerrar = document.createElement('button');
    botonCerrar.type = 'button';
    botonCerrar.className = 'btn-close';
    botonCerrar.setAttribute('aria-label', 'Cerrar aviso');
    botonCerrar.addEventListener('click', () => {
      contenedor.replaceChildren();
    });

    alerta.append(textoDiv, botonCerrar);
    contenedor.append(alerta);
  });
}

/**
 * Guarda un aviso en sessionStorage para mostrarlo en la página siguiente (Requisito 8).
 * @param {string} mensaje
 * @param {'success' | 'danger' | 'warning' | 'info' | 'exito' | 'error'} [tipo='success']
 * @param {Storage} [almacen=sessionStorage]
 */
export function guardarAvisoPendiente(mensaje, tipo = 'success', almacen = sessionStorage) {
  almacen.setItem(
    CLAVE_AVISO_PENDIENTE,
    JSON.stringify({ mensaje, tipo: normalizarTipoAviso(tipo) }),
  );
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
