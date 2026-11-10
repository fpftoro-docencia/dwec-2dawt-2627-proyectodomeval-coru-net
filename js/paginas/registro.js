/**
 * @fileoverview Controlador para la página de registro (registro.html).
 * Incluye validación de contraseña en vivo y control de doble envío (Requisito 5).
 * @module paginas/registro
 */

import { obtenerSesion, iniciarSesion } from '../datos/sesion.js';
import { registrarUsuario, existeUsuario } from '../datos/usuarios.js';
import {
  evaluarRequisitosClave,
  validarNombreUsuario,
  validarCorreo,
  validarRepeticionClave,
} from '../logica/validadores.js';
import { iniciarOyenteAvisos, lanzarAviso, guardarAvisoPendiente } from '../componentes/avisos.js';

/**
 * Inicializa la página de registro.
 * @param {Location} [navegacion=window.location]
 */
export function inicializarPaginaRegistro(navegacion = window.location) {
  if (obtenerSesion()) {
    navegacion.replace('listado.html');
    return;
  }

  iniciarOyenteAvisos();

  const formulario = document.getElementById('formulario-registro');
  const campoUsuario = document.getElementById('campo-usuario');
  const campoCorreo = document.getElementById('campo-correo');
  const campoClave = document.getElementById('campo-clave');
  const campoClaveRepetida = document.getElementById('campo-clave-repetida');
  const campoAceptacion = document.getElementById('campo-aceptacion');
  const botonRegistro = document.getElementById('boton-registro');

  // Elementos de la lista de requisitos de contraseña
  const reqLongitud = document.getElementById('req-longitud');
  const reqMinuscula = document.getElementById('req-minuscula');
  const reqMayuscula = document.getElementById('req-mayuscula');
  const reqCifra = document.getElementById('req-cifra');

  if (!formulario || !campoUsuario || !campoClave) {
    return;
  }

  // Configuración de los botones para ver/ocultar contraseñas (Toggle / 'Ojito')
  const conectarTogglePassword = (idBoton, idCampo) => {
    const boton = document.getElementById(idBoton);
    const campo = document.getElementById(idCampo);
    if (!boton || !campo) {
      return;
    }

    boton.addEventListener('click', () => {
      const oculto = campo.type === 'password';
      campo.type = oculto ? 'text' : 'password';
      boton.setAttribute('aria-pressed', String(oculto));
      boton.setAttribute('aria-label', oculto ? 'Ocultar contraseña' : 'Mostrar contraseña');
      boton.title = oculto ? 'Ocultar contraseña' : 'Mostrar contraseña';
      const icono = boton.querySelector('.icono-ojo');
      if (icono) {
        icono.textContent = oculto ? '🙈' : '👁️';
      }
    });
  };

  conectarTogglePassword('boton-toggle-clave', 'campo-clave');
  conectarTogglePassword('boton-toggle-clave-repetida', 'campo-clave-repetida');

  // Comprobación de requisitos de contraseña en tiempo real mientras escribe (Requisito 5)
  campoClave.addEventListener('input', () => {
    const valor = campoClave.value;
    const resultado = evaluarRequisitosClave(valor);

    actualizarElementoRequisito(reqLongitud, resultado.longitud);
    actualizarElementoRequisito(reqMinuscula, resultado.minuscula);
    actualizarElementoRequisito(reqMayuscula, resultado.mayuscula);
    actualizarElementoRequisito(reqCifra, resultado.cifra);
  });

  /**
   * Actualiza el aspecto visual del elemento de requisito.
   * @param {HTMLElement | null} elemento
   * @param {boolean} cumple
   */
  function actualizarElementoRequisito(elemento, cumple) {
    if (!elemento) {
      return;
    }
    const icono = elemento.querySelector('.req-icon');
    if (cumple) {
      elemento.classList.add('valido');
      elemento.classList.remove('invalido');
      if (icono) {
        icono.textContent = '✓';
      }
    } else {
      elemento.classList.remove('valido');
      if (icono) {
        icono.textContent = '•';
      }
    }
  }

  let enviando = false;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (enviando) {
      return;
    }

    let primerInvalido = null;

    // 1. Validar usuario
    const resUsuario = validarNombreUsuario(campoUsuario.value, (u) => existeUsuario(u));
    const errorUsuario = document.getElementById('error-usuario');
    if (!resUsuario.valido) {
      campoUsuario.classList.add('is-invalid');
      if (errorUsuario && resUsuario.motivo) {
        errorUsuario.textContent = resUsuario.motivo;
      }
      primerInvalido = primerInvalido || campoUsuario;
    } else {
      campoUsuario.classList.remove('is-invalid');
    }

    // 2. Validar correo
    const resCorreo = validarCorreo(campoCorreo.value);
    const errorCorreo = document.getElementById('error-correo');
    if (!resCorreo.valido) {
      campoCorreo.classList.add('is-invalid');
      if (errorCorreo && resCorreo.motivo) {
        errorCorreo.textContent = resCorreo.motivo;
      }
      primerInvalido = primerInvalido || campoCorreo;
    } else {
      campoCorreo.classList.remove('is-invalid');
    }

    // 3. Validar requisitos de contraseña
    const resClave = evaluarRequisitosClave(campoClave.value);
    if (!resClave.esValida) {
      campoClave.classList.add('is-invalid');
      primerInvalido = primerInvalido || campoClave;
    } else {
      campoClave.classList.remove('is-invalid');
    }

    // 4. Validar repetición de contraseña
    const resRepeticion = validarRepeticionClave(campoClave.value, campoClaveRepetida.value);
    const errorRepeticion = document.getElementById('error-clave-repetida');
    if (!resRepeticion.valido) {
      campoClaveRepetida.classList.add('is-invalid');
      if (errorRepeticion && resRepeticion.motivo) {
        errorRepeticion.textContent = resRepeticion.motivo;
      }
      primerInvalido = primerInvalido || campoClaveRepetida;
    } else {
      campoClaveRepetida.classList.remove('is-invalid');
    }

    // 5. Validar casilla de aceptación
    if (!campoAceptacion.checked) {
      campoAceptacion.classList.add('is-invalid');
      primerInvalido = primerInvalido || campoAceptacion;
    } else {
      campoAceptacion.classList.remove('is-invalid');
    }

    if (primerInvalido) {
      lanzarAviso(document, 'Corrige los errores indicados en el formulario.', 'warning');
      primerInvalido.focus();
      return;
    }

    try {
      enviando = true;
      botonRegistro.disabled = true;
      botonRegistro.textContent = 'Registrando socio...';

      const nuevoSocio = await registrarUsuario({
        usuario: campoUsuario.value,
        correo: campoCorreo.value,
        clave: campoClave.value,
      });

      // Iniciar sesión automáticamente (Requisito 5)
      iniciarSesion({
        usuario: nuevoSocio.usuario,
        rol: nuevoSocio.rol,
      });

      // Dejar aviso para el listado (Requisito 5 y 8)
      const rolMensaje = nuevoSocio.rol === 'administrador' ? ' (cuenta de Administrador)' : '';
      guardarAvisoPendiente(
        `¡Bienvenido a Pedal & Cadencia, ${nuevoSocio.usuario}! Tu alta ha sido completada con éxito${rolMensaje}.`,
        'success',
      );

      // Navegar al listado
      navegacion.replace('listado.html');
    } catch (error) {
      lanzarAviso(document, error.message || 'Error al completar el registro.', 'danger');
    } finally {
      enviando = false;
      botonRegistro.disabled = false;
      botonRegistro.textContent = 'Completar Inscripción';
    }
  });

  // Limpieza de errores al interactuar
  [campoUsuario, campoCorreo, campoClave, campoClaveRepetida].forEach((campo) => {
    campo.addEventListener('input', () => campo.classList.remove('is-invalid'));
  });
  campoAceptacion.addEventListener('change', () => campoAceptacion.classList.remove('is-invalid'));
}

if (typeof window !== 'undefined' && document.getElementById('formulario-registro')) {
  inicializarPaginaRegistro();
}
