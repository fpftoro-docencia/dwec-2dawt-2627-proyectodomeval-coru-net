/**
 * @fileoverview Controlador para la página privada de listado de socios (`listado.html`).
 * HTML requerido: `#cuerpo-listado`, `#plantilla-fila-socio`, `#contenedor-tabla`,
 * `#estado-vacio`, `#campo-busqueda`, `#contador-resultados`, `#navegacion-paginacion`,
 * `#dialogo-confirmar-borrado` y `#seccion-quedadas` (mapa interactivo y rutas).
 * Genera filas mediante `<template>` y `textContent`, muestra fotos de perfil y de bicicletas,
 * permite al administrador ver todo el club y gestiona quedadas de rutas ciclistas con mapa SVG.
 * @module paginas/listado
 */

import { protegerPaginaPrivada } from '../datos/sesion.js';
import { obtenerUsuarios } from '../datos/usuarios.js';
import {
  obtenerSocios,
  obtenerSociosVisibles,
  eliminarSocio,
  filtrarSocios,
  crearSocio,
} from '../datos/socios.js';
import {
  ZONAS_MAPA_DISPONIBLES,
  obtenerRutasQuedadas,
  contarRutasDeSocio,
  verificarPermisoDisenarRuta,
  crearRutaQuedada,
  alternarInscripcionRuta,
  eliminarRutaQuedada,
} from '../datos/rutas.js';
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
 * Genera una imagen SVG codificada como DataURL para avatares o ilustraciones de bicicletas de ejemplo.
 * @param {string} texto
 * @param {string} colorFondo
 * @returns {string}
 */
