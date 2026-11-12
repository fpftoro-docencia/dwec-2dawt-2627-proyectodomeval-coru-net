/**
 * @fileoverview Controlador para la página privada de listado de socios (listado.html).
 * Genera filas mediante <template> y textContent, filtra con debounce ignorando tildes/mayúsculas,
 * pagina sincronizando ?pagina=X en la URL y confirma bajas mediante <dialog> nativo.
 * @module paginas/listado
 */

import { protegerPaginaPrivada } from '../datos/sesion.js';
import { obtenerSocios, eliminarSocio, filtrarSocios, crearSocio } from '../datos/socios.js';
import { paginar, ELEMENTOS_POR_PAGINA_DEFECTO } from '../logica/paginacion.js';
import {
  leerPaginaUrl,
  sincronizarPaginaUrl,
  renderizarControlesPaginacion,
} from '../componentes/paginador.js';
import { inicializarCabecera } from '../componentes/cabecera.js';
import {
  iniciarOyenteAvisos,
  comprobarAvisoPendiente,
  emitirAviso,
} from '../componentes/avisos.js';

export const TIEMPO_DEBOUNCE_MS = 250;

/**
 * Datos de demostración opcionales para probar rápidamente paginación y filtrado en el navegador.
 */
const SOCIOS_DEMOSTRACION = [
  {
    nombre: 'Álvaro Valero Serrano',
    dni: '12345678Z',
    fechaNacimiento: '1991-04-15',
    categoria: 'Élite',
    cuota: 45,
    federado: true,
    licencia: 'ESP-ELI-2026-01',
    bicicletas: [
      { marca: 'Specialized', modelo: 'S-Works Epic 8', disciplina: 'Montaña (MTB)' },
      { marca: 'Specialized', modelo: 'Tarmac SL8', disciplina: 'Carretera' },
    ],
  },
  {
    nombre: 'Sofía Méndez Castaño',
    dni: '00000000T',
    fechaNacimiento: '1989-09-22',
    categoria: 'Máster 30',
    cuota: 35,
    federado: true,
    licencia: 'ESP-M30-2026-14',
    bicicletas: [{ marca: 'Orbea', modelo: 'Oiz M-Team', disciplina: 'Montaña (MTB)' }],
  },
  {
    nombre: 'Martín Gómez Ibáñez',
    dni: '11111111H',
    fechaNacimiento: '2004-02-10',
    categoria: 'Sub-23',
    cuota: 25,
    federado: true,
    licencia: 'ESP-S23-2026-08',
    bicicletas: [{ marca: 'Canyon', modelo: 'Lux World Cup', disciplina: 'Montaña (MTB)' }],
  },
  {
    nombre: 'Elena Domínguez Ríos',
    dni: '22222222J',
    fechaNacimiento: '1982-11-05',
    categoria: 'Máster 40',
    cuota: 35,
    federado: false,
    licencia: '',
    bicicletas: [{ marca: 'Specialized', modelo: 'Diverge STR', disciplina: 'Gravel' }],
  },
  {
    nombre: 'Javier Núñez Peñalver',
    dni: '33333333P',
    fechaNacimiento: '1995-07-19',
    categoria: 'Cicloturista',
    cuota: 20,
    federado: false,
    licencia: '',
    bicicletas: [],
  },
  {
    nombre: 'Lucía Fernández Alarcón',
    dni: '44444444A',
    fechaNacimiento: '1993-12-01',
    categoria: 'Élite',
    cuota: 45,
    federado: true,
    licencia: 'ESP-ELI-2026-77',
    bicicletas: [{ marca: 'Trek', modelo: 'Supercaliber SLR', disciplina: 'Montaña (MTB)' }],
  },
];

/**
 * Abre un elemento `<dialog>` de forma compatible con navegadores y entornos de test (Happy-DOM).
 * @param {HTMLDialogElement | null} dialogo
 */
function abrirDialogoModal(dialogo) {
  if (!dialogo) {
    return;
  }
  if (typeof dialogo.showModal === 'function') {
    try {
      dialogo.showModal();
      return;
    } catch {
      // Fallback si ya estaba abierto o en entornos simulados
    }
  }
  dialogo.setAttribute('open', '');
}

/**
 * Cierra un elemento `<dialog>` de forma compatible con navegadores y entornos de test.
 * @param {HTMLDialogElement | null} dialogo
 */
function cerrarDialogoModal(dialogo) {
  if (!dialogo) {
    return;
  }
  if (typeof dialogo.close === 'function') {
    try {
      dialogo.close();
    } catch {
      // Fallback en entornos simulados
    }
  }
  dialogo.removeAttribute('open');
}

/**
 * Formatea el resumen de bicicletas de un socio para mostrarlo como texto plano.
 * @param {Array<Object>} bicicletas
 * @returns {string}
 */
