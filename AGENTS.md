# Memoria y Reglas del Proyecto: Club Ciclista Pedal & Cadencia

Este documento define la visión, el estilo visual y las reglas técnicas obligatorias que la IA (Antigravity) debe seguir en **todas** las intervenciones de este proyecto.

---

## 1. Visión y Tema del Proyecto
- **Nombre:** Club Ciclista Pedal & Cadencia.
- **Propósito:** Aplicación web de gestión para los socios de un club ciclista oficial. Permite registrarse, iniciar sesión, gestionar el parque de bicicletas de cada socio (de 0 a 3), tramitar licencias federativas y administrar permisos.
- **Entidad principal del CRUD (Requisito 13):** Socio Ciclista.
  - Campos: Nombre completo (`text`), DNI (`text` con validación Regex + algoritmo matemático módulo 23), Fecha de nacimiento (`date`), Categoría (`select`: Sub-23, Élite, Máster 30, Máster 40, Cicloturista), Cuota mensual (`number`), ¿Federado? (`checkbox`).
  - Campo condicional: *Licencia federativa* (`hidden` y `disabled` a menos que la casilla ¿Federado? esté marcada).
  - Grupo dinámico: *Bicicletas registradas* (de 0 a 3 bicicletas, plantilla `<template>`, botones añadir/eliminar con límites).

---

## 2. Identidad Visual y Diseño (Inspiración Specialized)
- **Referencia estética:** Web oficial de **Specialized** (`specialized.com`).
- **Paleta de colores:**
  - Negro carbón / Jet Black: `#0f0f11` y `#1a1a1d`.
  - Blanco puro: `#ffffff` para tarjetas, fondos y contraste.
  - Rojo competición (Racing Accent): `#d90429` / `#ef233c`.
  - Gris técnico de fondo: `#f5f6f8`.
- **Tipografía y Estilo:**
  - Deportiva, moderna, enérgica.
  - Logotipo del club en mayúsculas y cursiva: `PEDAL & CADENCIA`.
  - Botones con estilo Specialized: rectangulares con bordes limpios, mayúsculas con tracking/espaciado (`letter-spacing: 0.8px`), versiones sólidas blancas o negras y versiones outline.
  - Hero banner impactante con ciclistas en paisajes montañosos y títulos de alto contraste.

---

## 3. Contrato Técnico Inquebrantable (DWEC)
1. **Librerías prohibidas:** Cero librerías externas. **SOLO el CSS de Bootstrap** importado desde `node_modules/bootstrap/dist/css/bootstrap.min.css`. **PROHIBIDO el JavaScript de Bootstrap** (los menús, alertas, diálogos y modales los programamos con JavaScript nativo).
2. **Sin APIs remotas:** No hay backend ni llamadas a servidores externos para datos. Todo el almacenamiento se realiza en el navegador:
   - `localStorage`: Usuarios registrados (`club_usuarios`) y registros del CRUD (`socios_<usuario>`).
   - `sessionStorage`: Sesión activa en la pestaña (`club_sesion_activa`) y avisos pendientes (`club_aviso_pendiente`).
3. **Seguridad y contraseñas:** Las contraseñas se almacenan **únicamente** como hash SHA-256 usando `resumirClave` de `js/clave.js`.
4. **Roles:** El **primer usuario** que se registre es automáticamente `administrador`. Los siguientes son `usuario`.
5. **Navegación y Páginas:**
   - Las 5 páginas oficiales en la raíz: `index.html`, `registro.html`, `listado.html`, `ficha.html`, `usuarios.html`.
   - Protección con `location.replace`: Sin sesión, no se puede acceder a las páginas privadas.
   - `usuarios.html` solo accesible para el rol `administrador`.
6. **Sistema de Avisos:** Mediante `CustomEvent('aviso', { bubbles: true, detail: { mensaje, tipo } })` con oyente centralizado en `document` y región accesible con `role="status"`.
7. **Visibilidad de Contraseñas (Toggle / 'Ojito'):** En los formularios con campos de contraseña (en particular en el alta de socio ciclista `registro.html` y en el inicio de sesión `index.html`), se debe incluir siempre un botón accesible (`type="button"`, con icono de ojo 👁️/🙈, `aria-label` y `aria-pressed`) para permitir al usuario alternar entre visualizar u ocultar el texto que está escribiendo (`type="password"` <-> `type="text"`).

---

## 4. Calidad, Testing y CI/CD
- **ESLint:** Reglas obligatorias añadidas: `camelcase`, `curly`, `no-console`.
- **Vitest:**
  - Unitarios en `tests/unitarios/` usando `AlmacenFalso` para desacoplar el DOM y el almacenamiento.
  - Tablas `it.each` para todos los validadores de expresiones regulares y requisitos de contraseña (`\p{Ll}`, `\p{Lu}`, etc.).
  - Cobertura $\ge 90\%$ en funciones puras (`vitest.config.js`).
- **Playwright (E2E):** Pruebas en `e2e/` (sesión y flujo completo del CRUD).
- **Flujo Git:** Trabajo obligatorio en ramas de funcionalidad (`feature/...`) con Pull Requests hacia `main`. Sprints cerrados con tags Git (`v0.1`, `v0.2`, `v1.0`).
