// Configuración de Playwright (no hace falta modificarla)
import { defineConfig, devices } from '@playwright/test';

// Con BASE_URL, las pruebas se ejecutan contra esa dirección (por ejemplo, la web desplegada) y no se
// arranca ningún servidor. Sin ella, se prueba la web local, servida con `serve` en el puerto 3901.
const BASE_URL = process.env.BASE_URL;

export default defineConfig({
  testDir: 'e2e',
  // En la integración continua: sin test.only olvidados, y el informe en HTML
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: BASE_URL ?? 'http://localhost:3901' },
  // Arranca el servidor de la página antes de las pruebas (o usa el del Dev Container)
  webServer: BASE_URL
    ? undefined
    : {
        command: 'npx --yes serve@14.2.6 --no-clipboard --listen 3901 .',
        url: 'http://localhost:3901',
        reuseExistingServer: true,
      },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
