// Ejemplo de test de integración: un trozo de página real en happy-dom, con el usuario simulado
// (UD5, tema 9 y UD6, tema 7). Sustitúyelo por los tuyos (requisito 21): cada página con sus módulos
// reales, cargando su `<body>` con `cargarPagina('ficha.html')` de `../pagina.js`, y sustituyendo solo
// el almacenamiento (`AlmacenFalso`), el resumen de la contraseña y la navegación (`vi.fn()`).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { escribir, salir } from '../pagina.js';

/** Un «módulo de página» mínimo: valida un campo al salir de él. Solo sirve para el ejemplo. */
function iniciarPagina(documento, { alAceptar }) {
  const formulario = documento.querySelector('form');
  const campo = formulario.elements.nombre;
  const error = documento.querySelector('#error-nombre');
  const validar = () => {
    error.textContent = campo.value.trim() ? '' : 'Escribe tu nombre';
    return !error.textContent;
  };
  // `blur` no sube: se escucha en el formulario, en la fase de captura
  formulario.addEventListener('blur', (evento) => evento.target === campo && validar(), true);
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (validar()) {
      alAceptar(campo.value.trim());
    }
  });
}

describe('ejemplo: un formulario en happy-dom', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function preparar() {
    document.body.innerHTML = `
      <form novalidate>
        <label>Nombre <input name="nombre"></label>
        <p id="error-nombre"></p>
        <button>Guardar</button>
      </form>`;
    const alAceptar = vi.fn(); // doble de prueba: en lugar de guardar o navegar
    iniciarPagina(document, { alAceptar });
    return {
      campo: document.querySelector('input'),
      error: document.querySelector('#error-nombre'),
      alAceptar,
    };
  }

  it('al salir de un campo vacío, muestra el error', () => {
    const { campo, error } = preparar();
    salir(campo);
    expect(error.textContent).toBe('Escribe tu nombre');
  });

  it('al enviar con datos válidos, avisa con el valor exacto', () => {
    const { campo, alAceptar } = preparar();
    escribir(campo, '  Ana  ');
    document.querySelector('form').requestSubmit();
    expect(alAceptar).toHaveBeenCalledExactlyOnceWith('Ana');
  });
});
