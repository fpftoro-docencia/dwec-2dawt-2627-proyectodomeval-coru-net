/**
 * @fileoverview Controlador para la página de registro (`registro.html`).
 * HTML requerido: `#formulario-registro`, `#campo-usuario`, `#campo-correo`, `#campo-clave`,
 * `#campo-clave-repetida`, `#campo-aceptacion`, `#boton-registro`, `#req-longitud`,
 * `#req-minuscula`, `#req-mayuscula`, `#req-cifra` y `#contenedor-avisos`.
 * Incluye validación de contraseña en vivo, validación accesible en tiempo real
 * (`blur` en fase de captura e `input` en burbuja) y control de doble envío (Requisito 5 y 18).
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
 * Aplica el estado accesible (`aria-invalid`) y visual (`is-invalid`) sobre un campo.
 * @param {HTMLElement | null} campo
 * @param {HTMLElement | null} cajaError
 * @param {boolean} esValido
 * @param {string} [mensajeError]
 * @returns {boolean}
 */
function marcarEstadoValidacion(campo, cajaError, esValido, mensajeError = '') {
  if (!campo) {
    return true;
  }
  if (esValido) {
    campo.classList.remove('is-invalid');
    campo.setAttribute('aria-invalid', 'false');
    return true;
  }
  campo.classList.add('is-invalid');
  campo.setAttribute('aria-invalid', 'true');
  if (cajaError && mensajeError) {
    cajaError.textContent = mensajeError;
  }
  return false;
}

/**
 * Inicializa la página de registro.
 * @param {Location} [navegacion=window.location]
 * @param {Function} [funcionRegistrar=registrarUsuario]
 * @fires CustomEvent#aviso
 * @listens HTMLFormElement#blur
 * @listens HTMLFormElement#input
 * @listens HTMLFormElement#submit
 */
