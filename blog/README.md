# Blog del proyecto

Diario de aprendizaje del proyecto DOM para DWEC (2º DAWT, 2026/2027).

---

## 05/11/2026 · Sprint 1 · Autenticación, sesión y primera integración continua

### Dificultades y cómo las resolví

- **La asincronía del resumen SHA-256 (`resumirClave`):**  
  Al principio, al enviar el formulario de registro, intentaba leer el hash de la contraseña directamente como un valor síncrono. Esto provocaba que en `localStorage` se guardase un objeto `Promise` en lugar del texto hexadecimal de 64 caracteres. Tras revisar la documentación del proyecto, entendí que `crypto.subtle.digest` no bloquea el hilo principal del navegador. Lo resolví marcando el manejador del formulario como `async` y esperando el resultado con `await resumirClave(clave)` antes de proceder a la creación del usuario.

- **Prevención del doble envío concurrente:**  
  Durante el cálculo asíncrono del hash de la clave, si el usuario hacía doble clic rápido en «Entrar» o pulsaba «Intro» repetidas veces, se disparaban dos procesos de autenticación simultáneos. Lo resolví introduciendo un flag booleano `enviando = true` y deshabilitando el botón (`boton.disabled = true; boton.textContent = 'Verificando...';`) en el momento en que se inicia el envío, reactivándolo únicamente en el bloque `finally`.

- **Lecturas resilientes ante datos corruptos:**  
  Si un usuario manipula manualmente `localStorage` o el almacenamiento contiene JSON roto, `JSON.parse` lanza un error fatal de sintaxis que congelaba la aplicación al cargar. Creé una función envoltorio `leerJSON(almacen, clave, valorPorDefecto)` protegida con un bloque `try/catch` que captura cualquier fallo de deserialización y devuelve una lista vacía `[]` o `null`, garantizando que la aplicación nunca se rompa.

### Problemas conceptuales

- **¿Por qué `localStorage` para usuarios y `sessionStorage` para sesión?**  
  Los datos de los usuarios registrados deben persistir entre diferentes visitas y pestañas, por lo que su lugar idóneo es `localStorage`. En cambio, la sesión activa representa la identidad autenticada en una pestaña concreta del navegador. Si el usuario cierra la pestaña o la ventana, `sessionStorage` se destruye automáticamente, impidiendo que otra persona que use el mismo ordenador acceda a su sesión sin volver a identificarse.

- **Expresiones regulares con propiedades Unicode (`\p{Ll}` y `\p{Lu}`):**  
  Las clases tradicionales `[a-z]` y `[A-Z]` solo reconocen caracteres ASCII básicos en inglés. Si un usuario introduce letras acentuadas (como *Ángel* o *María*) o la letra *ñ*, las clases normales no las identifican como letras mayúsculas o minúsculas. Con el flag `u` y las categorías Unicode `\p{Lu}` (Letra Mayúscula) y `\p{Ll}` (Letra Minúscula), el validador analiza cualquier alfabeto correctamente.  
  *Ejemplo en `js/logica/validadores.js`:*
  ```javascript
  const esMayuscula = /\p{Lu}/u.test(caracter);
  ```

- **Desacoplamiento de avisos con `CustomEvent` y burbuja:**  
  En lugar de que cada formulario o función conozca dónde está el contenedor de avisos en el DOM, cualquier componente lanza un evento nativo desacoplado:
  ```javascript
  elemento.dispatchEvent(new CustomEvent('aviso', {
    bubbles: true,
    detail: { mensaje: 'Bienvenido', tipo: 'success' }
  }));
  ```
  Al activar `bubbles: true`, el evento asciende por el árbol del DOM hasta llegar a `document`, donde un único oyente centralizado lo recibe y genera la alerta accesible con `role="status"`.

---

## 12/11/2026 · Sprint 2 · CRUD de Socios Ciclistas, plantillas `<template>`, paginación y pruebas E2E

### Dificultades y cómo las resolví

- **Comportamiento de `<template>` al inyectar el `<body>` en Happy-DOM (`cargarPagina`):**  
  Al ejecutar los primeros tests de integración con `cargarPagina('listado.html')`, observé que cuando una etiqueta `<template>` contenía directamente elementos `<tr>` y `<td>` fuera de una tabla y se volcaba mediante `document.body.innerHTML`, el analizador de fragmentos HTML descartaba las etiquetas `<tr>`. Además, tener `<script type="module">` dentro del `<body>` hacía que Happy-DOM intentase cargar el archivo JS externo y lanzara un `NotSupportedError`. Lo solucioné moviendo los `<script type="module">` al `<head>` (ya que los módulos ES se difieren de forma nativa) y estructurando las filas del `<template>` con elementos semánticos `<article class="fila-socio">`, logrando compatibilidad total tanto en navegadores reales como en Happy-DOM.

- **IDs únicos y asociación accesible en el grupo dinámico de bicicletas:**  
  Al clonar hasta 3 bloques desde `<template id="plantilla-bicicleta">`, si los campos compartían el mismo `id`, los `<label>` apuntaban siempre a la primera bicicleta y `FormData` sobrescribía los valores. Lo resolví llevando un contador incremental por inserción (`bici-marca-${sufijo}`, `bici-modelo-${sufijo}`) que enlaza dinámicamente `label.setAttribute('for', id)`, `input.id`, `input.name` y `input.setAttribute('aria-describedby', idError)`.

