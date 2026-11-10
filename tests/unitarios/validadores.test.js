import { describe, it, expect } from 'vitest';
import {
  validarNombreUsuario,
  validarCorreo,
  evaluarRequisitosClave,
  validarRepeticionClave,
} from '../../js/logica/validadores.js';

describe('Validadores de Registro con tablas it.each (Requisito 10)', () => {
  describe('validarNombreUsuario', () => {
    // Casos válidos con límites
    it.each([
      ['abc', 'límite inferior exacto de 3 caracteres'],
      ['usuario123', 'combinación alfanumérica típica'],
      ['ciclista_pro', 'contiene guion bajo'],
      ['12345678901234567890', 'límite superior exacto de 20 caracteres'],
    ])('acepta «%s» (%s)', (usuario) => {
      const resultado = validarNombreUsuario(usuario);
      expect(resultado.valido).toBe(true);
      expect(resultado.motivo).toBeUndefined();
    });

    // Casos no válidos con motivo
    it.each([
      ['', 'El nombre de usuario es obligatorio.', 'campo vacío'],
      ['  ', 'El nombre de usuario es obligatorio.', 'solo espacios'],
      ['ab', 'Debe tener al menos 3 caracteres.', 'menos de 3 caracteres'],
      [
        'un_nombre_demasiado_largo_que_supera_el_limite',
        'No puede superar los 20 caracteres.',
        'más de 20 caracteres',
      ],
      ['juan perez', 'Solo se permiten letras, números y guiones bajos (_).', 'contiene espacio'],
      ['ciclista@club', 'Solo se permiten letras, números y guiones bajos (_).', 'contiene arroba'],
      [
        'ana-maria',
        'Solo se permiten letras, números y guiones bajos (_).',
        'contiene guion medio',
      ],
    ])('rechaza «%s» con motivo: %s (%s)', (usuario, motivoEsperado) => {
      const resultado = validarNombreUsuario(usuario);
      expect(resultado.valido).toBe(false);
      expect(resultado.motivo).toBe(motivoEsperado);
    });

    it('rechaza un nombre si la función de comprobación indica que ya existe', () => {
      const existeFn = (u) => u.toLowerCase() === 'pedro';
      const resultado = validarNombreUsuario('pedro', existeFn);
      expect(resultado.valido).toBe(false);
      expect(resultado.motivo).toContain('ya está ocupado');
    });
  });

  describe('validarCorreo', () => {
    it.each([['socio@club.com'], ['pedaleador.26@dominio.es'], ['usuario+tag@sub.empresa.org']])(
      'acepta correo válido «%s»',
      (correo) => {
        expect(validarCorreo(correo).valido).toBe(true);
      },
    );

    it.each([
      ['', 'El correo electrónico es obligatorio.'],
      ['sin_arroba.com', 'El formato del correo no es válido (ej. usuario@dominio.com).'],
      ['@sin-usuario.com', 'El formato del correo no es válido (ej. usuario@dominio.com).'],
      ['usuario@sin-dominio', 'El formato del correo no es válido (ej. usuario@dominio.com).'],
    ])('rechaza correo inválido «%s» con motivo', (correo, motivo) => {
      const resultado = validarCorreo(correo);
      expect(resultado.valido).toBe(false);
      expect(resultado.motivo).toBe(motivo);
    });
  });

  describe('evaluarRequisitosClave (Requisito 5: longitud, minúscula, mayúscula y cifra)', () => {
    it.each([
      ['Abcdefg1', true, true, true, true, true, 'cumple todos los requisitos'],
      ['Contraseña9', true, true, true, true, true, 'letras acentuadas y eñes válidas'],
      ['Ab1', false, true, true, true, false, 'falla longitud (< 8)'],
      ['ABCDEFGH1', true, false, true, true, false, 'falta minúscula (\\p{Ll})'],
      ['abcdefgh1', true, true, false, true, false, 'falta mayúscula (\\p{Lu})'],
      ['Abcdefghi', true, true, true, false, false, 'falta cifra (\\d)'],
    ])(
      'para «%s» -> long:%s, min:%s, may:%s, cif:%s => global:%s (%s)',
      (clave, expLong, expMin, expMay, expCif, expValida) => {
        const r = evaluarRequisitosClave(clave);
        expect(r.longitud).toBe(expLong);
        expect(r.minuscula).toBe(expMin);
        expect(r.mayuscula).toBe(expMay);
        expect(r.cifra).toBe(expCif);
        expect(r.esValida).toBe(expValida);
      },
    );
  });

  describe('validarRepeticionClave', () => {
    it('acepta contraseñas idénticas', () => {
      expect(validarRepeticionClave('SuperClave1', 'SuperClave1').valido).toBe(true);
    });

    it('rechaza contraseñas diferentes', () => {
      const res = validarRepeticionClave('SuperClave1', 'OtraClave2');
      expect(res.valido).toBe(false);
      expect(res.motivo).toBe('Las contraseñas no coinciden.');
    });

    it('rechaza si la repetición está vacía', () => {
      const res = validarRepeticionClave('SuperClave1', '');
      expect(res.valido).toBe(false);
      expect(res.motivo).toBe('Debes repetir la contraseña.');
    });
  });
});
