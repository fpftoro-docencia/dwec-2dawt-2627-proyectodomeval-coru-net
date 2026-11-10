/**
 * @fileoverview Cabecera compartida para páginas privadas (Requisito 2).
 * Cero JavaScript de Bootstrap: el menú y el cierre de sesión los controla nuestro código.
 * @module componentes/cabecera
 */

import { obtenerSesion, cerrarSesion } from '../datos/sesion.js';

/**
 * Renderiza la cabecera privada con el menú adaptado al rol del usuario.
 * @param {string} paginaActiva Nombre del archivo actual (ej. 'listado.html').
 * @param {HTMLElement} [contenedorCabecera] Elemento donde insertar la cabecera (busca <header> si se omite).
 * @param {Location} [navegacion=window.location]
 */
export function inicializarCabecera(
  paginaActiva,
  contenedorCabecera = document.querySelector('.main-header'),
  navegacion = window.location,
) {
  if (!contenedorCabecera) {
    return;
  }

  const sesion = obtenerSesion();
  const nombre = sesion ? sesion.usuario : 'Invitado';
  const esAdmin = Boolean(sesion && sesion.rol === 'administrador');
  const rolTexto = esAdmin ? 'ADMINISTRADOR' : 'SOCIO';
  const badgeClase = esAdmin ? 'bg-danger' : 'bg-dark';

  contenedorCabecera.innerHTML = `
    <div class="container d-flex justify-content-between align-items-center py-2">
      <a href="listado.html" class="brand-logo">
        <span>PEDAL<span class="brand-badge">&</span>CADENCIA</span>
      </a>

      <!-- Menú de navegación privada -->
      <nav aria-label="Navegación privada del club" class="d-flex align-items-center gap-1">
        <a href="listado.html" class="nav-link-custom ${paginaActiva === 'listado.html' ? 'active' : ''}">
          Listado de Socios
        </a>
        <a href="ficha.html" class="nav-link-custom ${paginaActiva === 'ficha.html' ? 'active' : ''}">
          Nueva Ficha
        </a>
        ${
          esAdmin
            ? `<a href="usuarios.html" class="nav-link-custom ${paginaActiva === 'usuarios.html' ? 'active' : ''}">
                Usuarios
              </a>`
            : ''
        }
      </nav>

      <!-- Información del usuario y botón Cerrar sesión -->
      <div class="d-flex align-items-center gap-3">
        <div class="text-end d-none d-sm-block">
          <span class="fw-bold d-block small">${nombre}</span>
          <span class="badge ${badgeClase} rounded-pill" style="font-size: 0.65rem;">${rolTexto}</span>
        </div>
        <button id="boton-cerrar-sesion" type="button" class="btn btn-outline-danger btn-sm fw-bold">
          Cerrar sesión
        </button>
      </div>
    </div>
  `;

  // Oyente del botón cerrar sesión (Requisito 7)
  const botonCerrar = contenedorCabecera.querySelector('#boton-cerrar-sesion');
  if (botonCerrar) {
    botonCerrar.addEventListener('click', () => {
      cerrarSesion();
      navegacion.replace('index.html');
    });
  }
}