export function inicializarPaginaRegistro(
  navegacion = window.location,
  funcionRegistrar = registrarUsuario,
) {
  if (obtenerSesion()) {
    navegacion.replace('listado.html');
    return;
  }

  iniciarOyenteAvisos();

  const formulario = /** @type {HTMLFormElement | null} */ (
    document.getElementById('formulario-registro')
  );
  const campoUsuario = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-usuario')
  );
  const campoCorreo = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-correo')
  );
  const campoClave = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-clave')
  );
  const campoClaveRepetida = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-clave-repetida')
  );
  const campoAceptacion = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-aceptacion')
  );
  const botonRegistro = /** @type {HTMLButtonElement | null} */ (
    document.getElementById('boton-registro')
  );

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
    const campo = /** @type {HTMLInputElement | null} */ (document.getElementById(idCampo));
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

  /**
   * Actualiza el aspecto visual del elemento de requisito de contraseña.
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

  // Comprobación de requisitos de contraseña en tiempo real mientras escribe (Requisito 5)
  campoClave.addEventListener('input', () => {
    const resultado = evaluarRequisitosClave(campoClave.value);
    actualizarElementoRequisito(reqLongitud, resultado.longitud);
    actualizarElementoRequisito(reqMinuscula, resultado.minuscula);
    actualizarElementoRequisito(reqMayuscula, resultado.mayuscula);
    actualizarElementoRequisito(reqCifra, resultado.cifra);
  });

  /** @type {WeakSet<HTMLElement>} */
  const camposTocados = new WeakSet();

  /**
   * Valida un campo individual del formulario de registro.
   * @param {HTMLElement} objetivo
   * @returns {boolean}
   */
  function validarCampoIndividual(objetivo) {
    if (objetivo === campoUsuario) {
      const res = validarNombreUsuario(campoUsuario.value, (u) => existeUsuario(u));
      return marcarEstadoValidacion(
        campoUsuario,
        document.getElementById('error-usuario'),
        res.valido,
        res.motivo,
      );
    }

    if (objetivo === campoCorreo && campoCorreo) {
      const res = validarCorreo(campoCorreo.value);
      return marcarEstadoValidacion(
        campoCorreo,
        document.getElementById('error-correo'),
        res.valido,
        res.motivo,
      );
    }

    if (objetivo === campoClave) {
      const res = evaluarRequisitosClave(campoClave.value);
      return marcarEstadoValidacion(
        campoClave,
        document.getElementById('error-clave'),
        res.esValida,
        'La contraseña no cumple todos los requisitos exigidos.',
      );
    }

    if (objetivo === campoClaveRepetida && campoClaveRepetida) {
      const res = validarRepeticionClave(campoClave.value, campoClaveRepetida.value);
      return marcarEstadoValidacion(
        campoClaveRepetida,
        document.getElementById('error-clave-repetida'),
        res.valido,
        res.motivo,
      );
    }

    if (objetivo === campoAceptacion && campoAceptacion) {
      return marcarEstadoValidacion(
        campoAceptacion,
        document.getElementById('error-aceptacion'),
        campoAceptacion.checked,
        'Debes aceptar las condiciones para formalizar el alta.',
      );
    }

    return true;
  }

  // Primera validación al salir del campo (blur en fase de captura) (Requisito 18)
  formulario.addEventListener(
    'blur',
    (evento) => {
      const objetivo = /** @type {HTMLElement | null} */ (evento.target);
      if (objetivo && objetivo.tagName === 'INPUT') {
        camposTocados.add(objetivo);
        validarCampoIndividual(objetivo);
      }
    },
    true,
  );

  // Posteriores validaciones en input / change (en fase de burbuja) (Requisito 18)
  formulario.addEventListener('input', (evento) => {
    const objetivo = /** @type {HTMLElement | null} */ (evento.target);
    if (objetivo && camposTocados.has(objetivo)) {
      validarCampoIndividual(objetivo);
      if (objetivo === campoClave && campoClaveRepetida && camposTocados.has(campoClaveRepetida)) {
        validarCampoIndividual(campoClaveRepetida);
      }
    }
  });

  if (campoAceptacion) {
    campoAceptacion.addEventListener('change', () => {
      camposTocados.add(campoAceptacion);
      validarCampoIndividual(campoAceptacion);
    });
  }

  let enviando = false;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (enviando) {
      return;
    }

    const listaCampos = [
      campoUsuario,
      campoCorreo,
      campoClave,
      campoClaveRepetida,
      campoAceptacion,
    ].filter(Boolean);

    /** @type {HTMLElement | null} */
    let primerInvalido = null;

    for (const campo of listaCampos) {
      const el = /** @type {HTMLElement} */ (campo);
      camposTocados.add(el);
      const valido = validarCampoIndividual(el);
      if (!valido && !primerInvalido) {
        primerInvalido = el;
      }
    }

    if (primerInvalido) {
      lanzarAviso(document, 'Corrige los errores indicados en el formulario.', 'warning');
      primerInvalido.focus();
      return;
    }

    try {
      enviando = true;
      if (botonRegistro) {
        botonRegistro.disabled = true;
        botonRegistro.textContent = 'Registrando socio...';
      }

      const nuevoSocio = await funcionRegistrar({
        usuario: campoUsuario.value,
        correo: campoCorreo ? campoCorreo.value : '',
        clave: campoClave.value,
      });

      iniciarSesion({
        usuario: nuevoSocio.usuario,
        rol: nuevoSocio.rol,
      });

      const rolMensaje = nuevoSocio.rol === 'administrador' ? ' (cuenta de Administrador)' : '';
      guardarAvisoPendiente(
        `¡Bienvenido a Pedal & Cadencia, ${nuevoSocio.usuario}! Tu alta ha sido completada con éxito${rolMensaje}.`,
        'success',
      );

      navegacion.replace('listado.html');
    } catch (error) {
      lanzarAviso(
        document,
        error instanceof Error ? error.message : 'Error al completar el registro.',
        'danger',
      );
    } finally {
      enviando = false;
      if (botonRegistro) {
        botonRegistro.disabled = false;
        botonRegistro.textContent = 'Completar Inscripción';
      }
    }
  });
}

if (typeof window !== 'undefined' && document.getElementById('formulario-registro')) {
  inicializarPaginaRegistro();
}