- **Modo estricto de selectores en Playwright (`strict mode violation`):**  
  En el recorrido E2E del CRUD (`e2e/crud.spec.js`), al dar de alta a «Alejandro Valverde» y comprobar en el listado `page.getByText('Alejandro Valverde')`, Playwright falló indicando que coincidía con dos nodos: la alerta superior de confirmación y la celda del listado. Lo corregí utilizando `page.getByText('Alejandro Valverde', { exact: true })` para apuntar inequívocamente a la celda con el nombre exacto del socio.

### Problemas conceptuales

- **Diferencia entre fase de captura (`blur`) y fase de burbuja (`input`) en la validación de formularios:**  
  El evento `blur` (cuando el usuario sale de un campo) **no burbujea** (`bubbles: false`), mientras que `input` sí lo hace. Para evitar registrar decenas de oyentes individuales en cada input (especialmente cuando se añaden bicicletas dinámicamente), delegué ambos eventos en el elemento `<form>`:
  ```javascript
  // `blur` no sube en burbuja: lo interceptamos en el formulario durante la fase de captura (tercer argumento `true`)
  formulario.addEventListener('blur', (evento) => {
    camposTocados.add(evento.target);
    validarElementoIndividual(evento.target);
  }, true);

  // `input` sí sube en burbuja: solo revalidamos si el campo ya fue visitado antes
  formulario.addEventListener('input', (evento) => {
    if (camposTocados.has(evento.target)) {
      validarElementoIndividual(evento.target);
    }
  });
  ```

- **Por qué combinar `hidden` y `disabled` en los campos condicionales:**  
  Ocultar visualmente el contenedor de la licencia federativa con `hidden = true` impide que el usuario lo vea, pero si el `<input>` interno no tiene además `disabled = true`, el navegador seguiría incluyéndolo en `new FormData(formulario)` y en las validaciones de envío. Al sincronizar ambos atributos (`contenedor.hidden = !activo` y `campo.disabled = !activo`), cuando el socio no está federado el control queda completamente excluido de los datos enviados.

- **Búsqueda insensible a tildes con normalización Unicode `NFD` y `debounce`:**  
  Para que al buscar `alvaro` o `master` aparezcan «Álvaro» y «Máster 30», descompuse los caracteres acentuados en su letra base + marca diacrítica con `.normalize('NFD')` y eliminé el rango Unicode de diacríticos `[\u0300-\u036f]`:
  ```javascript
  export function normalizarTextoBusqueda(texto) {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
  ```
  Combinado con un `debounce` de 250 ms probado con `vi.useFakeTimers()` y `vi.advanceTimersByTime()`, evitamos recalcular y repintar el DOM en cada pulsación rápida de teclado.

---

## 19/11/2026 · Sprint 3 · Despliegue continuo, pruebas E2E contra despliegues, Release automatizada y JSDoc

### Dificultades y cómo las resolví

- **Diferencias entre sintaxis de tipos TypeScript y el analizador Catharsis de JSDoc (`jsdoc -c jsdoc.json`):**  
  Al ejecutar `npm run docs` para generar la documentación estática del proyecto, el parser Catharsis de JSDoc 4 rechazaba anotaciones propias de TypeScript como propiedades opcionales en tipos inline (`{{ valido: boolean, motivo?: string }}`), funciones flecha (`{(u: string) => boolean}`) o `ReturnType<typeof setTimeout>`. Lo solucioné declarando bloques `@typedef {Object} ResultadoValidacion` con `@property {string} [motivo]` y empleando tipos estándar de JSDoc (`{Function}`, `{number|null}`, `{Array<Object>}`), logrando que `npm run docs` genere toda la documentación sin un solo error.

- **Selectores ambiguos en la prueba de humo (`e2e/humo.spec.js`):**  
  En la página de portada (`index.html`) existen varios enlaces hacia `registro.html` (en la barra superior, en la cabecera, en el Hero y en el pie de la tarjeta de login). Al usar `page.locator('a[href="registro.html"]')` en la prueba de humo, Playwright abortó por modo estricto al encontrar 5 coincidencias. Lo resolví empleando un selector semántico basado en rol y nombre accesible: `page.getByRole('link', { name: 'Regístrate como socio' })`.

### Problemas conceptuales

- **Ejecución de Playwright contra despliegues remotos mediante `deployment_status` y `BASE_URL`:**  
  En `playwright.config.js`, cuando la variable de entorno `BASE_URL` está definida, Playwright no arranca ningún servidor local (`webServer: undefined`), sino que dirige el navegador Chromium directamente hacia la URL remota indicada. Al escuchar el evento `deployment_status` en `.github/workflows/despliegue.yml` y filtrar `github.event.deployment_status.state == 'success'`, podemos ejecutar exactamente la misma batería E2E contra la vista previa recién publicada por Vercel antes de promoverla a producción.

- **Automatización de entregas con etiquetas Git (`v*`) y `gh release create`:**  
  El flujo `.github/workflows/release.yml` garantiza que ninguna versión etiquetada (`v1.0`) se publique sin haber superado antes tres barreras secuenciales: `Comprobar` (calidad, cobertura >= 90 %, JSDoc y compilación `dist/`), `Humo` (prueba E2E rápida de disponibilidad) y `Release` (empaquetado `.zip` de `dist/` y creación de la Release en GitHub con notas generadas automáticamente a partir del historial de commits).

