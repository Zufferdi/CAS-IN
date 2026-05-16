// ═══════════════════════════════════════════════════════════════
// playwright.config.js
//
// Smoke tests pour CAS-IN. Serveur statique = python3 -m http.server
// (cohérent avec le déploiement GitHub Pages : juste des fichiers HTML/CSS/JS).
//
// Chrome only par défaut : on teste un produit dont 90 % des bugs sont du
// DOM/CSS/JS pur. Multi-navigateurs serait du sur-test pour Phase 0.
// Décommenter Firefox/WebKit dans `projects` si besoin un jour.
//
// Pour lancer en local : npm test
// ═══════════════════════════════════════════════════════════════
const { defineConfig, devices } = require('@playwright/test');

const PORT = 8765;

module.exports = defineConfig({
  testDir: './tests/playwright',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  // Évite qu'un .only oublié sur main ne shippe en CI
  forbidOnly: !!process.env.CI,

  // Un retry en CI pour absorber le flake réseau, zéro en local
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  fullyParallel: true,

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : 'list',

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Pas d'accumulation de cache HTTP entre tests
    extraHTTPHeaders: { 'Cache-Control': 'no-cache' },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // { name: 'firefox',       use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',        use: { ...devices['Desktop Safari']  } },
    // { name: 'mobile-chrome', use: { ...devices['Pixel 5']         } },
  ],

  webServer: {
    // python3 est dispo dans tous les environnements de dev de ce repo
    // (scripts/*.py l'utilisent déjà). Pas besoin d'un Node-server.
    command: `python3 -m http.server ${PORT}`,
    url:     `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
