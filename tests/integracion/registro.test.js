import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cargarPagina, escribir, salir } from '../pagina.js';
import { inicializarPaginaRegistro } from '../../js/paginas/registro.js';
import { inicializarPaginaLogin } from '../../js/paginas/index.js';

describe('Integración en Happy-DOM: Validación en tiempo real y accesibilidad (registro.html e index.html)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('valida en registro.html al salir del campo (blur en captura), actualiza en input (burbuja) y enfoca el primer error al enviar', () => {
    cargarPagina('registro.html');
    const navegacionFalsa = { replace: vi.fn() };
    inicializarPaginaRegistro(navegacionFalsa);

    const campoUsuario = document.getElementById('campo-usuario');
    const errorUsuario = document.getElementById('error-usuario');

    // Primera validación al salir del campo (blur)
    salir(campoUsuario);
    expect(campoUsuario.getAttribute('aria-invalid')).toBe('true');
    expect(campoUsuario.classList.contains('is-invalid')).toBe(true);
    expect(errorUsuario.textContent).toBe('El nombre de usuario es obligatorio.');

    // Posteriores validaciones en input (fase de burbuja)
    escribir(campoUsuario, 'a');
    expect(errorUsuario.textContent).toBe('Debe tener al menos 3 caracteres.');

    escribir(campoUsuario, 'ciclista_26');
    expect(campoUsuario.getAttribute('aria-invalid')).toBe('false');
    expect(campoUsuario.classList.contains('is-invalid')).toBe(false);

    // Enviar con correo vacío debe avisar y poner el foco en el primer campo erróneo (correo)
    const campoCorreo = document.getElementById('campo-correo');
    const espiaFoco = vi.spyOn(campoCorreo, 'focus');
    document.getElementById('formulario-registro').requestSubmit();

    expect(espiaFoco).toHaveBeenCalledOnce();
    expect(campoCorreo.getAttribute('aria-invalid')).toBe('true');
  });

  it('alterna la visibilidad de la contraseña con el botón ojito en registro.html e index.html', () => {
    cargarPagina('registro.html');
    inicializarPaginaRegistro({ replace: vi.fn() });

    const campoClave = document.getElementById('campo-clave');
    const botonToggle = document.getElementById('boton-toggle-clave');

    expect(campoClave.type).toBe('password');
    expect(botonToggle.getAttribute('aria-pressed')).toBe('false');

    botonToggle.click();
    expect(campoClave.type).toBe('text');
    expect(botonToggle.getAttribute('aria-pressed')).toBe('true');

    // También en index.html
    cargarPagina('index.html');
    inicializarPaginaLogin({ replace: vi.fn() });
    const campoLoginClave = document.getElementById('campo-clave');
    const botonLoginToggle = document.getElementById('boton-toggle-clave');

    salir(campoLoginClave);
    expect(campoLoginClave.getAttribute('aria-invalid')).toBe('true');

    botonLoginToggle.click();
    expect(campoLoginClave.type).toBe('text');
  });
});
