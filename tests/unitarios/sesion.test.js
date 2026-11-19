import { describe, it, expect, beforeEach } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  obtenerSesion,
  iniciarSesion,
  cerrarSesion,
  esAdministrador,
  CLAVE_SESION,
} from '../../js/datos/sesion.js';

describe('Módulo de datos: Sesión (con AlmacenFalso)', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  it('devuelve null si no hay sesión iniciada', () => {
    expect(obtenerSesion(almacen)).toBeNull();
    expect(esAdministrador(almacen)).toBe(false);
  });

  it('guarda e inicia la sesión correctamente', () => {
    const sesion = iniciarSesion({ usuario: 'admin_club', rol: 'administrador' }, almacen);

    expect(sesion.usuario).toBe('admin_club');
    expect(sesion.rol).toBe('administrador');
    expect(sesion.horaInicio).toBeDefined();

    const leida = obtenerSesion(almacen);
    expect(leida).toEqual(sesion);
    expect(esAdministrador(almacen)).toBe(true);
  });

  it('cierra la sesión eliminando los datos del almacén', () => {
    iniciarSesion({ usuario: 'socio1', rol: 'usuario' }, almacen);
    expect(obtenerSesion(almacen)).not.toBeNull();

    cerrarSesion(almacen);
    expect(obtenerSesion(almacen)).toBeNull();
    expect(esAdministrador(almacen)).toBe(false);
  });

  it('devuelve null ante datos corruptos en el almacén de sesión', () => {
    almacen.setItem(CLAVE_SESION, '{"invalido": datos_rotos');

    expect(() => obtenerSesion(almacen)).not.toThrow();
    expect(obtenerSesion(almacen)).toBeNull();
    expect(esAdministrador(almacen)).toBe(false);
  });
});
