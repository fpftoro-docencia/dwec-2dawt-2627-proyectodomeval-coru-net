/**
 * @fileoverview Controlador para la zona de administración de usuarios (usuarios.html).
 * Incluye protección estricta por rol, listado con <template> y textContent, buscador con debounce,
 * paginación sincronizada con URL y cambio de rol impidiendo que el admin activo se degrade a sí mismo.
 * @module paginas/usuarios
 */

import { protegerPaginaAdmin } from '../datos/sesion.js';
import { obtenerUsuarios, cambiarRolUsuario, filtrarUsuarios } from '../datos/usuarios.js';
import { paginar, ELEMENTOS_POR_PAGINA_DEFECTO } from '../logica/paginacion.js';
import {
  leerPaginaUrl,
  sincronizarPaginaUrl,
  renderizarControlesPaginacion,
} from '../componentes/paginador.js';
import { inicializarCabecera } from '../componentes/cabecera.js';
import {
  iniciarOyenteAvisos,
  guardarAvisoPendiente,
  comprobarAvisoPendiente,
  lanzarAviso,
} from '../componentes/avisos.js';

export const TIEMPO_DEBOUNCE_USUARIOS_MS = 250;

/**
 * Inicializa la página de administración de usuarios.
 * @param {Location} [navegacion=window.location]
 */
