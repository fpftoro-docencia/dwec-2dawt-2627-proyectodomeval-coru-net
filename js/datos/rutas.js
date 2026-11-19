/**
 * @fileoverview Gestión de Quedadas para Rutas Ciclistas con mapa, kilómetros y reglas de negocio:
 * - Los socios no federados solo pueden diseñar 1 ruta como máximo (MAX_RUTAS_NO_FEDERADO = 1).
 * - Los socios federados pueden diseñar múltiples rutas sin límite.
 * - El administrador puede ver y gestionar todas las rutas del club.
 * @module datos/rutas
 */

import { leerJSON, guardarJSON } from './almacen.js';
import { normalizarTextoBusqueda } from './socios.js';

export const CLAVE_RUTAS_QUEDADAS = 'club_rutas_quedadas';

export const MAX_RUTAS_NO_FEDERADO = 1;

/**
 * Recorridos cartográficos predefinidos con trazado SVG y altimetría.
 */
export const ZONAS_MAPA_DISPONIBLES = {
  'alpes-innsbruck': {
    nombre: 'Innsbruck · Paso del Brenner (Alpes)',
    kmRecomendados: 92,
    desnivel: 2150,
    dificultad: 'Reina',
    puntos: [
      { x: 40, y: 170 },
      { x: 120, y: 145 },
      { x: 210, y: 95 },
      { x: 310, y: 55 },
      { x: 410, y: 80 },
      { x: 490, y: 40 },
    ],
  },
  'covadonga-asturias': {
    nombre: 'Cangas de Onís · Lagos de Covadonga',
    kmRecomendados: 68,
    desnivel: 1620,
    dificultad: 'Alta',
    puntos: [
      { x: 35, y: 180 },
      { x: 140, y: 165 },
      { x: 240, y: 130 },
      { x: 340, y: 85 },
      { x: 430, y: 45 },
      { x: 500, y: 35 },
    ],
  },
  'tramuntana-mallorca': {
    nombre: 'Sa Calobra · Serra de Tramuntana',
    kmRecomendados: 75,
    desnivel: 1480,
    dificultad: 'Media',
    puntos: [
      { x: 45, y: 60 },
      { x: 150, y: 155 },
      { x: 250, y: 110 },
      { x: 350, y: 75 },
      { x: 460, y: 50 },
    ],
  },
  'guadarrama-madrid': {
    nombre: 'Puerto de Navacerrada · Cotos',
    kmRecomendados: 54,
    desnivel: 980,
    dificultad: 'Suave',
    puntos: [
      { x: 50, y: 165 },
      { x: 170, y: 135 },
      { x: 300, y: 100 },
      { x: 450, y: 70 },
    ],
  },
};

/**
 * @typedef {Object} PuntoMapa
 * @property {number} x Coordenada horizontal en el lienzo del mapa (0-540).
 * @property {number} y Coordenada vertical en el lienzo del mapa (0-220).
 */

/**
 * @typedef {Object} RutaQuedada
 * @property {string} id Identificador único de la quedada.
 * @property {string} titulo Nombre descriptivo de la quedada ciclista.
 * @property {string} fecha Fecha prevista de la salida (YYYY-MM-DD).
 * @property {number} kilometros Distancia total en kilómetros.
 * @property {number} desnivel Desnivel positivo acumulado en metros (m+).
 * @property {string} dificultad Nivel de exigencia ('Suave' | 'Media' | 'Alta' | 'Reina').
 * @property {string} zonaMapa Identificador de la región cartográfica.
 * @property {PuntoMapa[]} puntosMapa Coordenadas del trazado de la ruta en el mapa.
 * @property {string} socioId ID del socio ciclista que diseña la ruta.
 * @property {string} socioNombre Nombre del socio diseñador.
 * @property {boolean} socioFederado Indica si el socio diseñador está federado.
 * @property {string} creadorUsuario Cuenta de usuario que registró la quedada.
 * @property {string[]} participantes Nombres de ciclistas apuntados a la quedada.
 */

