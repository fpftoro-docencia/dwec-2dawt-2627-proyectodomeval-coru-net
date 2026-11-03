# Nombre de tu aplicación

<!-- Sprint 2: la insignia de tu workflow, con tu organización y tu repositorio. -->
![Integración continua](https://github.com/<organización>/<repositorio>/actions/workflows/ci.yml/badge.svg)

<!-- Completa cada sección a medida que avanzas en los sprints. Borra los comentarios como este
     cuando termines. Este README es también la portada de la documentación que genera `npm run docs`.
     No cambies los títulos de las secciones (##): la corrección los busca por su nombre. -->

## Mi proyecto

<!-- Sprint 1. De qué es tu aplicación y para quién, en dos o tres frases. -->

**Web publicada:** <!-- https://<proyecto>.vercel.app -->

### La entidad

<!-- Sprint 2 (puedes adelantarla en el sprint 1). Una fila por campo, con los mínimos del requisito 13:
     marca el campo condicional y el grupo dinámico (con su mínimo y su máximo). -->

| Campo | Control | Obligatorio | Regla de validación | Mensaje si no se cumple |
|-------|---------|:-----------:|---------------------|-------------------------|
| | | | | |

### El registro de usuarios

| Campo | Control | Regla | Mensaje |
|-------|---------|-------|---------|
| | | | |

### Páginas

| Página | Acceso | Qué hace |
|--------|--------|----------|
| `index.html` | Pública | |
| `registro.html` | Pública | |
| `listado.html` | Usuarios | |
| `ficha.html` | Usuarios | |
| `usuarios.html` | Administradores | |

## Arquitectura y módulos

<!-- 1. Un diagrama (Mermaid) de tus módulos y de qué usa cada uno.
     2. Tabla con cada módulo: qué hace, si usa el DOM y qué exporta.
     3. Cómo están hechos tus objetos (funciones fábrica o clases) y qué patrones de diseño usas
        (al menos dos): dónde y por qué.
     4. Cómo reciben las páginas lo que necesitan (almacenamiento, sesión, navegación) y por qué así
        se pueden probar.
     5. Qué documenta tu JSDoc y cómo se genera la documentación (`npm run docs`). -->

## Cómo ejecutarlo

<!-- Cómo abrir el proyecto en el Dev Container y ver la web, y cómo pasar los tests, la cobertura,
     las pruebas de extremo a extremo, ESLint y Prettier, generar la documentación y preparar la web
     publicable (`npm run build`). -->

## Almacenamiento y sesión

<!-- 1. Tabla con cada clave que usas: dónde está (localStorage o sessionStorage), qué guarda y un
        ejemplo de su contenido.
     2. Por qué cada dato va donde va.
     3. Cómo guardas el rol y cómo proteges las páginas por sesión y por rol.
     4. Por qué este inicio de sesión NO es seguro: qué podría hacer alguien con las DevTools y cómo
        se hace en una aplicación real. -->

## Funcionalidad y formularios

<!-- Una subsección por parte de la aplicación (sesión y registro, listado y paginación, ficha,
     zona de administración): qué hace y cómo lo has resuelto. Incluye:
     - cómo lees los datos (FormData: get, getAll), cómo creas y numeras el grupo dinámico, cómo
       funciona el campo condicional, qué atributos pones desde el código y cómo rellenas el
       formulario al editar;
     - la validación: cuándo validas cada campo, de dónde salen los mensajes (validity,
       setCustomValidity y tus validadores), qué haces para que los errores sean accesibles y cómo
       evitas el doble envío;
     - las expresiones regulares: tabla con cada una, en qué validador está, qué acepta (un ejemplo)
       y qué significan sus partes y sus flags; qué parte de la validación hace la expresión y qué
       parte el código. -->

## Eventos

### Eventos en el HTML

<!-- Qué consigues con el HTML sin escribir oyentes (envío con Intro, novalidate y los atributos de
     validación, dialog, label for…) y por qué no usas atributos on…. -->

### Tipos de eventos

<!-- Tabla con los eventos que usas y por qué has elegido cada uno frente a otros parecidos
     (submit frente a click, input frente a change, blur frente a focusout…). -->

### Propagación

<!-- 1. Tabla con TODOS tus oyentes: evento, dónde lo registras, en qué fase actúa
        (captura, objetivo o burbuja) y para qué.
     2. Dónde usas la delegación y qué ganas con ella.
     3. Tu uso de la captura y por qué no servía la burbuja.
     4. Si usas stopPropagation, por qué. -->

## Pruebas y cobertura

<!-- 1. Tabla de la pirámide: tipo (unitario, de integración o de extremo a extremo), fichero,
        qué prueba y cuántos tests tiene. Por qué cada cosa se prueba en ese nivel y no en otro.
     2. Cómo simulas al usuario (eventos, requestSubmit), los servicios (AlmacenFalso, el resumen
        de la contraseña, la navegación) y el tiempo (temporizadores falsos).
     3. Cómo se ejecutan las mismas pruebas de extremo a extremo con serve y contra la web
        desplegada (BASE_URL).
     4. Pega la salida de `npm run coverage` (con el resumen de la cobertura) y de `npm run e2e`.
        Explica qué umbral has puesto, a qué ficheros y qué queda sin probar y por qué. -->

## Integración continua

### ESLint y Prettier

<!-- Sprint 1. Las reglas que has añadido a eslint.config.js (al menos tres): qué comprueba cada una
     y por qué la quieres. Pega la salida de `npm run lint` y de `npm run format:check`. Cuenta un
     problema real que encontraras con el depurador de las DevTools y cómo lo resolviste. -->

### El workflow

<!-- Sprints 1 y 2. Qué hace ci.yml: cuándo se ejecuta, la tabla de sus trabajos y por qué están en
     ese orden, qué artefactos sube y para qué sirven, y qué hace concurrency. -->

| Trabajo | Espera a | Pasos | Artefacto |
|---------|----------|-------|-----------|
| `Calidad` | — | | — |
| `Tests` | | | |
| `E2E` | | | |

**Ejecución en verde con sus artefactos:** <!-- enlace -->

## Despliegue continuo

<!-- Sprint 3. 1. Cómo has configurado Vercel: build, carpeta de salida, protección de los
        despliegues y Deployment Checks (qué comprobaciones exige y por qué).
     2. Qué hacen despliegue.yml y release.yml, y qué comprueba tu prueba de humo.
     3. El camino de un cambio, con tus palabras: desde tu git push en una rama hasta que se ve en
        la web, qué se comprueba en cada paso y qué pasa si algo falla. -->

**Web publicada:** <!-- https://<proyecto>.vercel.app -->

| Evidencia | Enlace | Captura |
|-----------|--------|---------|
| *Pull request* con su vista previa y `E2E desplegado` | <!-- enlace a la pull request --> | `img/pr-comprobaciones.png` |
| Versión retenida por Vercel | <!-- enlace a la ejecución en rojo --> | `img/vercel-retenido.png` |
| Release `v1.0` | <!-- enlace a la Release --> | — |

<!-- Qué rompiste a propósito para la versión retenida, qué viste en Vercel y cómo comprobaste que la
     web seguía con la versión anterior. -->

## Organización del trabajo

### Definición de Hecho

<!-- Sprint 1. Tu lista de condiciones para dar una tarea por terminada. Cada una tiene que poder
     comprobarse. Si la cambias en algún sprint, di qué cambiaste y por qué. -->

- [ ] <!-- … -->

### Sprints

<!-- Una fila por sprint. La reflexión: qué salió bien, qué no, qué cambias para el siguiente
     (cuatro o cinco líneas, sobre tu trabajo y no sobre el enunciado). -->

| Sprint | *Tag* | Qué incluye | Reflexión |
|--------|-------|-------------|-----------|
| 1 | `v0.1` | | |
| 2 | `v0.2` | | |
| 3 | `v1.0` | | |

**Tablero de Trello:** <!-- enlace (compartido con el profesor) -->

**Blog del proyecto:** [blog/README.md](blog/README.md) <!-- dificultades y problemas conceptuales de cada sprint -->

### Ramas y versiones

<!-- 1. Tabla con tus ramas: nombre, qué funcionalidad y enlace a su pull request.
     2. Si integras con merge o con rebase, y por qué.
     3. Qué deja fuera tu .gitignore y por qué. -->

| Rama | Funcionalidad | *Pull request* |
|------|---------------|----------------|
| | | |

**Versión de entrega:** `v1.0`