export function inicializarPaginaUsuarios(navegacion = window.location) {
  const sesion = protegerPaginaAdmin(navegacion, undefined, (mensaje, tipo) => {
    guardarAvisoPendiente(mensaje, tipo);
  });

  if (!sesion) {
    return;
  }

  inicializarCabecera('usuarios.html', undefined, navegacion);
  iniciarOyenteAvisos();
  comprobarAvisoPendiente();

  const cuerpoUsuarios = document.getElementById('cuerpo-usuarios');
  const plantillaUsuario = /** @type {HTMLTemplateElement | null} */ (
    document.getElementById('plantilla-fila-usuario')
  );
  const contenedorTabla = document.getElementById('contenedor-tabla-usuarios');
  const estadoVacio = document.getElementById('estado-vacio-usuarios');
  const campoBusqueda = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-busqueda-usuarios')
  );
  const contadorUsuarios = document.getElementById('contador-usuarios');
  const navPaginacion = document.getElementById('navegacion-paginacion-usuarios');

  let paginaSolicitada = leerPaginaUrl(navegacion);
  let terminoBusqueda = '';
  /** @type {number | null} */
  let temporizadorDebounce = null;

  /**
   * Crea una fila de usuario desde el `<template>` usando únicamente `textContent`.
   * @param {Object} cuenta
   * @returns {DocumentFragment | null}
   */
  function crearFilaUsuario(cuenta) {
    if (!plantillaUsuario) {
      return null;
    }

    const clon = /** @type {DocumentFragment} */ (plantillaUsuario.content.cloneNode(true));
    const celdaNombre = clon.querySelector('.celda-usuario-nombre');
    const celdaCorreo = clon.querySelector('.celda-usuario-correo');
    const celdaRol = clon.querySelector('.celda-usuario-rol');
    const botonRol = /** @type {HTMLButtonElement | null} */ (
      clon.querySelector('.boton-cambiar-rol')
    );
    const explicacion = /** @type {HTMLElement | null} */ (
      clon.querySelector('.celda-usuario-explicacion')
    );

    const esAdmin = cuenta.rol === 'administrador';
    const esMismoAdminActivo = cuenta.usuario.toLowerCase() === sesion.usuario.toLowerCase();

    if (celdaNombre) {
      celdaNombre.textContent = cuenta.usuario;
    }
    if (celdaCorreo) {
      celdaCorreo.textContent = cuenta.correo;
    }
    if (celdaRol) {
      celdaRol.textContent = esAdmin ? 'Administrador' : 'Usuario';
      celdaRol.classList.add(esAdmin ? 'bg-danger' : 'bg-dark');
    }

    if (botonRol) {
      if (esMismoAdminActivo) {
        botonRol.disabled = true;
        botonRol.className = 'btn btn-outline-secondary btn-sm fw-bold boton-cambiar-rol';
        botonRol.textContent = 'Rol propio bloqueado';
        botonRol.title = 'No puedes quitarte tu propio rol de administrador';
        if (explicacion) {
          explicacion.hidden = false;
          explicacion.textContent =
            'Sesión activa: no puedes quitarte tu propio rol de administrador.';
        }
      } else {
        const siguienteRol = esAdmin ? 'usuario' : 'administrador';
        botonRol.disabled = false;
        botonRol.className = esAdmin
          ? 'btn btn-outline-dark btn-sm fw-bold boton-cambiar-rol'
          : 'btn btn-outline-danger btn-sm fw-bold boton-cambiar-rol';
        botonRol.textContent = esAdmin ? 'Cambiar a Usuario' : 'Hacer Administrador';
        botonRol.setAttribute('aria-label', `Cambiar rol de ${cuenta.usuario} a ${siguienteRol}`);

        botonRol.addEventListener('click', () => {
          try {
            const modificado = cambiarRolUsuario(cuenta.usuario, siguienteRol, sesion.usuario);
            renderizarUsuarios(true);
            lanzarAviso(
              document.body,
              `El rol de «${modificado.usuario}» se ha actualizado a «${modificado.rol}».`,
              'success',
            );
          } catch (error) {
            lanzarAviso(
              document.body,
              error instanceof Error ? error.message : 'No se pudo cambiar el rol.',
              'danger',
            );
          }
        });
      }
    }

    return clon;
  }

  /**
   * Renderiza la lista de usuarios filtrada y paginada.
   * @param {boolean} [actualizarUrl=true]
   */
  function renderizarUsuarios(actualizarUrl = true) {
    const todos = obtenerUsuarios();
    const filtrados = filtrarUsuarios(todos, terminoBusqueda);
    const estadoPag = paginar(filtrados, paginaSolicitada, ELEMENTOS_POR_PAGINA_DEFECTO);

    paginaSolicitada = estadoPag.paginaActual;
    if (actualizarUrl) {
      sincronizarPaginaUrl(paginaSolicitada, window.history, navegacion);
    }

    if (contadorUsuarios) {
      if (terminoBusqueda.trim() !== '') {
        contadorUsuarios.textContent = `${filtrados.length} de ${todos.length} usuarios encontrados`;
      } else {
        const plural = todos.length === 1 ? 'usuario registrado' : 'usuarios registrados';
        contadorUsuarios.textContent = `${todos.length} ${plural}`;
      }
    }

    if (cuerpoUsuarios) {
      cuerpoUsuarios.replaceChildren();
    }

    if (filtrados.length === 0) {
      if (contenedorTabla) {
        contenedorTabla.hidden = true;
      }
      if (estadoVacio) {
        estadoVacio.hidden = false;
      }
    } else {
      if (contenedorTabla) {
        contenedorTabla.hidden = false;
      }
      if (estadoVacio) {
        estadoVacio.hidden = true;
      }
      for (const cuenta of estadoPag.elementos) {
        const fila = crearFilaUsuario(cuenta);
        if (fila && cuerpoUsuarios) {
          cuerpoUsuarios.append(fila);
        }
      }
    }

    renderizarControlesPaginacion(navPaginacion, estadoPag, (nuevaPagina) => {
      paginaSolicitada = nuevaPagina;
      renderizarUsuarios(true);
    });
  }

  if (campoBusqueda) {
    campoBusqueda.addEventListener('input', () => {
      if (temporizadorDebounce !== null) {
        clearTimeout(temporizadorDebounce);
      }
      temporizadorDebounce = setTimeout(() => {
        terminoBusqueda = campoBusqueda.value;
        paginaSolicitada = 1;
        renderizarUsuarios(true);
      }, TIEMPO_DEBOUNCE_USUARIOS_MS);
    });
  }

  renderizarUsuarios(true);
}

if (
  typeof window !== 'undefined' &&
  document.querySelector('title')?.textContent.includes('Usuarios')
) {
  inicializarPaginaUsuarios();
}
