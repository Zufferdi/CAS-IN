// ═══════════════════════════════════════════════════════════════
// tests/playwright/tools.spec.js
//
// Smoke tests pour tools.html.
// Phase 1 mergée → les acceptance tests sont passés en baseline.
// ═══════════════════════════════════════════════════════════════
const { test, expect } = require('@playwright/test');
const { collectErrors } = require('./helpers');

test.describe('tools.html — Baseline', () => {

  test('charge sans erreur console et affiche les 12 onglets', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/tools.html');

    await expect(page.locator('.hero h1')).toContainText(/Calculateurs/i);

    const tabs = page.locator('.tnav-btn[role="tab"]');
    await expect(tabs).toHaveCount(12);

    await page.waitForLoadState('networkidle');
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });

  test('clic sur chaque onglet affiche le bon panel et marque aria-selected', async ({ page }) => {
    await page.goto('/tools.html');

    const tabIds = ['ts','rl','fat','ntfs','hex','enc','sfn','magic','bitmap','hashid','cluster','mft'];
    for (const id of tabIds) {
      await page.click(`#tab-tool-${id}`);
      await expect(page.locator(`#tool-${id}`)).toBeVisible();
      await expect(page.locator(`#tab-tool-${id}`)).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('Timestamps : Unix 1700000000 → contient "2023"', async ({ page }) => {
    await page.goto('/tools.html');
    await page.selectOption('#ts-fmt', 'unix');
    await page.fill('#ts-val', '1700000000');
    await page.locator('#tool-ts button.calc-btn').first().click();
    await expect(page.locator('#ts-result')).toContainText('2023');
  });

  test('Hex↔ASCII live converter : "48 65 6C 6C 6F" → "Hello"', async ({ page }) => {
    await page.goto('/tools.html');
    await page.click('#tab-tool-hex');
    await page.fill('#cv-hex', '48 65 6C 6C 6F');
    await expect(page.locator('#cv-asc')).toHaveValue('Hello');
  });

  test('Navigation clavier : flèches ←/→ déplacent le focus entre onglets', async ({ page }) => {
    await page.goto('/tools.html');
    await page.focus('#tab-tool-ts');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-tool-rl')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.locator('#tab-tool-ts')).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.locator('#tab-tool-mft')).toBeFocused();
  });

  // ── Fix Phase 1 : oninput doublés (magic-in, bm-in, hashid-in) ──

  test('Magic Bytes identifie JPEG en saisissant "FF D8 FF E0"', async ({ page }) => {
    await page.goto('/tools.html');
    await page.click('#tab-tool-magic');
    await page.fill('#magic-in', 'FF D8 FF E0');
    await expect(page.locator('#magic-result')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('#magic-result')).toContainText(/JPEG/i);
  });

  test('Bitmap décode "0F A2 FF" en temps réel', async ({ page }) => {
    await page.goto('/tools.html');
    await page.click('#tab-tool-bitmap');
    await page.fill('#bm-in', '0F A2 FF');
    // bm-result n'a pas la classe result-box — décodeBitmap écrit directement
    await expect(page.locator('#bm-result')).not.toBeEmpty();
  });

  test('Hash ID identifie un SHA-256 par sa longueur (64 chars hex)', async ({ page }) => {
    await page.goto('/tools.html');
    await page.click('#tab-tool-hashid');
    await page.fill('#hashid-in', 'a'.repeat(64));
    await expect(page.locator('#hashid-result')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('#hashid-result')).toContainText(/SHA-256/i);
  });

  // ── Fix Phase 1 : `</div>` mal placé sortait 6 panels du conteneur ──

  test('Les 12 panels sont tous dans le conteneur .page', async ({ page }) => {
    await page.goto('/tools.html');
    const all = ['tool-ts','tool-rl','tool-fat','tool-ntfs','tool-hex','tool-enc',
                 'tool-sfn','tool-magic','tool-bitmap','tool-hashid','tool-cluster','tool-mft'];
    const outsideOfPage = [];
    for (const id of all) {
      const isInside = await page.locator(`.page #${id}`).count();
      if (isInside === 0) outsideOfPage.push(id);
    }
    expect(outsideOfPage, `Panels hors .page : ${outsideOfPage.join(', ')}`).toEqual([]);
  });
});
