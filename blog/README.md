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