function formatearResumenBicicletas(bicicletas) {
  if (!Array.isArray(bicicletas) || bicicletas.length === 0) {
    return 'Sin bicicletas';
  }
  const nombres = bicicletas.map((b) => `${b.marca} ${b.modelo}`.trim()).join(', ');
  return `${bicicletas.length}: ${nombres}`;
}

/**
 * Inicializa la página del listado de socios ciclistas.
 * @param {Location} [navegacion=window.location]
 */
export function inicializarPaginaListado(navegacion = window.location) {
  const sesion = protegerPaginaPrivada(navegacion);
  if (!sesion) {
    return;
  }

  inicializarCabecera('listado.html', undefined, navegacion);
  iniciarOyenteAvisos();
  comprobarAvisoPendiente();

  const cuerpoListado = document.getElementById('cuerpo-listado');
  const plantillaFila = /** @type {HTMLTemplateElement | null} */ (
    document.getElementById('plantilla-fila-socio')
  );
  const contenedorTabla = document.getElementById('contenedor-tabla');
  const estadoVacio = document.getElementById('estado-vacio');
  const tituloVacio = document.getElementById('titulo-vacio');
  const mensajeVacio = document.getElementById('mensaje-vacio');
  const botonCargarEjemplos = document.getElementById('boton-cargar-ejemplos');
  const campoBusqueda = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-busqueda')
  );
  const contadorResultados = document.getElementById('contador-resultados');
  const navPaginacion = document.getElementById('navegacion-paginacion');

  const dialogoBorrado = /** @type {HTMLDialogElement | null} */ (
    document.getElementById('dialogo-confirmar-borrado')
  );
  const mensajeDialogoBorrado = document.getElementById('mensaje-dialogo-borrado');
  const botonCancelarBorrado = document.getElementById('boton-cancelar-borrado');
  const botonConfirmarBorrado = document.getElementById('boton-confirmar-borrado');

  let paginaSolicitada = leerPaginaUrl(navegacion);
  let terminoBusqueda = '';
  /** @type {number | null} */
  let temporizadorDebounce = null;
  /** @type {Object | null} */
  let socioPendienteBorrado = null;

  /**
   * Construye una fila a partir del `<template>` usando únicamente `textContent`.
   * @param {Object} socio
   * @returns {DocumentFragment | null}
   */
  function crearFilaDesdePlantilla(socio) {
    if (!plantillaFila) {
      return null;
    }
    const clon = /** @type {DocumentFragment} */ (plantillaFila.content.cloneNode(true));

    const celdaNombre = clon.querySelector('.celda-nombre');
    const celdaDni = clon.querySelector('.celda-dni');
    const celdaCategoria = clon.querySelector('.celda-categoria');
    const celdaFederado = clon.querySelector('.celda-federado');
    const celdaLicencia = clon.querySelector('.celda-licencia');
    const celdaCuota = clon.querySelector('.celda-cuota');
    const celdaBicicletas = clon.querySelector('.celda-bicicletas');
    const enlaceEditar = /** @type {HTMLAnchorElement | null} */ (
      clon.querySelector('.enlace-editar')
    );
    const botonBorrar = /** @type {HTMLButtonElement | null} */ (
      clon.querySelector('.boton-borrar')
    );

    if (celdaNombre) {
      celdaNombre.textContent = socio.nombre;
    }
    if (celdaDni) {
      celdaDni.textContent = `DNI: ${socio.dni}`;
    }
    if (celdaCategoria) {
      celdaCategoria.textContent = socio.categoria;
    }
    if (celdaFederado) {
      celdaFederado.textContent = socio.federado ? 'Federado' : 'No federado';
      celdaFederado.classList.add(socio.federado ? 'bg-success' : 'bg-secondary');
    }
    if (celdaLicencia) {
      celdaLicencia.textContent =
        socio.federado && socio.licencia ? socio.licencia : 'Sin licencia';
    }
    if (celdaCuota) {
      celdaCuota.textContent = `${socio.cuota} €/mes`;
    }
    if (celdaBicicletas) {
      celdaBicicletas.textContent = formatearResumenBicicletas(socio.bicicletas);
    }
    if (enlaceEditar) {
      enlaceEditar.href = `ficha.html?id=${encodeURIComponent(socio.id)}`;
      enlaceEditar.setAttribute('aria-label', `Editar ficha de ${socio.nombre}`);
    }
    if (botonBorrar) {
      botonBorrar.setAttribute('aria-label', `Borrar ficha de ${socio.nombre}`);
      botonBorrar.addEventListener('click', () => {
        socioPendienteBorrado = socio;
        if (mensajeDialogoBorrado) {
          mensajeDialogoBorrado.textContent = `¿Estás seguro de que deseas dar de baja al socio «${socio.nombre}» (DNI ${socio.dni})? Esta acción eliminará su ficha del club.`;
        }
        abrirDialogoModal(dialogoBorrado);
      });
    }

    return clon;
  }

  /**
   * Renderiza la tabla, el contador, el estado vacío y la barra de paginación.
   * @param {boolean} [actualizarUrl=true]
   */
  function renderizarListado(actualizarUrl = true) {
    const todosLosSocios = obtenerSocios(sesion.usuario);
    const sociosFiltrados = filtrarSocios(todosLosSocios, terminoBusqueda);
    const estadoPag = paginar(sociosFiltrados, paginaSolicitada, ELEMENTOS_POR_PAGINA_DEFECTO);

    paginaSolicitada = estadoPag.paginaActual;

    if (actualizarUrl) {
      sincronizarPaginaUrl(paginaSolicitada, window.history, navegacion);
    }

    if (contadorResultados) {
      if (terminoBusqueda.trim() !== '') {
        contadorResultados.textContent = `${sociosFiltrados.length} de ${todosLosSocios.length} socios coinciden con la búsqueda`;
      } else {
        const plural = todosLosSocios.length === 1 ? 'socio registrado' : 'socios registrados';
        contadorResultados.textContent = `${todosLosSocios.length} ${plural}`;
      }
    }

    if (cuerpoListado) {
      cuerpoListado.replaceChildren();
    }

    if (sociosFiltrados.length === 0) {
      if (contenedorTabla) {
        contenedorTabla.hidden = true;
      }
      if (estadoVacio) {
        estadoVacio.hidden = false;
      }
      if (todosLosSocios.length === 0) {
        if (tituloVacio) {
          tituloVacio.textContent = 'No hay socios registrados todavía';
        }
        if (mensajeVacio) {
          mensajeVacio.textContent =
            'Crea el primer socio ciclista del club o carga los socios de ejemplo para probar el buscador y la paginación.';
        }
        if (botonCargarEjemplos) {
          botonCargarEjemplos.hidden = false;
        }
      } else {
        if (tituloVacio) {
          tituloVacio.textContent = 'Sin resultados para tu búsqueda';
        }
        if (mensajeVacio) {
          mensajeVacio.textContent = `No se encontró ningún socio ciclista que coincida con «${terminoBusqueda.trim()}».`;
        }
        if (botonCargarEjemplos) {
          botonCargarEjemplos.hidden = true;
        }
      }
    } else {
      if (contenedorTabla) {
        contenedorTabla.hidden = false;
      }
      if (estadoVacio) {
        estadoVacio.hidden = true;
      }
      for (const socio of estadoPag.elementos) {
        const fila = crearFilaDesdePlantilla(socio);
        if (fila && cuerpoListado) {
          cuerpoListado.append(fila);
        }
      }
    }

    renderizarControlesPaginacion(navPaginacion, estadoPag, (nuevaPagina) => {
      paginaSolicitada = nuevaPagina;
      renderizarListado(true);
    });
  }

  // Buscador con debounce que reinicia a la página 1 (Requisito 14 y 15)
  if (campoBusqueda) {
    campoBusqueda.addEventListener('input', () => {
      if (temporizadorDebounce !== null) {
        clearTimeout(temporizadorDebounce);
      }
      temporizadorDebounce = setTimeout(() => {
        terminoBusqueda = campoBusqueda.value;
        paginaSolicitada = 1;
        renderizarListado(true);
      }, TIEMPO_DEBOUNCE_MS);
    });
  }

  // Acciones del diálogo de confirmación de borrado
  if (botonCancelarBorrado) {
    botonCancelarBorrado.addEventListener('click', () => {
      socioPendienteBorrado = null;
      cerrarDialogoModal(dialogoBorrado);
    });
  }

  if (botonConfirmarBorrado) {
    botonConfirmarBorrado.addEventListener('click', () => {
      if (!socioPendienteBorrado) {
        cerrarDialogoModal(dialogoBorrado);
        return;
      }
      const { id, nombre } = socioPendienteBorrado;
      const borrado = eliminarSocio(sesion.usuario, id);
      socioPendienteBorrado = null;
      cerrarDialogoModal(dialogoBorrado);

      if (borrado) {
        renderizarListado(true);
        emitirAviso(
          document.body,
          `Se ha dado de baja al socio «${nombre}» correctamente.`,
          'exito',
        );
      }
    });
  }

  // Botón opcional para cargar socios de demostración cuando la lista está vacía
  if (botonCargarEjemplos) {
    botonCargarEjemplos.addEventListener('click', () => {
      for (const datosDemo of SOCIOS_DEMOSTRACION) {
        try {
          crearSocio(sesion.usuario, datosDemo);
        } catch {
          // Ignorar si ya existe alguno con ese DNI
        }
      }
      paginaSolicitada = 1;
      renderizarListado(true);
      emitirAviso(
        document.body,
        'Se han cargado 6 socios ciclistas de demostración en el club.',
        'exito',
      );
    });
  }

  renderizarListado(true);
}

if (
  typeof window !== 'undefined' &&
  document.querySelector('title')?.textContent.includes('Listado')
) {
  inicializarPaginaListado();
}