/**
 * Genera un identificador único para una quedada de ruta.
 * @returns {string}
 */
export function generarIdRuta() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ruta-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Obtiene todas las quedadas de rutas almacenadas en localStorage.
 * @param {Storage|Object} [almacen=localStorage]
 * @returns {RutaQuedada[]}
 */
export function obtenerRutasQuedadas(almacen = localStorage) {
  const datos = leerJSON(almacen, CLAVE_RUTAS_QUEDADAS, []);
  if (!Array.isArray(datos)) {
    return [];
  }
  return datos.filter(
    (r) =>
      r !== null &&
      typeof r === 'object' &&
      typeof r.id === 'string' &&
      typeof r.titulo === 'string',
  );
}

/**
 * Cuenta cuántas rutas ha diseñado ya un socio ciclista concreto.
 * @param {string} socioId Identificador del socio.
 * @param {Storage|Object} [almacen=localStorage]
 * @returns {number}
 */
export function contarRutasDeSocio(socioId, almacen = localStorage) {
  if (!socioId) {
    return 0;
  }
  const todas = obtenerRutasQuedadas(almacen);
  return todas.filter((r) => r.socioId === socioId).length;
}

/**
 * Evalúa si un socio puede diseñar una nueva ruta según su estado federativo y el rol de la sesión:
 * - Si el socio NO está federado, solo puede diseñar 1 ruta (MAX_RUTAS_NO_FEDERADO = 1).
 * - Si el socio SÍ está federado (o lo crea el administrador para un socio federado), no tiene límite.
 * @param {Object} opciones
 * @param {boolean} opciones.socioFederado Si el socio diseñador tiene licencia federativa activa.
 * @param {number} opciones.rutasExistentesSocio Número de rutas que ya ha diseñado ese socio.
 * @returns {Object}
 * @example
 * verificarPermisoDisenarRuta({ socioFederado: false, rutasExistentesSocio: 1 });
 * // { permitido: false, motivo: 'Los socios no federados solo pueden diseñar 1 ruta como máximo...' }
 */
export function verificarPermisoDisenarRuta({ socioFederado, rutasExistentesSocio }) {
  if (!socioFederado && rutasExistentesSocio >= MAX_RUTAS_NO_FEDERADO) {
    return {
      permitido: false,
      motivo: `Los socios no federados solo pueden diseñar ${MAX_RUTAS_NO_FEDERADO} ruta como máximo. Fedérate en tu ficha para diseñar rutas ilimitadas.`,
    };
  }
  return { permitido: true };
}

/**
 * Crea y guarda una nueva quedada de ruta ciclista validando kilómetros y restricción de federados.
 * @param {Object} datos Datos de la nueva quedada.
 * @param {Storage|Object} [almacen=localStorage]
 * @param {Function} [funcionId=generarIdRuta]
 * @returns {RutaQuedada}
 */