function crearSvgDataUrl(texto, colorFondo = '#d90429') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="${colorFondo}"/><text x="60" y="46" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">${texto}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Datos de demostración completos (con fotos de perfil y de bicicletas) para probar el club.
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
    fotoPerfil: crearSvgDataUrl('AV', '#d90429'),
    bicicletas: [
      {
        marca: 'Specialized',
        modelo: 'S-Works Epic 8',
        disciplina: 'Montaña (MTB)',
        foto: crearSvgDataUrl('MTB', '#1a1a1d'),
      },
      {
        marca: 'Specialized',
        modelo: 'Tarmac SL8',
        disciplina: 'Carretera',
        foto: crearSvgDataUrl('SL8', '#d90429'),
      },
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
    fotoPerfil: crearSvgDataUrl('SM', '#0f172a'),
    bicicletas: [
      {
        marca: 'Orbea',
        modelo: 'Oiz M-Team',
        disciplina: 'Montaña (MTB)',
        foto: crearSvgDataUrl('OIZ', '#0284c7'),
      },
    ],
  },
  {
    nombre: 'Martín Gómez Ibáñez',
    dni: '11111111H',
    fechaNacimiento: '2004-02-10',
    categoria: 'Sub-23',
    cuota: 25,
    federado: true,
    licencia: 'ESP-S23-2026-08',
    fotoPerfil: crearSvgDataUrl('MG', '#15803d'),
    bicicletas: [
      {
        marca: 'Canyon',
        modelo: 'Lux World Cup',
        disciplina: 'Montaña (MTB)',
        foto: crearSvgDataUrl('LUX', '#334155'),
      },
    ],
  },
  {
    nombre: 'Elena Domínguez Ríos',
    dni: '22222222J',
    fechaNacimiento: '1982-11-05',
    categoria: 'Máster 40',
    cuota: 35,
    federado: false,
    licencia: '',
    fotoPerfil: crearSvgDataUrl('ED', '#6d28d9'),
    bicicletas: [
      {
        marca: 'Specialized',
        modelo: 'Diverge STR',
        disciplina: 'Gravel',
        foto: crearSvgDataUrl('GRV', '#7c2d12'),
      },
    ],
  },
  {
    nombre: 'Javier Núñez Peñalver',
    dni: '33333333P',
    fechaNacimiento: '1995-07-19',
    categoria: 'Cicloturista',
    cuota: 20,
    federado: false,
    licencia: '',
    fotoPerfil: crearSvgDataUrl('JN', '#475569'),
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
    fotoPerfil: crearSvgDataUrl('LF', '#be123c'),
    bicicletas: [
      {
        marca: 'Trek',
        modelo: 'Supercaliber SLR',
        disciplina: 'Montaña (MTB)',
        foto: crearSvgDataUrl('TRK', '#991b1b'),
      },
    ],
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
 * Extrae las iniciales de hasta 2 letras del nombre de un socio.
 * @param {string} nombre
 * @returns {string}
 */
function obtenerIniciales(nombre) {
  const partes = String(nombre || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) {
    return 'CC';
  }
  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

/**
 * Inicializa la página del listado de socios ciclistas y el organizador de quedadas con mapa.
 * @param {Location} [navegacion=window.location]
 * @fires CustomEvent#aviso
 * @listens HTMLInputElement#input
 * @listens HTMLButtonElement#click
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
  const botonCargarEjemplosBarra = document.getElementById('boton-cargar-ejemplos-barra');
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

  // Elementos de la sección de Quedadas y Rutas con Mapa
  const formularioQuedada = /** @type {HTMLFormElement | null} */ (
    document.getElementById('formulario-quedada')
  );
  const campoSocioRuta = /** @type {HTMLSelectElement | null} */ (
    document.getElementById('campo-socio-ruta')
  );
  const estadoLimiteSocioRuta = document.getElementById('estado-limite-socio-ruta');
  const campoTituloRuta = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-titulo-ruta')
  );
  const campoZonaMapa = /** @type {HTMLSelectElement | null} */ (
    document.getElementById('campo-zona-mapa')
  );
  const campoFechaRuta = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-fecha-ruta')
  );
  const campoKilometrosRuta = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-kilometros-ruta')
  );
  const campoDesnivelRuta = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-desnivel-ruta')
  );
  const botonReiniciarTrazado = document.getElementById('boton-reiniciar-trazado');
  const mapaInteractivoRuta = document.getElementById('mapa-interactivo-ruta');
  const polilineaMapaRuta = document.getElementById('polilinea-mapa-ruta');
  const grupoPuntosMapa = document.getElementById('grupo-puntos-mapa');
  const etiquetaSectorMapa = document.getElementById('etiqueta-sector-mapa');
  const etiquetaKmMapa = document.getElementById('etiqueta-km-mapa');
  const avisoQuedadaLocal = document.getElementById('aviso-quedada-local');
  const botonCrearQuedada = /** @type {HTMLButtonElement | null} */ (
    document.getElementById('boton-crear-quedada')
  );
  const contenedorQuedadas = document.getElementById('contenedor-quedadas');
  const estadoVacioQuedadas = document.getElementById('estado-vacio-quedadas');
  const contadorQuedadas = document.getElementById('contador-quedadas');
  const plantillaTarjetaQuedada = /** @type {HTMLTemplateElement | null} */ (
    document.getElementById('plantilla-tarjeta-quedada')
  );

  let paginaSolicitada = leerPaginaUrl(navegacion);
  let terminoBusqueda = '';
  /** @type {number | null} */
  let temporizadorDebounce = null;
  /** @type {Object | null} */
  let socioPendienteBorrado = null;

  /** @type {Array<Object>} */
  let puntosTrazadoActual = [...ZONAS_MAPA_DISPONIBLES['alpes-innsbruck'].puntos];
  let modoTrazoPersonalizado = false;

  /**
   * Obtiene los socios visibles para la sesión actual (todos si es administrador, o los propios si es usuario).
   * @returns {Array<Object>}
   */
  function leerSociosDisponibles() {
    if (sesion.rol === 'administrador') {
      const cuentas = obtenerUsuarios().map((u) => u.usuario);
      return obtenerSociosVisibles(sesion.usuario, sesion.rol, cuentas);
    }
    return obtenerSocios(sesion.usuario);
  }

  /**
   * Construye una fila a partir del `<template>` usando `textContent` e imágenes de perfil/bicicleta.
   * @param {Object} socio
   * @returns {DocumentFragment | null}
   */
  function crearFilaDesdePlantilla(socio) {
    if (!plantillaFila) {
      return null;
    }
    const clon = /** @type {DocumentFragment} */ (plantillaFila.content.cloneNode(true));

    const fotoSocio = /** @type {HTMLImageElement | null} */ (
      clon.querySelector('.foto-socio-fila')
    );
    const avatarIniciales = /** @type {HTMLElement | null} */ (
      clon.querySelector('.avatar-socio-iniciales')
    );
    const celdaNombre = clon.querySelector('.celda-nombre');
    const celdaDni = clon.querySelector('.celda-dni');
    const celdaPropietario = /** @type {HTMLElement | null} */ (
      clon.querySelector('.celda-propietario')
    );
    const celdaCategoria = clon.querySelector('.celda-categoria');
    const celdaFederado = clon.querySelector('.celda-federado');
    const celdaLicencia = clon.querySelector('.celda-licencia');
    const celdaCuota = clon.querySelector('.celda-cuota');
    const galeriaFotosBicis = clon.querySelector('.galeria-fotos-bicis');
    const celdaBicicletas = clon.querySelector('.celda-bicicletas');
    const enlaceEditar = /** @type {HTMLAnchorElement | null} */ (
      clon.querySelector('.enlace-editar')
    );
    const botonBorrar = /** @type {HTMLButtonElement | null} */ (
      clon.querySelector('.boton-borrar')
    );

    if (socio.fotoPerfil && fotoSocio && avatarIniciales) {
      fotoSocio.src = socio.fotoPerfil;
      fotoSocio.hidden = false;
      avatarIniciales.hidden = true;
    } else if (avatarIniciales) {
      avatarIniciales.textContent = obtenerIniciales(socio.nombre);
    }

    if (celdaNombre) {
      celdaNombre.textContent = socio.nombre;
    }
    if (celdaDni) {
      celdaDni.textContent = `DNI: ${socio.dni}`;
    }
    if (celdaPropietario && sesion.rol === 'administrador' && socio.propietario) {
      celdaPropietario.hidden = false;
      celdaPropietario.textContent = `Cuenta: ${socio.propietario}`;
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
    if (galeriaFotosBicis && Array.isArray(socio.bicicletas)) {
      for (const bici of socio.bicicletas) {
        if (bici.foto) {
          const miniatura = document.createElement('img');
          miniatura.src = bici.foto;
          miniatura.alt = `${bici.marca} ${bici.modelo}`;
          miniatura.title = `${bici.marca} ${bici.modelo} (${bici.disciplina})`;
          miniatura.className = 'miniatura-bici-fila';
          galeriaFotosBicis.append(miniatura);
        }
      }
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
   * Renderiza el trazado GPS y los puntos sobre el SVG interactivo del mapa.
   */
  function pintarMapaInteractivo() {
    if (!polilineaMapaRuta || !grupoPuntosMapa) {
      return;
    }
    const cadenaPuntos = puntosTrazadoActual.map((p) => `${p.x},${p.y}`).join(' ');
    polilineaMapaRuta.setAttribute('points', cadenaPuntos);
    grupoPuntosMapa.replaceChildren();

    puntosTrazadoActual.forEach((punto, idx) => {
      const circulo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circulo.setAttribute('cx', String(punto.x));
      circulo.setAttribute('cy', String(punto.y));
      circulo.setAttribute('r', idx === 0 || idx === puntosTrazadoActual.length - 1 ? '6' : '4');
      circulo.setAttribute(
        'fill',
        idx === 0 ? '#22c55e' : idx === puntosTrazadoActual.length - 1 ? '#facc15' : '#ffffff',
      );
      circulo.setAttribute('stroke', '#0f172a');
      circulo.setAttribute('stroke-width', '2');
      grupoPuntosMapa.append(circulo);
    });

    if (etiquetaSectorMapa && campoZonaMapa) {
      const info =
        ZONAS_MAPA_DISPONIBLES[campoZonaMapa.value] || ZONAS_MAPA_DISPONIBLES['alpes-innsbruck'];
      etiquetaSectorMapa.textContent = `SECTOR: ${info.nombre.toUpperCase()}`;
    }

    if (etiquetaKmMapa && campoKilometrosRuta && campoDesnivelRuta) {
      etiquetaKmMapa.textContent = `${campoKilometrosRuta.value || 0} km · ${campoDesnivelRuta.value || 0} m+`;
    }
  }

  /**
   * Actualiza el selector de socio diseñador y el aviso sobre el límite de 1 ruta para no federados.
   */
  function actualizarSelectorSociosParaRuta() {
    if (!campoSocioRuta) {
      return;
    }
    const sociosDisponibles = leerSociosDisponibles();
    const valorPrevio = campoSocioRuta.value;
    campoSocioRuta.replaceChildren();

    if (sociosDisponibles.length === 0) {
      const optVacia = document.createElement('option');
      optVacia.value = '';
      optVacia.textContent = 'Registra o carga antes un socio ciclista...';
      campoSocioRuta.append(optVacia);
      if (estadoLimiteSocioRuta) {
        estadoLimiteSocioRuta.textContent =
          'Crea un socio o pulsa «+ Cargar Socios Demo» para empezar a diseñar rutas.';
      }
      if (botonCrearQuedada) {
        botonCrearQuedada.disabled = true;
      }
      return;
    }

    for (const socio of sociosDisponibles) {
      const rutasCreadas = contarRutasDeSocio(socio.id);
      const opt = document.createElement('option');
      opt.value = socio.id;
      const etiquetaFed = socio.federado
        ? `FEDERADO · Rutas ilimitadas (${rutasCreadas} creadas)`
        : `NO FEDERADO · ${rutasCreadas}/1 ruta permitida`;
      opt.textContent = `${socio.nombre} [${etiquetaFed}]`;
      campoSocioRuta.append(opt);
    }

    if (valorPrevio && sociosDisponibles.some((s) => s.id === valorPrevio)) {
      campoSocioRuta.value = valorPrevio;
    }

    const socioSeleccionado =
      sociosDisponibles.find((s) => s.id === campoSocioRuta.value) || sociosDisponibles[0];

    if (!socioSeleccionado) {
      return;
    }

    const numRutas = contarRutasDeSocio(socioSeleccionado.id);
    const permiso = verificarPermisoDisenarRuta({
      socioFederado: Boolean(socioSeleccionado.federado),
      rutasExistentesSocio: numRutas,
    });

    if (estadoLimiteSocioRuta) {
      if (!permiso.permitido) {
        estadoLimiteSocioRuta.className = 'small mt-1 fw-bold text-danger';
        estadoLimiteSocioRuta.textContent = `⚠️ ${permiso.motivo}`;
      } else if (socioSeleccionado.federado) {
        estadoLimiteSocioRuta.className = 'small mt-1 fw-semibold text-success';
        estadoLimiteSocioRuta.textContent = `✅ Socio federado (${socioSeleccionado.licencia || 'con licencia'}): puede diseñar rutas ilimitadas (${numRutas} diseñadas).`;
      } else {
        estadoLimiteSocioRuta.className = 'small mt-1 fw-semibold text-secondary';
        estadoLimiteSocioRuta.textContent = `ℹ️ Socio no federado: puede diseñar 1 única ruta (${numRutas}/1 utilizada).`;
      }
    }

    if (botonCrearQuedada) {
      botonCrearQuedada.disabled = false;
    }
  }

  /**
   * Renderiza el listado de tarjetas de quedadas convocadas.
   */
  function renderizarQuedadas() {
    if (!contenedorQuedadas || !plantillaTarjetaQuedada) {
      return;
    }
    const todasLasRutas = obtenerRutasQuedadas();
    contenedorQuedadas.replaceChildren();

    if (contadorQuedadas) {
      const plural = todasLasRutas.length === 1 ? 'ruta activa' : 'rutas activas';
      contadorQuedadas.textContent = `${todasLasRutas.length} ${plural}`;
    }

    if (todasLasRutas.length === 0) {
      if (estadoVacioQuedadas) {
        estadoVacioQuedadas.hidden = false;
      }
      return;
    }

    if (estadoVacioQuedadas) {
      estadoVacioQuedadas.hidden = true;
    }

    const rutasOrdenadas = [...todasLasRutas].reverse();

    for (const ruta of rutasOrdenadas) {
      const clon = /** @type {DocumentFragment} */ (
        plantillaTarjetaQuedada.content.cloneNode(true)
      );
      const trazadoMini = clon.querySelector('.trazado-mini-mapa');
      const tituloEl = clon.querySelector('.titulo-quedada');
      const kmEl = clon.querySelector('.km-quedada');
      const metaEl = clon.querySelector('.meta-quedada');
      const desnivelEl = clon.querySelector('.desnivel-quedada');
      const dificultadEl = clon.querySelector('.dificultad-quedada');
      const autorFederadoEl = clon.querySelector('.autor-federado-quedada');
      const participantesEl = clon.querySelector('.participantes-quedada');
      const botonApuntarse = /** @type {HTMLButtonElement | null} */ (
        clon.querySelector('.boton-apuntarse-ruta')
      );
      const botonBorrarRuta = /** @type {HTMLButtonElement | null} */ (
        clon.querySelector('.boton-borrar-ruta')
      );

      if (trazadoMini && Array.isArray(ruta.puntosMapa)) {
        trazadoMini.setAttribute('points', ruta.puntosMapa.map((p) => `${p.x},${p.y}`).join(' '));
      }
      if (tituloEl) {
        tituloEl.textContent = ruta.titulo;
      }
      if (kmEl) {
        kmEl.textContent = `${ruta.kilometros} km`;
      }
      if (metaEl) {
        const infoZona = ZONAS_MAPA_DISPONIBLES[ruta.zonaMapa];
        const nombreZona = infoZona ? infoZona.nombre : ruta.zonaMapa;
        metaEl.textContent = `📍 ${nombreZona} · 📅 ${ruta.fecha} · Diseñada por ${ruta.socioNombre}`;
      }
      if (desnivelEl) {
        desnivelEl.textContent = `⛰️ ${ruta.desnivel} m+`;
      }
      if (dificultadEl) {
        dificultadEl.textContent = `Nivel: ${ruta.dificultad}`;
      }
      if (autorFederadoEl) {
        autorFederadoEl.textContent = ruta.socioFederado
          ? 'Autor Federado'
          : 'Autor No Federado (1/1)';
        autorFederadoEl.classList.add(
          ruta.socioFederado ? 'bg-success' : 'bg-warning',
          'text-dark',
        );
        if (ruta.socioFederado) {
          autorFederadoEl.classList.remove('text-dark');
        }
      }

      const listaParticipantes = Array.isArray(ruta.participantes) ? ruta.participantes : [];
      if (participantesEl) {
        participantesEl.textContent = `🚴 Apuntados (${listaParticipantes.length}): ${listaParticipantes.join(', ')}`;
      }

      if (botonApuntarse) {
        const yaApuntado = listaParticipantes.some(
          (p) => p.toLowerCase() === sesion.usuario.toLowerCase(),
        );
        botonApuntarse.textContent = yaApuntado ? 'Desapuntarme' : 'Apuntarme a la ruta';
        botonApuntarse.addEventListener('click', () => {
          alternarInscripcionRuta(ruta.id, sesion.usuario);
          renderizarQuedadas();
        });
      }

      if (botonBorrarRuta) {
        const puedeBorrar =
          sesion.rol === 'administrador' || ruta.creadorUsuario === sesion.usuario.toLowerCase();
        botonBorrarRuta.hidden = !puedeBorrar;
        botonBorrarRuta.addEventListener('click', () => {
          try {
            eliminarRutaQuedada(ruta.id, sesion.usuario, sesion.rol);
            actualizarSelectorSociosParaRuta();
            renderizarQuedadas();
            emitirAviso(document.body, `La quedada «${ruta.titulo}» ha sido eliminada.`, 'exito');
          } catch (error) {
            emitirAviso(
              document.body,
              error instanceof Error ? error.message : 'No se pudo borrar la ruta.',
              'error',
            );
          }
        });
      }

      contenedorQuedadas.append(clon);
    }
  }

  /**
   * Renderiza la tabla, el contador, el estado vacío y la barra de paginación.
   * @param {boolean} [actualizarUrl=true]
   */
  function renderizarListado(actualizarUrl = true) {
    const todosLosSocios = leerSociosDisponibles();
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

    actualizarSelectorSociosParaRuta();
    renderizarQuedadas();
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
      const { id, nombre, propietario } = socioPendienteBorrado;
      const cuentaObjetivo = propietario || sesion.usuario;
      const borrado = eliminarSocio(cuentaObjetivo, id);
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

  /**
   * Carga los 6 socios de demostración (con fotos de perfil y bicicletas) y 2 quedadas iniciales.
   */
  function cargarDatosDemostracion() {
    for (const datosDemo of SOCIOS_DEMOSTRACION) {
      try {
        crearSocio(sesion.usuario, datosDemo);
      } catch {
        // Ignorar si ya existe alguno con ese DNI
      }
    }

    const sociosActuales = leerSociosDisponibles();
    const socioFederadoDemo = sociosActuales.find((s) => s.federado);
    const socioNoFederadoDemo = sociosActuales.find((s) => !s.federado);

    if (obtenerRutasQuedadas().length === 0) {
      if (socioFederadoDemo) {
        try {
          crearRutaQuedada({
            titulo: 'Ascensión Reina al Paso del Brenner',
            fecha: '2026-11-29',
            kilometros: 92,
            desnivel: 2150,
            zonaMapa: 'alpes-innsbruck',
            socioId: socioFederadoDemo.id,
            socioNombre: socioFederadoDemo.nombre,
            socioFederado: true,
            creadorUsuario: sesion.usuario,
          });
        } catch {
          // Ignorar si ya existe
        }
      }
      if (socioNoFederadoDemo) {
        try {
          crearRutaQuedada({
            titulo: 'Salida Cicloturista Puerto de Navacerrada',
            fecha: '2026-12-06',
            kilometros: 54,
            desnivel: 980,
            zonaMapa: 'guadarrama-madrid',
            socioId: socioNoFederadoDemo.id,
            socioNombre: socioNoFederadoDemo.nombre,
            socioFederado: false,
            creadorUsuario: sesion.usuario,
          });
        } catch {
          // Ignorar si ya alcanzó el límite
        }
      }
    }

    paginaSolicitada = 1;
    renderizarListado(true);
    emitirAviso(
      document.body,
      'Se han cargado 6 socios ciclistas (con fotos de perfil y bicicletas) y las quedadas de ejemplo.',
      'exito',
    );
  }

  if (botonCargarEjemplos) {
    botonCargarEjemplos.addEventListener('click', cargarDatosDemostracion);
  }
  if (botonCargarEjemplosBarra) {
    botonCargarEjemplosBarra.addEventListener('click', cargarDatosDemostracion);
  }

  // Eventos del diseñador de Quedadas y Mapa Interactivo
  if (campoSocioRuta) {
    campoSocioRuta.addEventListener('change', () => {
      actualizarSelectorSociosParaRuta();
    });
  }

  if (campoZonaMapa) {
    campoZonaMapa.addEventListener('change', () => {
      const info =
        ZONAS_MAPA_DISPONIBLES[campoZonaMapa.value] || ZONAS_MAPA_DISPONIBLES['alpes-innsbruck'];
      puntosTrazadoActual = [...info.puntos];
      modoTrazoPersonalizado = false;
      if (campoKilometrosRuta) {
        campoKilometrosRuta.value = String(info.kmRecomendados);
      }
      if (campoDesnivelRuta) {
        campoDesnivelRuta.value = String(info.desnivel);
      }
      pintarMapaInteractivo();
    });
  }

  if (campoKilometrosRuta) {
    campoKilometrosRuta.addEventListener('input', pintarMapaInteractivo);
  }
  if (campoDesnivelRuta) {
    campoDesnivelRuta.addEventListener('input', pintarMapaInteractivo);
  }

  if (mapaInteractivoRuta) {
    mapaInteractivoRuta.addEventListener('click', (evento) => {
      const rect = mapaInteractivoRuta.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }
      const x = Math.round(((evento.clientX - rect.left) / rect.width) * 540);
      const y = Math.round(((evento.clientY - rect.top) / rect.height) * 220);

      if (!modoTrazoPersonalizado) {
        puntosTrazadoActual = [{ x, y }];
        modoTrazoPersonalizado = true;
      } else {
        puntosTrazadoActual.push({ x, y });
      }

      if (puntosTrazadoActual.length >= 2 && campoKilometrosRuta) {
        let distanciaPx = 0;
        for (let i = 1; i < puntosTrazadoActual.length; i += 1) {
          const dx = puntosTrazadoActual[i].x - puntosTrazadoActual[i - 1].x;
          const dy = puntosTrazadoActual[i].y - puntosTrazadoActual[i - 1].y;
          distanciaPx += Math.hypot(dx, dy);
        }
        const kmCalculados = Math.max(10, Math.min(340, Math.round(distanciaPx * 0.22)));
        campoKilometrosRuta.value = String(kmCalculados);
      }
      pintarMapaInteractivo();
    });
  }

  if (botonReiniciarTrazado) {
    botonReiniciarTrazado.addEventListener('click', () => {
      const zona = campoZonaMapa ? campoZonaMapa.value : 'alpes-innsbruck';
      const info = ZONAS_MAPA_DISPONIBLES[zona] || ZONAS_MAPA_DISPONIBLES['alpes-innsbruck'];
      puntosTrazadoActual = [...info.puntos];
      modoTrazoPersonalizado = false;
      if (campoKilometrosRuta) {
        campoKilometrosRuta.value = String(info.kmRecomendados);
      }
      if (campoDesnivelRuta) {
        campoDesnivelRuta.value = String(info.desnivel);
      }
      pintarMapaInteractivo();
    });
  }

  /**
   * Muestra un aviso inmediato justo encima del botón de publicar quedada además del aviso global.
   * @param {string} mensaje
   * @param {'success' | 'danger'} tipo
   */
  function mostrarAvisoLocalQuedada(mensaje, tipo) {
    if (!avisoQuedadaLocal) {
      return;
    }
    avisoQuedadaLocal.replaceChildren();
    const div = document.createElement('div');
    div.className = `alert alert-${tipo} py-2 px-3 small fw-semibold mb-2`;
    div.textContent = mensaje;
    avisoQuedadaLocal.append(div);
  }

  if (formularioQuedada) {
    formularioQuedada.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const sociosDisponibles = leerSociosDisponibles();
      const socioAutor = sociosDisponibles.find((s) => s.id === campoSocioRuta?.value);

      if (!socioAutor) {
        const msg = 'Selecciona un socio ciclista válido antes de diseñar la ruta.';
        mostrarAvisoLocalQuedada(msg, 'danger');
        emitirAviso(formularioQuedada, msg, 'error');
        return;
      }

      const claveZona = campoZonaMapa?.value || 'alpes-innsbruck';
      const infoZona =
        ZONAS_MAPA_DISPONIBLES[claveZona] || ZONAS_MAPA_DISPONIBLES['alpes-innsbruck'];
      const tituloEscrito = String(campoTituloRuta?.value || '').trim();
      const tituloFinal = tituloEscrito || `Quedada Oficial · ${infoZona.nombre}`;

      try {
        const rutaCreada = crearRutaQuedada({
          titulo: tituloFinal,
          fecha: campoFechaRuta?.value || '2026-11-29',
          kilometros: Number(campoKilometrosRuta?.value || 0),
          desnivel: Number(campoDesnivelRuta?.value || 0),
          zonaMapa: claveZona,
          puntosMapa: puntosTrazadoActual.length >= 2 ? puntosTrazadoActual : undefined,
          socioId: socioAutor.id,
          socioNombre: socioAutor.nombre,
          socioFederado: Boolean(socioAutor.federado),
          creadorUsuario: sesion.usuario,
        });

        if (campoTituloRuta) {
          campoTituloRuta.value = '';
        }
        actualizarSelectorSociosParaRuta();
        renderizarQuedadas();
        const msgExito = `✅ Quedada «${rutaCreada.titulo}» (${rutaCreada.kilometros} km) publicada con éxito en el club.`;
        mostrarAvisoLocalQuedada(msgExito, 'success');
        emitirAviso(formularioQuedada, msgExito, 'exito');
      } catch (error) {
        const msgError = error instanceof Error ? error.message : 'No se pudo publicar la quedada.';
        mostrarAvisoLocalQuedada(`⚠️ ${msgError}`, 'danger');
        emitirAviso(formularioQuedada, msgError, 'error');
      }
    });
  }

  pintarMapaInteractivo();
  renderizarListado(true);
}

if (
  typeof window !== 'undefined' &&
  document.querySelector('title')?.textContent.includes('Listado')
) {
  inicializarPaginaListado();
}
