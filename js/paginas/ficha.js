/**
 * @fileoverview Controlador para la página privada de alta y edición de socio (ficha.html).
 * Implementa campo condicional (licencia federativa con hidden + disabled), grupo dinámico de
 * bicicletas (0 a 3 mediante <template> con IDs y labels únicos), lectura con FormData y
 * validación accesible en tiempo real (blur en captura, input en burbuja).
 * @module paginas/ficha
 */

import { protegerPaginaPrivada } from '../datos/sesion.js';
import {
  obtenerSocios,
  obtenerSocioPorId,
  crearSocio,
  actualizarSocio,
  MAX_BICICLETAS,
} from '../datos/socios.js';
import {
  validarNombreSocio,
  validarDni,
  validarFechaNacimiento,
  validarCuotaMensual,
  validarLicenciaFederativa,
  validarCampoBicicleta,
} from '../logica/validadores.js';
import { inicializarCabecera } from '../componentes/cabecera.js';
import {
  iniciarOyenteAvisos,
  comprobarAvisoPendiente,
  lanzarAviso,
  guardarAvisoPendiente,
} from '../componentes/avisos.js';

/**
 * Aplica o limpia el estado visual y accesible de error sobre un campo de formulario.
 * @param {HTMLElement | null} campo
 * @param {HTMLElement | null} cajaError
 * @param {Object} resultado
 * @returns {boolean} `true` si el campo es válido.
 */
function aplicarEstadoCampo(campo, cajaError, resultado) {
  if (!campo) {
    return true;
  }
  if (resultado.valido) {
    campo.classList.remove('is-invalid');
    campo.setAttribute('aria-invalid', 'false');
    if (cajaError) {
      cajaError.textContent = '';
    }
    return true;
  }

  campo.classList.add('is-invalid');
  campo.setAttribute('aria-invalid', 'true');
  if (cajaError) {
    cajaError.textContent = resultado.motivo || 'Valor no válido.';
  }
  return false;
}

/**
 * Inicializa la página de ficha de socio ciclista (modo alta o edición según `?id=...`).
 * @param {Location} [navegacion=window.location]
 */
