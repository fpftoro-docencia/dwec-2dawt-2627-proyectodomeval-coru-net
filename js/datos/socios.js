/**
 * @fileoverview Gestión CRUD de socios ciclistas en localStorage por usuario (socios_<usuario>).
 * Incluye normalización de datos, control de duplicados por DNI, filtrado insensible a tildes/mayúsculas
 * y protección frente a datos corruptos en el almacenamiento.
 * @module datos/socios
 */

import { leerJSON, guardarJSON } from './almacen.js';

export const PREFIJO_CLAVE_SOCIOS = 'socios_';

export const CATEGORIAS_VALIDAS = ['Sub-23', 'Élite', 'Máster 30', 'Máster 40', 'Cicloturista'];

export const MAX_BICICLETAS = 3;

/**
 * @typedef {Object} Bicicleta
 * @property {string} marca Marca del cuadro o fabricante (ej. Specialized).
 * @property {string} modelo Modelo específico (ej. S-Works Epic 8).
 * @property {string} disciplina Modalidad principal (ej. Montaña (MTB), Carretera, Gravel).
 */

/**
 * @typedef {Object} SocioCiclista
 * @property {string} id Identificador único del registro.
 * @property {string} nombre Nombre y apellidos del socio ciclista.
 * @property {string} dni Documento identificativo normalizado en mayúsculas.
 * @property {string} fechaNacimiento Fecha de nacimiento en formato ISO (YYYY-MM-DD).
 * @property {'Sub-23' | 'Élite' | 'Máster 30' | 'Máster 40' | 'Cicloturista'} categoria Categoría deportiva.
 * @property {number} cuota Cuota mensual en euros.
 * @property {boolean} federado Indica si posee licencia federativa en vigor.
 * @property {string} licencia Código de licencia federativa (vacío si no está federado).
 * @property {Bicicleta[]} bicicletas Lista de bicicletas registradas (entre 0 y 3).
 * @property {string} fechaAlta Fecha ISO de alta en el sistema.
 */

/**
 * Construye la clave de almacenamiento en localStorage para el usuario activo.
 * @param {string} usuario Nombre del usuario propietario de los registros.
 * @returns {string} Clave formateada `socios_<usuario>`.
 * @example
 * obtenerClaveSocios('AdminClub'); // 'socios_adminclub'
 */
export function obtenerClaveSocios(usuario) {
  const limpio = String(usuario || 'anonimo')
    .trim()
    .toLowerCase();
  return `${PREFIJO_CLAVE_SOCIOS}${limpio || 'anonimo'}`;
}

/**
 * Genera un identificador único para cada socio ciclista.
 * @returns {string}
 */
