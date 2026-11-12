/**
 * @fileoverview Controlador para la página de inicio de sesión (index.html).
 * Incluye validación accesible en tiempo real (blur en captura e input en burbuja) y
 * botón de alternancia de visibilidad de contraseña.
 * @module paginas/index
 */

import { obtenerSesion, iniciarSesion } from '../datos/sesion.js';
import { autenticarUsuario } from '../datos/usuarios.js';
import {
  iniciarOyenteAvisos,
  lanzarAviso,
  comprobarAvisoPendiente,
} from '../componentes/avisos.js';

/**
 * Inicializa la página de inicio de sesión.
 * @param {Location} [navegacion=window.location]
 * @param {Function} [funcionAutenticar=autenticarUsuario]
 */
export function inicializarPaginaLogin(
  navegacion = window.location,
  funcionAutenticar = autenticarUsuario,
) {
  if (obtenerSesion()) {
    navegacion.replace('listado.html');
    return;
  }

  iniciarOyenteAvisos();
  comprobarAvisoPendiente();

  const formulario = /** @type {HTMLFormElement | null} */ (
    document.getElementById('formulario-login')
  );
  const campoUsuario = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-usuario')
  );
  const campoClave = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-clave')
  );
  const botonEntrar = /** @type {HTMLButtonElement | null} */ (
    document.getElementById('boton-entrar')
  );
  const botonToggleClave = document.getElementById('boton-toggle-clave');

  if (botonToggleClave && campoClave) {
    botonToggleClave.addEventListener('click', () => {
      const oculto = campoClave.type === 'password';
      campoClave.type = oculto ? 'text' : 'password';
      botonToggleClave.setAttribute('aria-pressed', String(oculto));
      botonToggleClave.setAttribute(
        'aria-label',
        oculto ? 'Ocultar contraseña' : 'Mostrar contraseña',
      );
      botonToggleClave.title = oculto ? 'Ocultar contraseña' : 'Mostrar contraseña';
      const icono = botonToggleClave.querySelector('.icono-ojo');
      if (icono) {
        icono.textContent = oculto ? '🙈' : '👁️';
      }
    });
  }

  if (!formulario || !campoUsuario || !campoClave || !botonEntrar) {
    return;
  }

  /** @type {WeakSet<HTMLElement>} */
  const camposTocados = new WeakSet();

  /**
   * Valida un campo requerido del login y aplica `aria-invalid` e `is-invalid`.
   * @param {HTMLElement} elemento
   * @returns {boolean}
   */
  function validarCampoLogin(elemento) {
    if (elemento === campoUsuario) {
      const valido = campoUsuario.value.trim() !== '';
      campoUsuario.classList.toggle('is-invalid', !valido);
      campoUsuario.setAttribute('aria-invalid', String(!valido));
      return valido;
    }
    if (elemento === campoClave) {
      const valido = campoClave.value !== '';
      campoClave.classList.toggle('is-invalid', !valido);
      campoClave.setAttribute('aria-invalid', String(!valido));
      return valido;
    }
    return true;
  }

  formulario.addEventListener(
    'blur',
    (evento) => {
      const objetivo = /** @type {HTMLElement | null} */ (evento.target);
      if (objetivo && objetivo.tagName === 'INPUT') {
        camposTocados.add(objetivo);
        validarCampoLogin(objetivo);
      }
    },
    true,
  );

  formulario.addEventListener('input', (evento) => {
    const objetivo = /** @type {HTMLElement | null} */ (evento.target);
    if (objetivo && camposTocados.has(objetivo)) {
      validarCampoLogin(objetivo);
    }
  });

  let enviando = false;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (enviando) {
      return;
    }

    camposTocados.add(campoUsuario);
    camposTocados.add(campoClave);

    const usuarioValido = validarCampoLogin(campoUsuario);
    const claveValida = validarCampoLogin(campoClave);

    if (!usuarioValido || !claveValida) {
      lanzarAviso(document, 'Por favor, rellena todos los campos requeridos.', 'warning');
      const primerError = /** @type {HTMLElement | null} */ (
        formulario.querySelector('.is-invalid')
      );
      if (primerError) {
        primerError.focus();
      }
      return;
    }

    try {
      enviando = true;
      botonEntrar.disabled = true;
      botonEntrar.textContent = 'Verificando credenciales...';

      const usuarioAutenticado = await funcionAutenticar(
        campoUsuario.value.trim(),
        campoClave.value,
      );

      if (!usuarioAutenticado) {
        lanzarAviso(document, 'Nombre de usuario o contraseña incorrectos.', 'danger');
        campoClave.value = '';
        campoClave.classList.add('is-invalid');
        campoClave.setAttribute('aria-invalid', 'true');
        campoClave.focus();
        return;
      }

      iniciarSesion({
        usuario: usuarioAutenticado.usuario,
        rol: usuarioAutenticado.rol,
      });

      navegacion.replace('listado.html');
    } catch {
      lanzarAviso(
        document,
        'Ha ocurrido un error al iniciar sesión. Inténtalo de nuevo.',
        'danger',
      );
    } finally {
      enviando = false;
      botonEntrar.disabled = false;
      botonEntrar.textContent = 'Entrar al Club';
    }
  });
}

if (typeof window !== 'undefined' && document.getElementById('formulario-login')) {
  inicializarPaginaLogin();
}
