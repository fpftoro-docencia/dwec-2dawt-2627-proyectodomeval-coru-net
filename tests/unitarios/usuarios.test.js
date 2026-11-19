import { describe, it, expect, beforeEach } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  obtenerUsuarios,
  registrarUsuario,
  autenticarUsuario,
  existeUsuario,
  cambiarRolUsuario,
  filtrarUsuarios,
  CLAVE_USUARIOS,
} from '../../js/datos/usuarios.js';

describe('Módulo de datos: Usuarios y Roles (con AlmacenFalso)', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  it('al principio la lista de usuarios está vacía', () => {
    expect(obtenerUsuarios(almacen)).toEqual([]);
  });

  it('el primer usuario registrado recibe el rol de administrador', async () => {
    const admin = await registrarUsuario(
      { usuario: 'primerAdmin', correo: 'admin@club.es', clave: 'ClaveSegura1' },
      almacen,
    );

    expect(admin.rol).toBe('administrador');
    expect(admin.usuario).toBe('primerAdmin');

    const lista = obtenerUsuarios(almacen);
    expect(lista).toHaveLength(1);
    expect(lista[0].rol).toBe('administrador');
  });

  it('el segundo usuario registrado recibe el rol de usuario normal', async () => {
    await registrarUsuario(
      { usuario: 'primerAdmin', correo: 'admin@club.es', clave: 'ClaveSegura1' },
      almacen,
    );

    const socio = await registrarUsuario(
      { usuario: 'socioClub', correo: 'socio@club.es', clave: 'ClaveSegura2' },
      almacen,
    );

    expect(socio.rol).toBe('usuario');
    const lista = obtenerUsuarios(almacen);
    expect(lista).toHaveLength(2);
    expect(lista[1].rol).toBe('usuario');
  });

  it('no permite registrar un nombre de usuario repetido', async () => {
    await registrarUsuario(
      { usuario: 'ciclista1', correo: 'c1@club.es', clave: 'Clave1234' },
      almacen,
    );

    await expect(
      registrarUsuario(
        { usuario: 'Ciclista1', correo: 'otro@club.es', clave: 'Clave1234' },
        almacen,
      ),
    ).rejects.toThrow(/ya está registrado/);
  });

  it('autentica correctamente con la contraseña correcta o por correo', async () => {
    await registrarUsuario(
      { usuario: 'juan_perez', correo: 'juan@club.es', clave: 'MiPass123' },
      almacen,
    );

    const usuarioAutenticado = await autenticarUsuario('juan_perez', 'MiPass123', almacen);
    expect(usuarioAutenticado).not.toBeNull();
    expect(usuarioAutenticado?.usuario).toBe('juan_perez');

    const porCorreo = await autenticarUsuario('juan@club.es', 'MiPass123', almacen);
    expect(porCorreo).not.toBeNull();
  });

  it('falla la autenticación si la contraseña es incorrecta o el usuario no existe', async () => {
    await registrarUsuario(
      { usuario: 'juan_perez', correo: 'juan@club.es', clave: 'MiPass123' },
      almacen,
    );

    const claveIncorrecta = await autenticarUsuario('juan_perez', 'PassErronea123', almacen);
    expect(claveIncorrecta).toBeNull();

    const usuarioInexistente = await autenticarUsuario('fantasma', 'MiPass123', almacen);
    expect(usuarioInexistente).toBeNull();
  });

  it('permite cambiar el rol de otro usuario pero impide que el admin activo se quite su propio rol', async () => {
    await registrarUsuario(
      { usuario: 'adminPrincipal', correo: 'admin@club.es', clave: 'Clave1234' },
      almacen,
    );
    await registrarUsuario(
      { usuario: 'socioRuta', correo: 'ruta@club.es', clave: 'Clave1234' },
      almacen,
    );

    const ascendido = cambiarRolUsuario('socioRuta', 'administrador', 'adminPrincipal', almacen);
    expect(ascendido.rol).toBe('administrador');

    const degradado = cambiarRolUsuario('socioRuta', 'usuario', 'adminPrincipal', almacen);
    expect(degradado.rol).toBe('usuario');

    expect(() => cambiarRolUsuario('adminPrincipal', 'usuario', 'adminPrincipal', almacen)).toThrow(
      /no puede quitarse su propio rol/,
    );

    expect(() =>
      cambiarRolUsuario('inexistente', 'administrador', 'adminPrincipal', almacen),
    ).toThrow(/No existe ningún usuario/);

    expect(() => cambiarRolUsuario('socioRuta', 'superusuario', 'adminPrincipal', almacen)).toThrow(
      /rol indicado no es válido/,
    );
  });

  it('filtra usuarios por nombre, correo o rol ignorando mayúsculas', async () => {
    await registrarUsuario(
      { usuario: 'adminPrincipal', correo: 'admin@club.es', clave: 'Clave1234' },
      almacen,
    );
    await registrarUsuario(
      { usuario: 'socioRuta', correo: 'ruta@club.es', clave: 'Clave1234' },
      almacen,
    );

    const todos = obtenerUsuarios(almacen);
    expect(filtrarUsuarios(todos, '')).toHaveLength(2);
    expect(filtrarUsuarios(todos, 'RUTA')).toHaveLength(1);
    expect(filtrarUsuarios(todos, 'administrador')).toHaveLength(1);
    expect(filtrarUsuarios(null, 'x')).toEqual([]);
  });

  it('no falla si lo guardado en el almacén está estropeado (devuelve valor por defecto)', () => {
    almacen.setItem(CLAVE_USUARIOS, '{ json roto corrupto ;;;');

    expect(() => obtenerUsuarios(almacen)).not.toThrow();
    expect(obtenerUsuarios(almacen)).toEqual([]);
    expect(existeUsuario('cualquiera', almacen)).toBe(false);
  });
});
