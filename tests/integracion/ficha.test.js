import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cargarPagina, escribir, salir } from '../pagina.js';
import { iniciarSesion } from '../../js/datos/sesion.js';
import { crearSocio, obtenerSocios } from '../../js/datos/socios.js';
import { inicializarPaginaFicha } from '../../js/paginas/ficha.js';

describe('Integración en Happy-DOM: Formulario de Ficha (ficha.html)', () => {
  const usuarioActivo = 'admin_ficha';

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    cargarPagina('ficha.html');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('controla el campo condicional de licencia (hidden y disabled según casilla federado)', () => {
    iniciarSesion({ usuario: usuarioActivo, rol: 'administrador' });
    const navegacionFalsa = { replace: vi.fn(), search: '' };
    inicializarPaginaFicha(navegacionFalsa);

    const casillaFederado = document.getElementById('campo-federado');
    const contenedorLicencia = document.getElementById('contenedor-licencia');
    const campoLicencia = document.getElementById('campo-licencia');

    expect(contenedorLicencia.hidden).toBe(true);
    expect(campoLicencia.disabled).toBe(true);

    // Marcar casilla activa el campo condicional
    casillaFederado.checked = true;
    casillaFederado.dispatchEvent(new Event('change', { bubbles: true }));
    expect(contenedorLicencia.hidden).toBe(false);
    expect(campoLicencia.disabled).toBe(false);

    escribir(campoLicencia, 'ESP-2026-88');

    // Desmarcar vuelve a ocultarlo, deshabilitarlo y limpiar su valor
    casillaFederado.checked = false;
    casillaFederado.dispatchEvent(new Event('change', { bubbles: true }));
    expect(contenedorLicencia.hidden).toBe(true);
    expect(campoLicencia.disabled).toBe(true);
    expect(campoLicencia.value).toBe('');
  });

  it('gestiona el grupo dinámico de bicicletas entre 0 y 3 elementos con IDs únicos', () => {
    iniciarSesion({ usuario: usuarioActivo, rol: 'usuario' });
    const navegacionFalsa = { replace: vi.fn(), search: '' };
    inicializarPaginaFicha(navegacionFalsa);

    const botonAnadir = document.getElementById('boton-anadir-bici');
    const contenedorBicis = document.getElementById('contenedor-bicicletas');

    expect(contenedorBicis.querySelectorAll('.bloque-bicicleta')).toHaveLength(0);
    expect(botonAnadir.disabled).toBe(false);

    botonAnadir.click();
    botonAnadir.click();
    botonAnadir.click();

    const bloques = contenedorBicis.querySelectorAll('.bloque-bicicleta');
    expect(bloques).toHaveLength(3);
    expect(botonAnadir.disabled).toBe(true);

    // Comprobar que los IDs de las marcas son únicos y están enlazados con sus labels
    const idsMarca = Array.from(contenedorBicis.querySelectorAll('.input-bici-marca')).map(
      (el) => el.id,
    );
    expect(new Set(idsMarca).size).toBe(3);

    // Eliminar una bicicleta reactiva el botón de añadir
    bloques[1].querySelector('.boton-eliminar-bici').click();
    expect(contenedorBicis.querySelectorAll('.bloque-bicicleta')).toHaveLength(2);
    expect(botonAnadir.disabled).toBe(false);
  });

  it('valida en tiempo real al salir del campo (blur en captura) y al corregir (input en burbuja)', () => {
    iniciarSesion({ usuario: usuarioActivo, rol: 'usuario' });
    const navegacionFalsa = { replace: vi.fn(), search: '' };
    inicializarPaginaFicha(navegacionFalsa);

    const campoDni = document.getElementById('campo-dni');
    const errorDni = document.getElementById('error-dni');

    // Salir con DNI vacío muestra error y marca aria-invalid="true"
    salir(campoDni);
    expect(campoDni.getAttribute('aria-invalid')).toBe('true');
    expect(errorDni.textContent).toBe('El DNI es obligatorio.');

    // Escribir letra incorrecta actualiza en tiempo real (en evento input)
    escribir(campoDni, '12345678A');
    expect(campoDni.getAttribute('aria-invalid')).toBe('true');
    expect(errorDni.textContent).toContain('corresponde la «Z»');

    // Escribir la letra correcta limpia el error inmediatamente
    escribir(campoDni, '12345678Z');
    expect(campoDni.getAttribute('aria-invalid')).toBe('false');
    expect(errorDni.textContent).toBe('');
  });

  it('crea un socio nuevo leyendo con FormData y permite editarlo mediante ?id=...', () => {
    iniciarSesion({ usuario: usuarioActivo, rol: 'administrador' });
    const navegacionAlta = { replace: vi.fn(), search: '' };
    inicializarPaginaFicha(navegacionAlta);

    escribir(document.getElementById('campo-nombre'), 'Laura Montaña');
    escribir(document.getElementById('campo-dni'), '12345678Z');
    escribir(document.getElementById('campo-fecha-nacimiento'), '1994-08-20');
    escribir(document.getElementById('campo-cuota'), '45');

    const casillaFederado = document.getElementById('campo-federado');
    casillaFederado.checked = true;
    casillaFederado.dispatchEvent(new Event('change', { bubbles: true }));
    escribir(document.getElementById('campo-licencia'), 'ESP-LAURA-26');

    document.getElementById('boton-anadir-bici').click();
    escribir(document.querySelector('.input-bici-marca'), 'Specialized');
    escribir(document.querySelector('.input-bici-modelo'), 'Epic EVO');

    document.getElementById('formulario-ficha').requestSubmit();

    const creados = obtenerSocios(usuarioActivo);
    expect(creados).toHaveLength(1);
    expect(creados[0].nombre).toBe('Laura Montaña');
    expect(creados[0].licencia).toBe('ESP-LAURA-26');
    expect(creados[0].bicicletas).toEqual([
      { marca: 'Specialized', modelo: 'Epic EVO', disciplina: 'Montaña (MTB)' },
    ]);
    expect(navegacionAlta.replace).toHaveBeenCalledWith('listado.html');

    // Ahora probar modo edición con ?id=<id>
    cargarPagina('ficha.html');
    const navegacionEdicion = { replace: vi.fn(), search: `?id=${creados[0].id}` };
    inicializarPaginaFicha(navegacionEdicion);

    expect(document.getElementById('titulo-ficha').textContent).toBe('Editar Ficha de Socio');
    expect(document.getElementById('campo-nombre').value).toBe('Laura Montaña');
    expect(document.querySelectorAll('.bloque-bicicleta')).toHaveLength(1);

    escribir(document.getElementById('campo-nombre'), 'Laura Montaña Pro');
    document.getElementById('formulario-ficha').requestSubmit();

    const actualizados = obtenerSocios(usuarioActivo);
    expect(actualizados[0].nombre).toBe('Laura Montaña Pro');
    expect(navegacionEdicion.replace).toHaveBeenCalledWith('listado.html');
  });

  it('redirige a listado.html si se intenta editar un ID inexistente', () => {
    iniciarSesion({ usuario: usuarioActivo, rol: 'administrador' });
    crearSocio(usuarioActivo, { nombre: 'Socio Uno', dni: '00000000T' });
    const navegacionFalsa = { replace: vi.fn(), search: '?id=id-inexistente' };

    inicializarPaginaFicha(navegacionFalsa);
    expect(navegacionFalsa.replace).toHaveBeenCalledWith('listado.html');
  });
});
