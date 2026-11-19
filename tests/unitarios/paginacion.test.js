import { describe, it, expect } from 'vitest';
import {
  paginar,
  extraerPaginaDeParametros,
  construirQueryConPagina,
  ELEMENTOS_POR_PAGINA_DEFECTO,
} from '../../js/logica/paginacion.js';

describe('Módulo de lógica pura: Paginación y sincronización de query URL', () => {
  const coleccionDoce = Array.from({ length: 12 }, (_, i) => `Socio-${i + 1}`);

  it('divide correctamente los elementos en páginas según el tamaño indicado sin mutar el array original', () => {
    const copiaOriginal = [...coleccionDoce];
    const pagina1 = paginar(coleccionDoce, 1, 5);

    expect(pagina1).toEqual({
      elementos: ['Socio-1', 'Socio-2', 'Socio-3', 'Socio-4', 'Socio-5'],
      paginaActual: 1,
      totalPaginas: 3,
      totalElementos: 12,
      porPagina: 5,
      tieneAnterior: false,
      tieneSiguiente: true,
    });

    const pagina2 = paginar(coleccionDoce, 2, 5);
    expect(pagina2.elementos).toEqual(['Socio-6', 'Socio-7', 'Socio-8', 'Socio-9', 'Socio-10']);
    expect(pagina2.paginaActual).toBe(2);
    expect(pagina2.tieneAnterior).toBe(true);
    expect(pagina2.tieneSiguiente).toBe(true);

    const pagina3 = paginar(coleccionDoce, 3, 5);
    expect(pagina3.elementos).toEqual(['Socio-11', 'Socio-12']);
    expect(pagina3.paginaActual).toBe(3);
    expect(pagina3.tieneAnterior).toBe(true);
    expect(pagina3.tieneSiguiente).toBe(false);

    // Verifica inmutabilidad del array de entrada
    expect(coleccionDoce).toEqual(copiaOriginal);
  });

  it.each([
    { solicitada: 0, esperada: 1, descripcion: 'cero se corrige a página 1' },
    { solicitada: -5, esperada: 1, descripcion: 'negativa se corrige a página 1' },
    { solicitada: 'abc', esperada: 1, descripcion: 'texto no numérico se corrige a página 1' },
    { solicitada: null, esperada: 1, descripcion: 'null se corrige a página 1' },
    { solicitada: 99, esperada: 3, descripcion: 'mayor que el máximo se corrige a última página' },
    { solicitada: '2', esperada: 2, descripcion: 'cadena numérica válida se convierte a entero' },
  ])('corrige páginas fuera de rango o no válidas ($descripcion)', ({ solicitada, esperada }) => {
    const resultado = paginar(coleccionDoce, solicitada, 5);
    expect(resultado.paginaActual).toBe(esperada);
  });

  it('maneja listas vacías o entradas no válidas devolviendo 1 página total y 0 elementos', () => {
    const vacio = paginar([], 4, 5);
    expect(vacio).toEqual({
      elementos: [],
      paginaActual: 1,
      totalPaginas: 1,
      totalElementos: 0,
      porPagina: 5,
      tieneAnterior: false,
      tieneSiguiente: false,
    });

    const entradaNula = paginar(null, 1, 0);
    expect(entradaNula.elementos).toEqual([]);
    expect(entradaNula.porPagina).toBe(ELEMENTOS_POR_PAGINA_DEFECTO);
  });

  it.each([
    { query: '?pagina=3', esperado: 3 },
    { query: 'pagina=7&filtro=mtb', esperado: 7 },
    { query: '?pagina=0', esperado: 1 },
    { query: '?pagina=-4', esperado: 1 },
    { query: '?pagina=invalido', esperado: 1 },
    { query: '', esperado: 1 },
    { query: undefined, esperado: 1 },
  ])('extraerPaginaDeParametros("$query") devuelve $esperado', ({ query, esperado }) => {
    expect(extraerPaginaDeParametros(query)).toBe(esperado);
  });

  it('construye la query string sincronizando el parámetro pagina y conservando otros parámetros', () => {
    expect(construirQueryConPagina('', 2)).toBe('?pagina=2');
    expect(construirQueryConPagina('?pagina=1', 4)).toBe('?pagina=4');
    expect(construirQueryConPagina('?categoria=elite&pagina=1', 3)).toBe(
      '?categoria=elite&pagina=3',
    );
    expect(construirQueryConPagina('?pagina=2', -1)).toBe('?pagina=1');
  });
});