export function crearRutaQuedada(datos, almacen = localStorage, funcionId = generarIdRuta) {
  const tituloLimpio = String(datos?.titulo || '').trim();
  if (tituloLimpio.length < 3) {
    throw new Error('El título de la quedada debe tener al menos 3 caracteres.');
  }

  const km = Number(datos?.kilometros);
  if (!Number.isFinite(km) || km < 5 || km > 350) {
    throw new Error('Los kilómetros de la ruta deben situarse entre 5 km y 350 km.');
  }

  const socioId = String(datos?.socioId || '').trim();
  const socioNombre = String(datos?.socioNombre || '').trim();
  if (!socioId || !socioNombre) {
    throw new Error('Debes seleccionar el socio ciclista que diseña la ruta.');
  }

  const socioFederado = Boolean(datos?.socioFederado);
  const rutasExistentesSocio = contarRutasDeSocio(socioId, almacen);
  const permiso = verificarPermisoDisenarRuta({ socioFederado, rutasExistentesSocio });

  if (!permiso.permitido) {
    throw new Error(permiso.motivo);
  }

  const zonaClave = ZONAS_MAPA_DISPONIBLES[datos?.zonaMapa] ? datos.zonaMapa : 'alpes-innsbruck';
  const infoZona = ZONAS_MAPA_DISPONIBLES[zonaClave];

  const puntosPersonalizados =
    Array.isArray(datos?.puntosMapa) && datos.puntosMapa.length >= 2
      ? datos.puntosMapa.map((p) => ({ x: Number(p.x) || 0, y: Number(p.y) || 0 }))
      : infoZona.puntos;

  const desnivelNum = Number(datos?.desnivel);
  const desnivelFinal =
    Number.isFinite(desnivelNum) && desnivelNum >= 0 ? desnivelNum : infoZona.desnivel;

  /** @type {RutaQuedada} */
  const nuevaRuta = {
    id: funcionId(),
    titulo: tituloLimpio,
    fecha: String(datos?.fecha || '2026-11-29').trim(),
    kilometros: Math.round(km * 10) / 10,
    desnivel: desnivelFinal,
    dificultad: String(datos?.dificultad || infoZona.dificultad),
    zonaMapa: zonaClave,
    puntosMapa: puntosPersonalizados,
    socioId,
    socioNombre,
    socioFederado,
    creadorUsuario: String(datos?.creadorUsuario || 'anonimo')
      .trim()
      .toLowerCase(),
    participantes: [socioNombre],
  };

  const todas = obtenerRutasQuedadas(almacen);
  todas.push(nuevaRuta);
  guardarJSON(almacen, CLAVE_RUTAS_QUEDADAS, todas);

  return nuevaRuta;
}

/**
 * Apunta o desapunta a un participante en una quedada existente.
 * @param {string} rutaId ID de la ruta.
 * @param {string} nombreParticipante Nombre del ciclista.
 * @param {Storage|Object} [almacen=localStorage]
 * @returns {RutaQuedada|null}
 */
export function alternarInscripcionRuta(rutaId, nombreParticipante, almacen = localStorage) {
  const limpio = String(nombreParticipante || '').trim();
  if (!rutaId || !limpio) {
    return null;
  }

  const todas = obtenerRutasQuedadas(almacen);
  const indice = todas.findIndex((r) => r.id === rutaId);
  if (indice === -1) {
    return null;
  }

  const actual = todas[indice];
  const lista = Array.isArray(actual.participantes) ? [...actual.participantes] : [];
  const pos = lista.findIndex(
    (p) => normalizarTextoBusqueda(p) === normalizarTextoBusqueda(limpio),
  );

  if (pos >= 0) {
    lista.splice(pos, 1);
  } else {
    lista.push(limpio);
  }

  todas[indice] = { ...actual, participantes: lista };
  guardarJSON(almacen, CLAVE_RUTAS_QUEDADAS, todas);
  return todas[indice];
}

/**
 * Elimina una quedada de ruta por su identificador.
 * El administrador puede borrar cualquiera; un usuario normal solo las creadas desde su cuenta.
 * @param {string} rutaId Identificador de la ruta.
 * @param {string} usuarioSolicitante Usuario con sesión activa.
 * @param {string} [rolSolicitante='usuario'] Rol de la sesión activa.
 * @param {Storage|Object} [almacen=localStorage]
 * @returns {boolean}
 */
export function eliminarRutaQuedada(
  rutaId,
  usuarioSolicitante,
  rolSolicitante = 'usuario',
  almacen = localStorage,
) {
  const todas = obtenerRutasQuedadas(almacen);
  const objetivo = todas.find((r) => r.id === rutaId);
  if (!objetivo) {
    return false;
  }

  const usuarioLimpio = String(usuarioSolicitante || '')
    .trim()
    .toLowerCase();

  if (rolSolicitante !== 'administrador' && objetivo.creadorUsuario !== usuarioLimpio) {
    throw new Error('Solo el creador de la quedada o un administrador pueden eliminar esta ruta.');
  }

  const restantes = todas.filter((r) => r.id !== rutaId);
  guardarJSON(almacen, CLAVE_RUTAS_QUEDADAS, restantes);
  return true;
}