export function generarIdSocio() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `socio-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Normaliza y limita la colección de bicicletas asociadas a un socio (máximo 3).
 * @param {Array<Object>|*} listaBicicletas
 * @returns {Bicicleta[]}
 */
export function normalizarBicicletas(listaBicicletas) {
  if (!Array.isArray(listaBicicletas)) {
    return [];
  }

  return listaBicicletas
    .filter((b) => b && typeof b === 'object')
    .map((b) => ({
      marca: String(b.marca || '').trim(),
      modelo: String(b.modelo || '').trim(),
      disciplina: String(b.disciplina || 'Montaña (MTB)').trim() || 'Montaña (MTB)',
    }))
    .filter((b) => b.marca !== '' || b.modelo !== '')
    .slice(0, MAX_BICICLETAS);
}

/**
 * Obtiene todos los socios ciclistas pertenecientes a un usuario.
 * Si el almacenamiento contiene JSON corrupto o una estructura no válida, devuelve `[]`.
 * @param {string} usuario Nombre de usuario activo.
 * @param {Storage|Object} [almacen=localStorage]
 * @returns {SocioCiclista[]}
 */
export function obtenerSocios(usuario, almacen = localStorage) {
  const clave = obtenerClaveSocios(usuario);
  const datos = leerJSON(almacen, clave, []);

  if (!Array.isArray(datos)) {
    return [];
  }

  return datos.filter(
    (item) =>
      item !== null &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.nombre === 'string',
  );
}

/**
 * Busca un socio ciclista por su identificador único.
 * @param {string} usuario Nombre de usuario activo.
 * @param {string} id Identificador del socio.
 * @param {Storage|Object} [almacen=localStorage]
 * @returns {SocioCiclista|null}
 */
export function obtenerSocioPorId(usuario, id, almacen = localStorage) {
  if (!id || typeof id !== 'string') {
    return null;
  }
  const socios = obtenerSocios(usuario, almacen);
  return socios.find((s) => s.id === id) || null;
}

/**
 * Crea y persiste un nuevo socio ciclista bajo la clave del usuario indicado.
 * @param {string} usuario Nombre de usuario propietario.
 * @param {Object} datos Campos del socio ciclista.
 * @param {Storage|Object} [almacen=localStorage]
 * @param {Function} [funcionId=generarIdSocio]
 * @returns {SocioCiclista} El socio creado y normalizado.
 */
export function crearSocio(usuario, datos, almacen = localStorage, funcionId = generarIdSocio) {
  const nombreLimpio = String(datos?.nombre || '').trim();
  const dniLimpio = String(datos?.dni || '')
    .trim()
    .toUpperCase();

  if (!nombreLimpio) {
    throw new Error('El nombre completo del socio ciclista es obligatorio.');
  }
  if (!dniLimpio) {
    throw new Error('El DNI del socio ciclista es obligatorio.');
  }

  const socios = obtenerSocios(usuario, almacen);
  const duplicado = socios.some((s) => s.dni.toUpperCase() === dniLimpio);
  if (duplicado) {
    throw new Error(`Ya existe un socio registrado con el DNI «${dniLimpio}».`);
  }

  const esFederado = Boolean(datos?.federado);
  const cuotaNumerica = Number(datos?.cuota);
  const categoriaNormalizada = CATEGORIAS_VALIDAS.includes(datos?.categoria)
    ? datos.categoria
    : 'Cicloturista';

  /** @type {SocioCiclista} */
  const nuevoSocio = {
    id: funcionId(),
    nombre: nombreLimpio,
    dni: dniLimpio,
    fechaNacimiento: String(datos?.fechaNacimiento || '').trim(),
    categoria: categoriaNormalizada,
    cuota: Number.isFinite(cuotaNumerica) && cuotaNumerica >= 0 ? cuotaNumerica : 0,
    federado: esFederado,
    licencia: esFederado
      ? String(datos?.licencia || '')
          .trim()
          .toUpperCase()
      : '',
    bicicletas: normalizarBicicletas(datos?.bicicletas),
    fechaAlta: datos?.fechaAlta || new Date().toISOString(),
  };

  socios.push(nuevoSocio);
  guardarJSON(almacen, obtenerClaveSocios(usuario), socios);

  return nuevoSocio;
}

/**
 * Actualiza los datos de un socio ciclista existente.
 * @param {string} usuario Nombre de usuario propietario.
 * @param {string} id Identificador del socio a modificar.
 * @param {Object} cambios Nuevos datos del socio.
 * @param {Storage|Object} [almacen=localStorage]
 * @returns {SocioCiclista} El socio actualizado.
 */
export function actualizarSocio(usuario, id, cambios, almacen = localStorage) {
  const socios = obtenerSocios(usuario, almacen);
  const indice = socios.findIndex((s) => s.id === id);

  if (indice === -1) {
    throw new Error(`No se encontró ningún socio ciclista con el identificador «${id}».`);
  }

  const actual = socios[indice];
  const nombreLimpio =
    cambios?.nombre !== undefined ? String(cambios.nombre).trim() : actual.nombre;
  const dniLimpio =
    cambios?.dni !== undefined ? String(cambios.dni).trim().toUpperCase() : actual.dni;

  if (!nombreLimpio) {
    throw new Error('El nombre completo del socio ciclista es obligatorio.');
  }
  if (!dniLimpio) {
    throw new Error('El DNI del socio ciclista es obligatorio.');
  }

  const dniOcupadoPorOtro = socios.some(
    (s, i) => i !== indice && s.dni.toUpperCase() === dniLimpio,
  );
  if (dniOcupadoPorOtro) {
    throw new Error(`Ya existe otro socio registrado con el DNI «${dniLimpio}».`);
  }

  const esFederado = cambios?.federado !== undefined ? Boolean(cambios.federado) : actual.federado;
  const cuotaNumerica = cambios?.cuota !== undefined ? Number(cambios.cuota) : actual.cuota;
  const categoriaNormalizada =
    cambios?.categoria !== undefined && CATEGORIAS_VALIDAS.includes(cambios.categoria)
      ? cambios.categoria
      : actual.categoria;

  /** @type {SocioCiclista} */
  const socioActualizado = {
    ...actual,
    nombre: nombreLimpio,
    dni: dniLimpio,
    fechaNacimiento:
      cambios?.fechaNacimiento !== undefined
        ? String(cambios.fechaNacimiento).trim()
        : actual.fechaNacimiento,
    categoria: categoriaNormalizada,
    cuota: Number.isFinite(cuotaNumerica) && cuotaNumerica >= 0 ? cuotaNumerica : actual.cuota,
    federado: esFederado,
    licencia: esFederado
      ? String(cambios?.licencia !== undefined ? cambios.licencia : actual.licencia)
          .trim()
          .toUpperCase()
      : '',
    bicicletas:
      cambios?.bicicletas !== undefined
        ? normalizarBicicletas(cambios.bicicletas)
        : actual.bicicletas,
  };

  socios[indice] = socioActualizado;
  guardarJSON(almacen, obtenerClaveSocios(usuario), socios);

  return socioActualizado;
}

/**
 * Elimina un socio ciclista por su identificador.
 * @param {string} usuario Nombre de usuario propietario.
 * @param {string} id Identificador del socio a borrar.
 * @param {Storage|Object} [almacen=localStorage]
 * @returns {boolean} `true` si se eliminó el registro, `false` si no existía.
 */
export function eliminarSocio(usuario, id, almacen = localStorage) {
  const socios = obtenerSocios(usuario, almacen);
  const filtrados = socios.filter((s) => s.id !== id);

  if (filtrados.length === socios.length) {
    return false;
  }

  guardarJSON(almacen, obtenerClaveSocios(usuario), filtrados);
  return true;
}

/**
 * Normaliza un texto eliminando tildes/diacríticos y convirtiéndolo a minúsculas
 * para búsquedas insensibles a mayúsculas y acentos.
 * @param {string} texto
 * @returns {string}
 * @example
 * normalizarTextoBusqueda('Máster 30 · Élite'); // 'master 30 · elite'
 */
export function normalizarTextoBusqueda(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Filtra una lista de socios ciclistas por término de búsqueda (ignora mayúsculas y tildes).
 * Busca coincidencias en nombre, DNI, categoría, licencia y marcas/modelos de bicicletas.
 * @param {SocioCiclista[]} socios Lista de socios a filtrar.
 * @param {string} termino Texto buscado.
 * @returns {SocioCiclista[]}
 */
export function filtrarSocios(socios, termino) {
  if (!Array.isArray(socios)) {
    return [];
  }
  const busqueda = normalizarTextoBusqueda(termino);
  if (!busqueda) {
    return [...socios];
  }

  return socios.filter((socio) => {
    const camposTexto = [
      socio.nombre,
      socio.dni,
      socio.categoria,
      socio.licencia,
      ...(Array.isArray(socio.bicicletas)
        ? socio.bicicletas.flatMap((b) => [b.marca, b.modelo, b.disciplina])
        : []),
    ];

    return camposTexto.some((campo) => normalizarTextoBusqueda(campo).includes(busqueda));
  });
}
