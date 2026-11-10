/**
 * @fileoverview Controlador para la página de inicio de sesión (index.html).
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
 */
export function inicializarPaginaLogin(navegacion = window.location) {
  // Si ya hay sesión activa, redirige inmediatamente al listado (Requisito 6)
  if (obtenerSesion()) {
    navegacion.replace('listado.html');
    return;
  }

  iniciarOyenteAvisos();
  comprobarAvisoPendiente();

  const formulario = document.getElementById('formulario-login');
  const campoUsuario = document.getElementById('campo-usuario');
  const campoClave = document.getElementById('campo-clave');
  const botonEntrar = document.getElementById('boton-entrar');
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

  let enviando = false;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    // Evitar doble envío si ya está procesando (Requisito 6)
    if (enviando) {
      return;
    }

    const usuarioValor = campoUsuario.value.trim();
    const claveValor = campoClave.value;

    let errores = false;

    // Validación básica de campos requeridos
    if (!usuarioValor) {
      campoUsuario.classList.add('is-invalid');
      errores = true;
    } else {
      campoUsuario.classList.remove('is-invalid');
    }

    if (!claveValor) {
      campoClave.classList.add('is-invalid');
      errores = true;
    } else {
      campoClave.classList.remove('is-invalid');
    }

    if (errores) {
      lanzarAviso(document, 'Por favor, rellena todos los campos requeridos.', 'warning');
      const primerError = formulario.querySelector('.is-invalid');
      if (primerError) {
        primerError.focus();
      }
      return;
    }

    try {
      enviando = true;
      botonEntrar.disabled = true;
      botonEntrar.textContent = 'Verificando credenciales...';

      // Autenticar comparando el hash SHA-256
      const usuarioAutenticado = await autenticarUsuario(usuarioValor, claveValor);

      if (!usuarioAutenticado) {
        lanzarAviso(document, 'Nombre de usuario o contraseña incorrectos.', 'danger');
        campoClave.value = '';
        campoClave.classList.add('is-invalid');
        campoClave.focus();
        return;
      }

      // Iniciar sesión y navegar al listado
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

  // Limpiar estilos de error al teclear
  campoUsuario.addEventListener('input', () => campoUsuario.classList.remove('is-invalid'));
  campoClave.addEventListener('input', () => campoClave.classList.remove('is-invalid'));
}

// Ejecutar si estamos en el navegador
if (typeof window !== 'undefined' && document.getElementById('formulario-login')) {
  inicializarPaginaLogin();
}
