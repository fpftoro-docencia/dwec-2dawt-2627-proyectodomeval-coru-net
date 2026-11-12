import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cargarPagina, escribir } from '../pagina.js';
import { iniciarSesion } from '../../js/datos/sesion.js';
import { crearSocio, obtenerSocios } from '../../js/datos/socios.js';
import { inicializarPaginaListado, TIEMPO_DEBOUNCE_MS } from '../../js/paginas/listado.js';

describe('Integración en Happy-DOM: Página de Listado (listado.html)', () => {
  const usuarioActivo = 'admin_pedal';

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    cargarPagina('listado.html');
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('redirige a index.html mediante location.replace si no hay sesión activa', () => {
    const navegacionFalsa = {
      replace: vi.fn(),
      pathname: '/listado.html',
      search: '',
      hash: '',
    };

    inicializarPaginaListado(navegacionFalsa);
    expect(navegacionFalsa.replace).toHaveBeenCalledExactlyOnceWith('index.html');
  });

  it('muestra el estado vacío inicialmente y permite cargar los socios de demostración', () => {
    iniciarSesion({ usuario: usuarioActivo, rol: 'administrador' });
    const navegacionFalsa = {
      replace: vi.fn(),
      pathname: '/listado.html',
      search: '',
      hash: '',
    };

    inicializarPaginaListado(navegacionFalsa);

    const estadoVacio = document.getElementById('estado-vacio');
    const contenedorTabla = document.getElementById('contenedor-tabla');
    expect(estadoVacio.hidden).toBe(false);
    expect(contenedorTabla.hidden).toBe(true);

    // Pulsar botón de cargar socios de ejemplo (crea 6 socios -> 2 páginas)
    const botonDemo = document.getElementById('boton-cargar-ejemplos');
    botonDemo.click();

    expect(obtenerSocios(usuarioActivo)).toHaveLength(6);
    expect(estadoVacio.hidden).toBe(true);
    expect(contenedorTabla.hidden).toBe(false);

    const filas = document.querySelectorAll('#cuerpo-listado .fila-socio');
    expect(filas).toHaveLength(5); // 5 por página
    expect(document.getElementById('contador-resultados').textContent).toContain(
      '6 socios registrados',
    );
  });

  it('filtra con debounce ignorando mayúsculas y tildes y vuelve a la página 1', () => {
    vi.useFakeTimers();
    iniciarSesion({ usuario: usuarioActivo, rol: 'usuario' });

    for (let i = 1; i <= 6; i += 1) {
      crearSocio(usuarioActivo, {
        nombre: i === 6 ? 'Álvaro Élite Montaña' : `Ciclista Ruta ${i}`,
        dni: `${String(i).padStart(8, '0')}A`,
        categoria: i === 6 ? 'Élite' : 'Cicloturista',
        cuota: 30,
      });
    }

    const navegacionFalsa = {
      replace: vi.fn(),
      pathname: '/listado.html',
      search: '?pagina=2',
      hash: '',
    };

    inicializarPaginaListado(navegacionFalsa);

    // En la página 2 solo hay 1 fila inicialmente
    expect(document.querySelectorAll('#cuerpo-listado .fila-socio')).toHaveLength(1);

    const campoBusqueda = document.getElementById('campo-busqueda');
    escribir(campoBusqueda, 'alvaro elite');

    // Antes de que venza el debounce no ha cambiado el listado
    vi.advanceTimersByTime(TIEMPO_DEBOUNCE_MS - 50);
    expect(document.getElementById('contador-resultados').textContent.includes('coinciden')).toBe(
      false,
    );

    // Al cumplirse el tiempo del debounce se filtra y vuelve a página 1
    vi.advanceTimersByTime(60);
    const filasFiltradas = document.querySelectorAll('#cuerpo-listado .fila-socio');
    expect(filasFiltradas).toHaveLength(1);
    expect(filasFiltradas[0].querySelector('.celda-nombre').textContent).toBe(
      'Álvaro Élite Montaña',
    );
    expect(document.getElementById('contador-resultados').textContent).toBe(
      '1 de 6 socios coinciden con la búsqueda',
    );
  });

  it('pide confirmación en <dialog> antes de borrar un socio y actualiza el listado', () => {
    iniciarSesion({ usuario: usuarioActivo, rol: 'administrador' });
    const socio = crearSocio(usuarioActivo, {
      nombre: 'Carlos Sastre',
      dni: '12345678Z',
      categoria: 'Máster 40',
      cuota: 40,
      federado: true,
      licencia: 'ESP-999',
    });

    const navegacionFalsa = {
      replace: vi.fn(),
      pathname: '/listado.html',
      search: '',
      hash: '',
    };

    inicializarPaginaListado(navegacionFalsa);

    const enlaceEditar = document.querySelector('.enlace-editar');
    expect(enlaceEditar.getAttribute('href')).toBe(`ficha.html?id=${socio.id}`);

    const botonBorrar = document.querySelector('.boton-borrar');
    const dialogo = document.getElementById('dialogo-confirmar-borrado');
    const botonCancelar = document.getElementById('boton-cancelar-borrado');
    const botonConfirmar = document.getElementById('boton-confirmar-borrado');

    // Abrir diálogo y cancelar
    botonBorrar.click();
    expect(document.getElementById('mensaje-dialogo-borrado').textContent).toContain(
      'Carlos Sastre',
    );
    botonCancelar.click();
    expect(obtenerSocios(usuarioActivo)).toHaveLength(1);

    // Abrir diálogo y confirmar baja
    botonBorrar.click();
    expect(dialogo.hasAttribute('open')).toBe(true);
    botonConfirmar.click();

    expect(obtenerSocios(usuarioActivo)).toHaveLength(0);
    expect(document.getElementById('estado-vacio').hidden).toBe(false);
    expect(document.getElementById('contenedor-avisos').textContent).toContain('Carlos Sastre');
  });
});
