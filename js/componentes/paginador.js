/**
 * @fileoverview Componente DOM para controles de paginación accesibles y sincronización con la URL.
 * Usa exclusivamente createElement, textContent, URLSearchParams y history.replaceState (Requisito 15).
 * @module componentes/paginador
 */

import { extraerPaginaDeParametros, construirQueryConPagina } from '../logica/paginacion.js';

/**
 * Lee el número de página actual desde la barra de direcciones del navegador.
 * @param {Location | { search: string }} [ubicacion=window.location]
 * @returns {number}
 */
export function leerPaginaUrl(ubicacion = window.location) {
  return extraerPaginaDeParametros(ubicacion?.search || '');
}

/**
 * Sincroniza el parámetro `?pagina=X` en la URL sin recargar la página mediante `history.replaceState`.
 * @param {number} pagina Número de página actual.
 * @param {History | { replaceState: (data: unknown, unused: string, url?: string | URL | null) => void }} [historial=window.history]
 * @param {Location | { pathname: string, search: string, hash?: string }} [ubicacion=window.location]
 */
export function sincronizarPaginaUrl(
  pagina,
  historial = window.history,
  ubicacion = window.location,
) {
  if (!historial || typeof historial.replaceState !== 'function' || !ubicacion) {
    return;
  }
  const nuevaQuery = construirQueryConPagina(ubicacion.search || '', pagina);
  const hash = ubicacion.hash || '';
  const nuevaUrl = `${ubicacion.pathname}${nuevaQuery}${hash}`;
  historial.replaceState(null, '', nuevaUrl);
}

/**
 * Renderiza los controles de paginación (Anterior, números de página y Siguiente) con `aria-current="page"`.
 * @param {HTMLElement | null} contenedor Elemento `<nav>` o contenedor donde insertar los botones.
 * @param {import('../logica/paginacion.js').ResultadoPaginacion<unknown>} estadoPaginacion Resultado devuelto por `paginar()`.
 * @param {(nuevaPagina: number) => void} alCambiarPagina Callback invocado cuando el usuario pulsa una página.
 */
export function renderizarControlesPaginacion(contenedor, estadoPaginacion, alCambiarPagina) {
  if (!contenedor) {
    return;
  }

  contenedor.replaceChildren();

  const { paginaActual, totalPaginas, totalElementos, tieneAnterior, tieneSiguiente } =
    estadoPaginacion;

  if (totalElementos === 0 || totalPaginas <= 1) {
    return;
  }

  const listaUl = document.createElement('ul');
  listaUl.className = 'pagination pagination-sm mb-0 justify-content-center flex-wrap gap-1';

  // Botón Anterior
  const itemAnterior = document.createElement('li');
  itemAnterior.className = `page-item${!tieneAnterior ? ' disabled' : ''}`;
  const botonAnterior = document.createElement('button');
  botonAnterior.type = 'button';
  botonAnterior.className = 'page-link fw-semibold';
  botonAnterior.textContent = 'Anterior';
  botonAnterior.disabled = !tieneAnterior;
  botonAnterior.setAttribute('aria-label', 'Página anterior');
  if (tieneAnterior) {
    botonAnterior.addEventListener('click', () => alCambiarPagina(paginaActual - 1));
  }
  itemAnterior.append(botonAnterior);
  listaUl.append(itemAnterior);

  // Botones numéricos de página
  for (let num = 1; num <= totalPaginas; num += 1) {
    const esActiva = num === paginaActual;
    const itemNumero = document.createElement('li');
    itemNumero.className = `page-item${esActiva ? ' active' : ''}`;

    const botonNumero = document.createElement('button');
    botonNumero.type = 'button';
    botonNumero.className = 'page-link fw-bold';
    botonNumero.textContent = String(num);
    botonNumero.setAttribute('aria-label', `Página ${num}`);

    if (esActiva) {
      botonNumero.setAttribute('aria-current', 'page');
    } else {
      botonNumero.addEventListener('click', () => alCambiarPagina(num));
    }

    itemNumero.append(botonNumero);
    listaUl.append(itemNumero);
  }

  // Botón Siguiente
  const itemSiguiente = document.createElement('li');
  itemSiguiente.className = `page-item${!tieneSiguiente ? ' disabled' : ''}`;
  const botonSiguiente = document.createElement('button');
  botonSiguiente.type = 'button';
  botonSiguiente.className = 'page-link fw-semibold';
  botonSiguiente.textContent = 'Siguiente';
  botonSiguiente.disabled = !tieneSiguiente;
  botonSiguiente.setAttribute('aria-label', 'Página siguiente');
  if (tieneSiguiente) {
    botonSiguiente.addEventListener('click', () => alCambiarPagina(paginaActual + 1));
  }
  itemSiguiente.append(botonSiguiente);
  listaUl.append(itemSiguiente);

  contenedor.append(listaUl);
}
