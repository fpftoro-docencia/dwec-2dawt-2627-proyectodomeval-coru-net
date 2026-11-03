import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    exclude: [...configDefaults.exclude, 'e2e/**'], // las pruebas de e2e/ son de Playwright
    // `npm run coverage` mide la cobertura. Sprint 2: completa esta sección (requisito 21 del enunciado)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'], // `text` en la terminal y `html` en coverage/, que sube el workflow
      // TODO: include con los ficheros de tus funciones puras (validadores y paginar)
      // TODO: thresholds con el umbral de líneas (al menos el 90 %): si no se llega, `npm run coverage` falla
    },
  },
});
