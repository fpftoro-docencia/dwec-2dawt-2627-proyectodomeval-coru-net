/**
 * @fileoverview Funciones puras de paginación y gestión de parámetros de consulta (?pagina=X).
 * Sin efectos secundarios ni acceso directo al DOM (Requisito 15 y 21).
 * @module logica/paginacion
 */

export const ELEMENTOS_POR_PAGINA_DEFECTO = 5;

/**
 * @typedef {Object} ResultadoPaginacion
 * @template T
 * @property {T[]} elementos Subconjunto de elementos correspondientes a la página actual.
 * @property {number} paginaActual Número de página corregido dentro del rango [1, totalPaginas].
 * @property {number} totalPaginas Total de páginas calculadas (mínimo 1).
 * @property {number} totalElementos Cantidad total de elementos en la colección completa.
 * @property {number} porPagina Tamaño de página aplicado.
 * @property {boolean} tieneAnterior Indica si existe una página previa a la actual.
 * @property {boolean} tieneSiguiente Indica si existe una página posterior a la actual.
 */

/**
 * Divide una lista de elementos en páginas y corrige automáticamente números de página fuera de rango.
 * No muta el array de entrada.
 * @template T
 * @param {T[]} lista Colección completa de elementos a paginar.
 * @param {number | string} [pagina=1] Página solicitada (comenzando en 1).
 * @param {number | string} [porPagina=ELEMENTOS_POR_PAGINA_DEFECTO] Elementos por página.
 * @returns {ResultadoPaginacion<T>}
 * @example
 * paginar(['a', 'b', 'c', 'd', 'e', 'f'], 2, 4);
 * // { elementos: ['e', 'f'], paginaActual: 2, totalPaginas: 2, totalElementos: 6, porPagina: 4, tieneAnterior: true, tieneSiguiente: false }
 */
export function paginar(lista, pagina = 1, porPagina = ELEMENTOS_POR_PAGINA_DEFECTO) {
  const listaSegura = Array.isArray(lista) ? lista : [];
  const tamanoConvertido = Number.parseInt(String(porPagina), 10);
  const tamanoPagina =
    Number.isFinite(tamanoConvertido) && tamanoConvertido > 0
      ? tamanoConvertido
      : ELEMENTOS_POR_PAGINA_DEFECTO;

  const totalElementos = listaSegura.length;
  const totalPaginas = Math.max(1, Math.ceil(totalElementos / tamanoPagina));

  const paginaConvertida = Number.parseInt(String(pagina), 10);
  const paginaSolicitada =
    Number.isFinite(paginaConvertida) && paginaConvertida >= 1 ? paginaConvertida : 1;

  const paginaActual = Math.min(Math.max(1, paginaSolicitada), totalPaginas);
  const indiceInicio = (paginaActual - 1) * tamanoPagina;
  const elementos = listaSegura.slice(indiceInicio, indiceInicio + tamanoPagina);

  return {
    elementos,
    paginaActual,
    totalPaginas,
    totalElementos,
    porPagina: tamanoPagina,
    tieneAnterior: paginaActual > 1,
    tieneSiguiente: paginaActual < totalPaginas,
  };
}

/**
 * Extrae y valida el número de página desde una cadena de consulta URL (`?pagina=X`).
 * Si no existe o no es un entero positivo válido, devuelve `1`.
 * @param {string} [cadenaConsulta=''] Cadena `location.search` (ej. `"?pagina=3"`).
 * @returns {number} Número de página entero >= 1.
 * @example
 * extraerPaginaDeParametros('?pagina=4'); // 4
 * extraerPaginaDeParametros('?pagina=-2'); // 1
 */
export function extraerPaginaDeParametros(cadenaConsulta = '') {
  const parametros = new URLSearchParams(String(cadenaConsulta || ''));
  const valor = parametros.get('pagina');
  const numero = Number.parseInt(String(valor || ''), 10);

  if (!Number.isFinite(numero) || numero < 1) {
    return 1;
  }
  return numero;
}

/**
 * Construye una nueva cadena de consulta (`?pagina=X...`) preservando otros parámetros existentes.
 * @param {string} [cadenaConsultaActual=''] Cadena `location.search` actual.
 * @param {number} [pagina=1] Número de página a fijar.
 * @returns {string} Cadena de consulta con prefijo `?` (ej. `"?pagina=2"`).
 * @example
 * construirQueryConPagina('?orden=asc', 3); // '?orden=asc&pagina=3'
 */
export function construirQueryConPagina(cadenaConsultaActual = '', pagina = 1) {
  const parametros = new URLSearchParams(String(cadenaConsultaActual || ''));
  const paginaValida =
    Number.isFinite(Number(pagina)) && Number(pagina) >= 1 ? Math.floor(Number(pagina)) : 1;
  parametros.set('pagina', String(paginaValida));
  return `?${parametros.toString()}`;
}