export function inicializarPaginaFicha(navegacion = window.location) {
  const sesion = protegerPaginaPrivada(navegacion);
  if (!sesion) {
    return;
  }

  inicializarCabecera('ficha.html', undefined, navegacion);
  iniciarOyenteAvisos();
  comprobarAvisoPendiente();

  const formulario = /** @type {HTMLFormElement | null} */ (
    document.getElementById('formulario-ficha')
  );
  if (!formulario) {
    return;
  }

  const tituloFicha = document.getElementById('titulo-ficha');
  const botonGuardar = document.getElementById('boton-guardar-ficha');

  const campoNombre = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-nombre')
  );
  const errorNombre = document.getElementById('error-nombre');

  const campoDni = /** @type {HTMLInputElement | null} */ (document.getElementById('campo-dni'));
  const errorDni = document.getElementById('error-dni');

  const campoFechaNacimiento = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-fecha-nacimiento')
  );
  const errorFechaNacimiento = document.getElementById('error-fecha-nacimiento');

  const campoCategoria = /** @type {HTMLSelectElement | null} */ (
    document.getElementById('campo-categoria')
  );

  const campoCuota = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-cuota')
  );
  const errorCuota = document.getElementById('error-cuota');

  const campoFederado = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-federado')
  );
  const contenedorLicencia = document.getElementById('contenedor-licencia');
  const campoLicencia = /** @type {HTMLInputElement | null} */ (
    document.getElementById('campo-licencia')
  );
  const errorLicencia = document.getElementById('error-licencia');

  const botonAnadirBici = /** @type {HTMLButtonElement | null} */ (
    document.getElementById('boton-anadir-bici')
  );
  const contadorBicicletas = document.getElementById('contador-bicicletas');
  const contenedorBicicletas = document.getElementById('contenedor-bicicletas');
  const plantillaBicicleta = /** @type {HTMLTemplateElement | null} */ (
    document.getElementById('plantilla-bicicleta')
  );

  const parametrosUrl = new URLSearchParams(navegacion?.search || '');
  const idEdicion = parametrosUrl.get('id');
  let socioEnEdicion = null;

  if (idEdicion) {
    socioEnEdicion = obtenerSocioPorId(sesion.usuario, idEdicion);
    if (!socioEnEdicion) {
      guardarAvisoPendiente('El socio ciclista solicitado no existe.', 'danger');
      navegacion.replace('listado.html');
      return;
    }
  }

  let contadorIdUnicoBici = 0;
  /** @type {WeakSet<HTMLElement>} */
  const camposTocados = new WeakSet();

  /**
   * Sincroniza la visibilidad (`hidden`) y habilitación (`disabled`) del campo condicional de licencia (Requisito 16).
   */
  function sincronizarCampoCondicionalLicencia() {
    const activo = Boolean(campoFederado?.checked);
    if (contenedorLicencia) {
      contenedorLicencia.hidden = !activo;
    }
    if (campoLicencia) {
      campoLicencia.disabled = !activo;
      if (!activo) {
        campoLicencia.value = '';
        campoLicencia.classList.remove('is-invalid');
        campoLicencia.removeAttribute('aria-invalid');
        if (errorLicencia) {
          errorLicencia.textContent = '';
        }
      }
    }
  }

  /**
   * Actualiza los títulos numerados, el contador y el estado `disabled` del botón de añadir bicicleta (Requisito 17).
   */
  function actualizarEstadoGrupoBicicletas() {
    if (!contenedorBicicletas) {
      return;
    }
    const bloques = contenedorBicicletas.querySelectorAll('.bloque-bicicleta');
    const cantidad = bloques.length;

    bloques.forEach((bloque, indice) => {
      const leyenda = bloque.querySelector('.titulo-bicicleta');
      if (leyenda) {
        leyenda.textContent = `Bicicleta #${indice + 1}`;
      }
    });

    if (contadorBicicletas) {
      const plural = cantidad === 1 ? 'bicicleta añadida' : 'bicicletas añadidas';
      contadorBicicletas.textContent = `${cantidad} de ${MAX_BICICLETAS} ${plural}`;
    }

    if (botonAnadirBici) {
      botonAnadirBici.disabled = cantidad >= MAX_BICICLETAS;
    }
  }

  /**
   * Clona el `<template id="plantilla-bicicleta">`, asigna IDs y `for` únicos e inserta el bloque.
   * @param {Object} [datosIniciales]
   */
  function anadirBloqueBicicleta(datosIniciales = {}) {
    if (!contenedorBicicletas || !plantillaBicicleta) {
      return;
    }
    const actuales = contenedorBicicletas.querySelectorAll('.bloque-bicicleta').length;
    if (actuales >= MAX_BICICLETAS) {
      return;
    }

    contadorIdUnicoBici += 1;
    const sufijo = contadorIdUnicoBici;

    const clon = /** @type {DocumentFragment} */ (plantillaBicicleta.content.cloneNode(true));
    const bloque = /** @type {HTMLElement | null} */ (clon.querySelector('.bloque-bicicleta'));

    const labelMarca = clon.querySelector('.label-bici-marca');
    const inputMarca = /** @type {HTMLInputElement | null} */ (
      clon.querySelector('.input-bici-marca')
    );
    const errorMarca = clon.querySelector('.error-bici-marca');

    const labelModelo = clon.querySelector('.label-bici-modelo');
    const inputModelo = /** @type {HTMLInputElement | null} */ (
      clon.querySelector('.input-bici-modelo')
    );
    const errorModelo = clon.querySelector('.error-bici-modelo');

    const labelDisciplina = clon.querySelector('.label-bici-disciplina');
    const selectDisciplina = /** @type {HTMLSelectElement | null} */ (
      clon.querySelector('.select-bici-disciplina')
    );
    const botonEliminar = clon.querySelector('.boton-eliminar-bici');

    const idMarca = `bici-marca-${sufijo}`;
    const idErrorMarca = `error-bici-marca-${sufijo}`;
    const idModelo = `bici-modelo-${sufijo}`;
    const idErrorModelo = `error-bici-modelo-${sufijo}`;
    const idDisciplina = `bici-disciplina-${sufijo}`;

    if (labelMarca) {
      labelMarca.setAttribute('for', idMarca);
    }
    if (errorMarca) {
      errorMarca.id = idErrorMarca;
    }
    if (inputMarca) {
      inputMarca.id = idMarca;
      inputMarca.name = `bici_marca_${sufijo}`;
      inputMarca.setAttribute('aria-describedby', idErrorMarca);
      inputMarca.value = datosIniciales.marca || '';
    }

    if (labelModelo) {
      labelModelo.setAttribute('for', idModelo);
    }
    if (errorModelo) {
      errorModelo.id = idErrorModelo;
    }
    if (inputModelo) {
      inputModelo.id = idModelo;
      inputModelo.name = `bici_modelo_${sufijo}`;
      inputModelo.setAttribute('aria-describedby', idErrorModelo);
      inputModelo.value = datosIniciales.modelo || '';
    }

    if (labelDisciplina) {
      labelDisciplina.setAttribute('for', idDisciplina);
    }
    if (selectDisciplina) {
      selectDisciplina.id = idDisciplina;
      selectDisciplina.name = `bici_disciplina_${sufijo}`;
      if (datosIniciales.disciplina) {
        selectDisciplina.value = datosIniciales.disciplina;
      }
    }

    if (botonEliminar && bloque) {
      botonEliminar.addEventListener('click', () => {
        bloque.remove();
        actualizarEstadoGrupoBicicletas();
      });
    }

    contenedorBicicletas.append(clon);
    actualizarEstadoGrupoBicicletas();
  }

  /**
   * Valida un campo individual del formulario (fijo, condicional o dinámico).
   * @param {HTMLElement} elemento
   * @returns {boolean}
   */
  function validarElementoIndividual(elemento) {
    if (elemento === campoNombre) {
      return aplicarEstadoCampo(campoNombre, errorNombre, validarNombreSocio(campoNombre.value));
    }

    if (elemento === campoDni) {
      const resultado = validarDni(campoDni.value, (dniNormalizado) => {
        const existentes = obtenerSocios(sesion.usuario);
        return existentes.some(
          (s) => s.dni.toUpperCase() === dniNormalizado && s.id !== socioEnEdicion?.id,
        );
      });
      return aplicarEstadoCampo(campoDni, errorDni, resultado);
    }

    if (elemento === campoFechaNacimiento) {
      return aplicarEstadoCampo(
        campoFechaNacimiento,
        errorFechaNacimiento,
        validarFechaNacimiento(campoFechaNacimiento.value),
      );
    }

    if (elemento === campoCuota) {
      return aplicarEstadoCampo(campoCuota, errorCuota, validarCuotaMensual(campoCuota.value));
    }

    if (elemento === campoLicencia) {
      if (campoLicencia.disabled) {
        return true;
      }
      return aplicarEstadoCampo(
        campoLicencia,
        errorLicencia,
        validarLicenciaFederativa(campoLicencia.value, Boolean(campoFederado?.checked)),
      );
    }

    if (elemento.classList.contains('input-bici-marca')) {
      const input = /** @type {HTMLInputElement} */ (elemento);
      const cajaErr = input.parentElement?.querySelector('.error-bici-marca') || null;
      return aplicarEstadoCampo(
        input,
        /** @type {HTMLElement | null} */ (cajaErr),
        validarCampoBicicleta(input.value, 'marca'),
      );
    }

    if (elemento.classList.contains('input-bici-modelo')) {
      const input = /** @type {HTMLInputElement} */ (elemento);
      const cajaErr = input.parentElement?.querySelector('.error-bici-modelo') || null;
      return aplicarEstadoCampo(
        input,
        /** @type {HTMLElement | null} */ (cajaErr),
        validarCampoBicicleta(input.value, 'modelo'),
      );
    }

    return true;
  }

  // Rellenar formulario si estamos en modo edición (ficha.html?id=...)
  if (socioEnEdicion) {
    if (tituloFicha) {
      tituloFicha.textContent = 'Editar Ficha de Socio';
    }
    if (botonGuardar) {
      botonGuardar.textContent = 'Guardar Cambios';
    }
    if (campoNombre) {
      campoNombre.value = socioEnEdicion.nombre;
    }
    if (campoDni) {
      campoDni.value = socioEnEdicion.dni;
    }
    if (campoFechaNacimiento) {
      campoFechaNacimiento.value = socioEnEdicion.fechaNacimiento;
    }
    if (campoCategoria) {
      campoCategoria.value = socioEnEdicion.categoria;
    }
    if (campoCuota) {
      campoCuota.value = String(socioEnEdicion.cuota);
    }
    if (campoFederado) {
      campoFederado.checked = Boolean(socioEnEdicion.federado);
    }
    sincronizarCampoCondicionalLicencia();
    if (campoLicencia && socioEnEdicion.federado) {
      campoLicencia.value = socioEnEdicion.licencia || '';
    }
    if (Array.isArray(socioEnEdicion.bicicletas)) {
      for (const bici of socioEnEdicion.bicicletas) {
        anadirBloqueBicicleta(bici);
      }
    }
  } else {
    sincronizarCampoCondicionalLicencia();
    actualizarEstadoGrupoBicicletas();
  }

  // Eventos del campo condicional y botón de añadir bicicleta
  if (campoFederado) {
    campoFederado.addEventListener('change', () => {
      sincronizarCampoCondicionalLicencia();
    });
  }

  if (botonAnadirBici) {
    botonAnadirBici.addEventListener('click', () => {
      anadirBloqueBicicleta();
    });
  }

  // Validación en tiempo real: primera al salir del campo (blur en captura), posteriores en input (burbuja)
  formulario.addEventListener(
    'blur',
    (evento) => {
      const objetivo = /** @type {HTMLElement | null} */ (evento.target);
      if (objetivo && (objetivo.tagName === 'INPUT' || objetivo.tagName === 'SELECT')) {
        camposTocados.add(objetivo);
        validarElementoIndividual(objetivo);
      }
    },
    true,
  );

  formulario.addEventListener('input', (evento) => {
    const objetivo = /** @type {HTMLElement | null} */ (evento.target);
    if (objetivo && camposTocados.has(objetivo)) {
      validarElementoIndividual(objetivo);
    }
  });

  // Envío del formulario leyendo con FormData
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const elementosValidables = [
      campoNombre,
      campoDni,
      campoFechaNacimiento,
      campoCuota,
      ...(campoFederado?.checked ? [campoLicencia] : []),
      ...Array.from(
        contenedorBicicletas?.querySelectorAll('.input-bici-marca, .input-bici-modelo') || [],
      ),
    ].filter(Boolean);

    /** @type {HTMLElement | null} */
    let primerCampoInvalido = null;

    for (const elem of elementosValidables) {
      const elementoHtml = /** @type {HTMLElement} */ (elem);
      camposTocados.add(elementoHtml);
      const esValido = validarElementoIndividual(elementoHtml);
      if (!esValido && !primerCampoInvalido) {
        primerCampoInvalido = elementoHtml;
      }
    }

    if (primerCampoInvalido) {
      lanzarAviso(
        formulario,
        'Por favor, corrige los campos marcados en rojo antes de guardar la ficha.',
        'danger',
      );
      primerCampoInvalido.focus();
      return;
    }

    const datosForm = new FormData(formulario);
    const esFederado = datosForm.has('federado');

    /** @type {Array<Object>} */
    const bicicletasExtraidas = [];
    const bloquesBici = contenedorBicicletas?.querySelectorAll('.bloque-bicicleta') || [];

    for (const bloque of bloquesBici) {
      const inMarca = /** @type {HTMLInputElement | null} */ (
        bloque.querySelector('.input-bici-marca')
      );
      const inModelo = /** @type {HTMLInputElement | null} */ (
        bloque.querySelector('.input-bici-modelo')
      );
      const selDisciplina = /** @type {HTMLSelectElement | null} */ (
        bloque.querySelector('.select-bici-disciplina')
      );

      bicicletasExtraidas.push({
        marca: String(inMarca ? datosForm.get(inMarca.name) || '' : '').trim(),
        modelo: String(inModelo ? datosForm.get(inModelo.name) || '' : '').trim(),
        disciplina: String(
          selDisciplina ? datosForm.get(selDisciplina.name) || 'Montaña (MTB)' : 'Montaña (MTB)',
        ),
      });
    }

    const payloadSocio = {
      nombre: String(datosForm.get('nombre') || '').trim(),
      dni: String(datosForm.get('dni') || '')
        .trim()
        .toUpperCase(),
      fechaNacimiento: String(datosForm.get('fechaNacimiento') || '').trim(),
      categoria: String(datosForm.get('categoria') || 'Cicloturista'),
      cuota: Number(datosForm.get('cuota')),
      federado: esFederado,
      licencia: esFederado ? String(datosForm.get('licencia') || '').trim() : '',
      bicicletas: bicicletasExtraidas,
    };

    try {
      if (socioEnEdicion) {
        actualizarSocio(sesion.usuario, socioEnEdicion.id, payloadSocio);
        guardarAvisoPendiente(
          `Ficha del socio «${payloadSocio.nombre}» actualizada correctamente.`,
          'success',
        );
      } else {
        crearSocio(sesion.usuario, payloadSocio);
        guardarAvisoPendiente(
          `Socio «${payloadSocio.nombre}» dado de alta en el club correctamente.`,
          'success',
        );
      }
      navegacion.replace('listado.html');
    } catch (error) {
      lanzarAviso(
        formulario,
        error instanceof Error ? error.message : 'Error al guardar la ficha.',
        'danger',
      );
    }
  });
}

if (
  typeof window !== 'undefined' &&
  document.querySelector('title')?.textContent.includes('Ficha')
) {
  inicializarPaginaFicha();
}
