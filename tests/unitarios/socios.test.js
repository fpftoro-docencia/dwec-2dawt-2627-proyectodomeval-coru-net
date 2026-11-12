import { describe, it, expect, beforeEach } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  obtenerClaveSocios,
  generarIdSocio,
  normalizarBicicletas,
  obtenerSocios,
  obtenerSocioPorId,
  crearSocio,
  actualizarSocio,
  eliminarSocio,
  normalizarTextoBusqueda,
  filtrarSocios,
} from '../../js/datos/socios.js';

describe('Módulo de datos: Socios Ciclistas CRUD (con AlmacenFalso)', () => {
  let almacen;
  const usuarioActivo = 'carlos_mtb';

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  it('construye la clave por usuario normalizada en minúsculas', () => {
    expect(obtenerClaveSocios('Carlos_MTB')).toBe('socios_carlos_mtb');
    expect(obtenerClaveSocios('  Admin ')).toBe('socios_admin');
    expect(obtenerClaveSocios('')).toBe('socios_anonimo');
  });

  it('genera identificadores únicos no vacíos', () => {
    const id1 = generarIdSocio();
    const id2 = generarIdSocio();
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(5);
    expect(id1).not.toBe(id2);
  });

  it('al principio la lista de socios del usuario está vacía', () => {
    expect(obtenerSocios(usuarioActivo, almacen)).toEqual([]);
  });

  it('crea un socio ciclista normalizando sus campos y limitando bicicletas a un máximo de 3', () => {
    const nuevo = crearSocio(
      usuarioActivo,
      {
        nombre: '  Álvaro Valero  ',
        dni: ' 12345678z ',
        fechaNacimiento: '1992-05-14',
        categoria: 'Élite',
        cuota: '45',
        federado: true,
        licencia: ' esp-2026-9988 ',
        bicicletas: [
          { marca: ' Specialized ', modelo: ' S-Works Epic 8 ', disciplina: 'Montaña (MTB)' },
          { marca: 'Tarmac', modelo: 'SL8', disciplina: 'Carretera' },
          { marca: 'Diverge', modelo: 'STR', disciplina: 'Gravel' },
          { marca: 'Extra', modelo: 'Ignorada', disciplina: 'MTB' },
        ],
      },
      almacen,
      () => 'id-fijo-1',
    );

    expect(nuevo.id).toBe('id-fijo-1');
    expect(nuevo.nombre).toBe('Álvaro Valero');
    expect(nuevo.dni).toBe('12345678Z');
    expect(nuevo.categoria).toBe('Élite');
    expect(nuevo.cuota).toBe(45);
    expect(nuevo.federado).toBe(true);
    expect(nuevo.licencia).toBe('ESP-2026-9988');
    expect(nuevo.bicicletas).toHaveLength(3);
    expect(nuevo.bicicletas[0]).toEqual({
      marca: 'Specialized',
      modelo: 'S-Works Epic 8',
      disciplina: 'Montaña (MTB)',
    });

    const guardados = obtenerSocios(usuarioActivo, almacen);
    expect(guardados).toHaveLength(1);
    expect(obtenerSocioPorId(usuarioActivo, 'id-fijo-1', almacen)).toEqual(nuevo);
    expect(obtenerSocioPorId(usuarioActivo, '', almacen)).toBeNull();
    expect(obtenerSocioPorId(usuarioActivo, 'inexistente', almacen)).toBeNull();
  });

  it('limpia la licencia federativa si el socio no está federado y asigna categoría por defecto si no es válida', () => {
    const socioNoFederado = crearSocio(
      usuarioActivo,
      {
        nombre: 'Lucía Gómez',
        dni: '00000000T',
        fechaNacimiento: '1998-11-20',
        categoria: 'CategoríaInventada',
        cuota: -10,
        federado: false,
        licencia: 'LIC-QUE-NO-DEBE-GUARDARSE',
        bicicletas: null,
      },
      almacen,
    );

    expect(socioNoFederado.federado).toBe(false);
    expect(socioNoFederado.licencia).toBe('');
    expect(socioNoFederado.categoria).toBe('Cicloturista');
    expect(socioNoFederado.cuota).toBe(0);
    expect(socioNoFederado.bicicletas).toEqual([]);
  });

  it('mantiene aislados los socios de distintos usuarios en localStorage', () => {
    crearSocio('usuario_a', { nombre: 'Socio A', dni: '12345678Z' }, almacen);
    crearSocio('usuario_b', { nombre: 'Socio B', dni: '00000000T' }, almacen);

    expect(obtenerSocios('usuario_a', almacen)).toHaveLength(1);
    expect(obtenerSocios('usuario_a', almacen)[0].nombre).toBe('Socio A');
    expect(obtenerSocios('usuario_b', almacen)).toHaveLength(1);
    expect(obtenerSocios('usuario_b', almacen)[0].nombre).toBe('Socio B');
  });

  it('impide crear un socio sin nombre, sin DNI o con un DNI duplicado para el mismo usuario', () => {
    expect(() => crearSocio(usuarioActivo, { nombre: '   ', dni: '12345678Z' }, almacen)).toThrow(
      /nombre completo.*obligatorio/i,
    );
    expect(() => crearSocio(usuarioActivo, { nombre: 'Pedro', dni: '   ' }, almacen)).toThrow(
      /DNI.*obligatorio/i,
    );

    crearSocio(usuarioActivo, { nombre: 'Pedro', dni: '12345678Z' }, almacen);
    expect(() =>
      crearSocio(usuarioActivo, { nombre: 'Otro Pedro', dni: '12345678z' }, almacen),
    ).toThrow(/Ya existe un socio registrado con el DNI/);
  });

  it('actualiza correctamente un socio existente y valida errores al editar', () => {
    const s1 = crearSocio(
      usuarioActivo,
      {
        nombre: 'Elena Ruiz',
        dni: '12345678Z',
        fechaNacimiento: '1988-03-10',
        categoria: 'Máster 30',
        cuota: 30,
        federado: true,
        licencia: 'FED-100',
      },
      almacen,
    );
    const s2 = crearSocio(
      usuarioActivo,
      {
        nombre: 'Marcos Díaz',
        dni: '00000000T',
      },
      almacen,
    );

    const actualizado = actualizarSocio(
      usuarioActivo,
      s1.id,
      {
        nombre: 'Elena Ruiz Modificada',
        categoria: 'Máster 40',
        cuota: 50,
        federado: false,
        bicicletas: [{ marca: 'Specialized', modelo: 'Epic', disciplina: '' }],
      },
      almacen,
    );

    expect(actualizado.nombre).toBe('Elena Ruiz Modificada');
    expect(actualizado.categoria).toBe('Máster 40');
    expect(actualizado.cuota).toBe(50);
    expect(actualizado.federado).toBe(false);
    expect(actualizado.licencia).toBe('');
    expect(actualizado.bicicletas[0].disciplina).toBe('Montaña (MTB)');

    // Intentar usar el DNI de otro socio debe lanzar error
    expect(() => actualizarSocio(usuarioActivo, s1.id, { dni: s2.dni }, almacen)).toThrow(
      /Ya existe otro socio/,
    );

    // Intentar actualizar un ID inexistente o vaciar nombre/DNI debe fallar
    expect(() => actualizarSocio(usuarioActivo, 'id-falso', { nombre: 'X' }, almacen)).toThrow(
      /No se encontró/,
    );
    expect(() => actualizarSocio(usuarioActivo, s1.id, { nombre: '  ' }, almacen)).toThrow(
      /nombre completo.*obligatorio/i,
    );
    expect(() => actualizarSocio(usuarioActivo, s1.id, { dni: '  ' }, almacen)).toThrow(
      /DNI.*obligatorio/i,
    );
  });

  it('elimina un socio por su ID y devuelve false si no existe', () => {
    const socio = crearSocio(usuarioActivo, { nombre: 'Socio Borrar', dni: '12345678Z' }, almacen);

    expect(eliminarSocio(usuarioActivo, 'id-no-existe', almacen)).toBe(false);
    expect(eliminarSocio(usuarioActivo, socio.id, almacen)).toBe(true);
    expect(obtenerSocios(usuarioActivo, almacen)).toHaveLength(0);
  });

  it('filtra socios ignorando mayúsculas y tildes en nombre, categoría, DNI y bicicletas', () => {
    const lista = [
      crearSocio(
        usuarioActivo,
        {
          nombre: 'Álvaro Méndez',
          dni: '12345678Z',
          categoria: 'Élite',
          bicicletas: [
            { marca: 'Specialized', modelo: 'Stumpjumper', disciplina: 'Montaña (MTB)' },
          ],
        },
        almacen,
      ),
      crearSocio(
        usuarioActivo,
        {
          nombre: 'Sofía Castaño',
          dni: '00000000T',
          categoria: 'Máster 30',
          bicicletas: [{ marca: 'Orbea', modelo: 'Orca', disciplina: 'Carretera' }],
        },
        almacen,
      ),
    ];

    expect(normalizarTextoBusqueda('  Álvaro ÉLITE  ')).toBe('alvaro elite');
    expect(filtrarSocios(lista, '')).toHaveLength(2);
    expect(filtrarSocios(lista, 'alvaro')).toHaveLength(1);
    expect(filtrarSocios(lista, 'MENDEZ')).toHaveLength(1);
    expect(filtrarSocios(lista, 'master')).toHaveLength(1);
    expect(filtrarSocios(lista, 'stumpjumper')).toHaveLength(1);
    expect(filtrarSocios(lista, 'inexistente')).toHaveLength(0);
    expect(filtrarSocios(null, 'algo')).toEqual([]);
  });

  it('no falla si el contenido en localStorage está corrupto o no es un array', () => {
    const clave = obtenerClaveSocios(usuarioActivo);
    almacen.setItem(clave, '{ json invalido ;;;');
    expect(() => obtenerSocios(usuarioActivo, almacen)).not.toThrow();
    expect(obtenerSocios(usuarioActivo, almacen)).toEqual([]);

    almacen.setItem(clave, JSON.stringify({ noEsArray: true }));
    expect(obtenerSocios(usuarioActivo, almacen)).toEqual([]);

    almacen.setItem(
      clave,
      JSON.stringify([null, { invalido: true }, { id: '1', nombre: 'Socio Válido' }]),
    );
    expect(obtenerSocios(usuarioActivo, almacen)).toEqual([{ id: '1', nombre: 'Socio Válido' }]);
    expect(normalizarBicicletas([{ marca: '', modelo: '' }, null])).toEqual([]);
  });
});
