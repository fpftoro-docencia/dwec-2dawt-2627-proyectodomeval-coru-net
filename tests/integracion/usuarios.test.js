import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cargarPagina, escribir } from '../pagina.js';
import { iniciarSesion } from '../../js/datos/sesion.js';
import { registrarUsuario, obtenerUsuarios } from '../../js/datos/usuarios.js';
import {
  inicializarPaginaUsuarios,
  TIEMPO_DEBOUNCE_USUARIOS_MS,
} from '../../js/paginas/usuarios.js';

describe('Integración en Happy-DOM: Zona de Administración (usuarios.html)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    cargarPagina('usuarios.html');
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('impide el acceso a usuarios sin rol administrador redirigiendo a listado.html con location.replace', () => {
    iniciarSesion({ usuario: 'socio_normal', rol: 'usuario' });
    const navegacionFalsa = { replace: vi.fn(), search: '' };

    inicializarPaginaUsuarios(navegacionFalsa);
    expect(navegacionFalsa.replace).toHaveBeenCalledExactlyOnceWith('listado.html');
  });

  it('muestra la lista de usuarios, bloquea el botón del administrador activo con explicación y permite cambiar el rol de otros usuarios', async () => {
    await registrarUsuario({
      usuario: 'admin_club',
      correo: 'admin@pedal.es',
      clave: 'ClaveAdmin1',
    });
    await registrarUsuario({
      usuario: 'ciclista_2',
      correo: 'c2@pedal.es',
      clave: 'ClaveSocio2',
    });

    iniciarSesion({ usuario: 'admin_club', rol: 'administrador' });
    const navegacionFalsa = { replace: vi.fn(), pathname: '/usuarios.html', search: '' };

    inicializarPaginaUsuarios(navegacionFalsa);

    const filas = document.querySelectorAll('#cuerpo-usuarios .fila-usuario');
    expect(filas).toHaveLength(2);

    // Primera fila: admin_club (activo) -> botón deshabilitado con explicación visible
    const botonAdminPropio = filas[0].querySelector('.boton-cambiar-rol');
    const explicacionPropia = filas[0].querySelector('.celda-usuario-explicacion');
    expect(botonAdminPropio.disabled).toBe(true);
    expect(explicacionPropia.hidden).toBe(false);
    expect(explicacionPropia.textContent).toContain('no puedes quitarte tu propio rol');

    // Segunda fila: ciclista_2 -> botón activo que cambia su rol a administrador
    const botonOtroUsuario = filas[1].querySelector('.boton-cambiar-rol');
    expect(botonOtroUsuario.disabled).toBe(false);
    botonOtroUsuario.click();

    const actualizados = obtenerUsuarios();
    expect(actualizados[1].rol).toBe('administrador');
    expect(document.getElementById('contenedor-avisos').textContent).toContain('ciclista_2');
  });

  it('filtra usuarios con debounce en el buscador', async () => {
    vi.useFakeTimers();
    await registrarUsuario({
      usuario: 'admin_club',
      correo: 'admin@pedal.es',
      clave: 'ClaveAdmin1',
    });
    await registrarUsuario({
      usuario: 'elena_mtb',
      correo: 'elena@pedal.es',
      clave: 'ClaveSocio2',
    });

    iniciarSesion({ usuario: 'admin_club', rol: 'administrador' });
    inicializarPaginaUsuarios({ replace: vi.fn(), pathname: '/usuarios.html', search: '' });

    escribir(document.getElementById('campo-busqueda-usuarios'), 'elena');
    vi.advanceTimersByTime(TIEMPO_DEBOUNCE_USUARIOS_MS + 10);

    const filas = document.querySelectorAll('#cuerpo-usuarios .fila-usuario');
    expect(filas).toHaveLength(1);
    expect(filas[0].querySelector('.celda-usuario-nombre').textContent).toBe('elena_mtb');
  });
});
