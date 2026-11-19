import { describe, it, expect, beforeEach } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  obtenerRutasQuedadas,
  contarRutasDeSocio,
  verificarPermisoDisenarRuta,
  crearRutaQuedada,
  alternarInscripcionRuta,
  eliminarRutaQuedada,
  CLAVE_RUTAS_QUEDADAS,
} from '../../js/datos/rutas.js';

describe('Módulo de Quedadas y Rutas Ciclistas (js/datos/rutas.js)', () => {
  /** @type {AlmacenFalso} */
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  it('devuelve lista vacía cuando no hay rutas o el JSON está corrupto', () => {
    expect(obtenerRutasQuedadas(almacen)).toEqual([]);
    almacen.setItem(CLAVE_RUTAS_QUEDADAS, '{roto');
    expect(obtenerRutasQuedadas(almacen)).toEqual([]);
    almacen.setItem(CLAVE_RUTAS_QUEDADAS, JSON.stringify({ noArray: true }));
    expect(obtenerRutasQuedadas(almacen)).toEqual([]);
  });

  it('permite a un socio NO federado diseñar su primera ruta, pero le impide diseñar una segunda', () => {
    const primera = crearRutaQuedada(
      {
        titulo: 'Salida cicloturista por Guadarrama',
        fecha: '2026-12-01',
        kilometros: 54,
        zonaMapa: 'guadarrama-madrid',
        socioId: 'socio-no-fed-1',
        socioNombre: 'Elena Domínguez',
        socioFederado: false,
        creadorUsuario: 'elena',
      },
      almacen,
      () => 'ruta-1',
    );

    expect(primera.id).toBe('ruta-1');
    expect(primera.kilometros).toBe(54);
    expect(contarRutasDeSocio('socio-no-fed-1', almacen)).toBe(1);
    expect(contarRutasDeSocio('', almacen)).toBe(0);

    const permisoSegunda = verificarPermisoDisenarRuta({
      socioFederado: false,
      rutasExistentesSocio: 1,
    });
    expect(permisoSegunda.permitido).toBe(false);
    expect(permisoSegunda.motivo).toContain('solo pueden diseñar 1 ruta');

    expect(() =>
      crearRutaQuedada(
        {
          titulo: 'Segunda ruta no permitida',
          fecha: '2026-12-08',
          kilometros: 60,
          zonaMapa: 'covadonga-asturias',
          socioId: 'socio-no-fed-1',
          socioNombre: 'Elena Domínguez',
          socioFederado: false,
          creadorUsuario: 'elena',
        },
        almacen,
      ),
    ).toThrow(/solo pueden diseñar 1 ruta/i);
  });

  it('permite a un socio FEDERADO diseñar múltiples rutas sin límite', () => {
    crearRutaQuedada(
      {
        titulo: 'Etapa Reina Alpes 1',
        kilometros: 95,
        zonaMapa: 'alpes-innsbruck',
        socioId: 'socio-fed-1',
        socioNombre: 'Álvaro Valero',
        socioFederado: true,
        creadorUsuario: 'alvaro',
      },
      almacen,
      () => 'ruta-fed-1',
    );

    const segunda = crearRutaQuedada(
      {
        titulo: 'Etapa Lagos de Covadonga 2',
        kilometros: 112.5,
        desnivel: 2400,
        puntosMapa: [
          { x: 20, y: 180 },
          { x: 260, y: 80 },
          { x: 480, y: 40 },
        ],
        zonaMapa: 'covadonga-asturias',
        socioId: 'socio-fed-1',
        socioNombre: 'Álvaro Valero',
        socioFederado: true,
        creadorUsuario: 'alvaro',
      },
      almacen,
      () => 'ruta-fed-2',
    );

    expect(segunda.id).toBe('ruta-fed-2');
    expect(segunda.puntosMapa).toHaveLength(3);
    expect(contarRutasDeSocio('socio-fed-1', almacen)).toBe(2);
  });

  it('valida título, kilómetros (5 a 350 km) y socio diseñador obligatorio', () => {
    expect(() => crearRutaQuedada({ titulo: 'AB', kilometros: 50 }, almacen)).toThrow(/título/i);

    expect(() =>
      crearRutaQuedada(
        { titulo: 'Ruta corta', kilometros: 2, socioId: 's1', socioNombre: 'Ana' },
        almacen,
      ),
    ).toThrow(/kilómetros/i);

    expect(() =>
      crearRutaQuedada(
        { titulo: 'Ruta válida', kilometros: 50, socioId: '', socioNombre: '' },
        almacen,
      ),
    ).toThrow(/seleccionar el socio/i);
  });

  it('permite apuntarse/desapuntarse de una quedada y controla permisos de borrado (admin vs creador)', () => {
    const creada = crearRutaQuedada(
      {
        titulo: 'Quedada Serra de Tramuntana',
        kilometros: 75,
        zonaMapa: 'tramuntana-mallorca',
        socioId: 'socio-1',
        socioNombre: 'Sofía Méndez',
        socioFederado: true,
        creadorUsuario: 'sofia',
      },
      almacen,
    );

    expect(alternarInscripcionRuta('', 'Pedro', almacen)).toBeNull();
    expect(alternarInscripcionRuta('inexistente', 'Pedro', almacen)).toBeNull();

    const conPedro = alternarInscripcionRuta(creada.id, 'Pedro Delgado', almacen);
    expect(conPedro?.participantes).toContain('Pedro Delgado');

    const sinPedro = alternarInscripcionRuta(creada.id, 'pedro delgado', almacen);
    expect(sinPedro?.participantes).not.toContain('Pedro Delgado');

    //Otro usuario normal no puede borrar la ruta de sofia
    expect(() => eliminarRutaQuedada(creada.id, 'otro_usuario', 'usuario', almacen)).toThrow(
      /Solo el creador/i,
    );

    // El administrador SÍ puede borrar cualquier ruta del club
    expect(eliminarRutaQuedada(creada.id, 'admin_jefe', 'administrador', almacen)).toBe(true);
    expect(eliminarRutaQuedada('no-existe', 'admin_jefe', 'administrador', almacen)).toBe(false);
  });
});
