// ═══════════════════════════════════════════════════════════════
// tests/playwright/tools.spec.js
//
// Smoke tests pour tools.html — couvre le minimum vital avant
// refactor Phase 1 (sidebar groupée, fix oninput doublés, etc.).
//
// Deux describe :
//   • "Baseline"  — doit passer AUJOURD'HUI, avant tout fix.
//   • "Acceptance Phase 1" — documente les bugs identifiés.
//     Marqués test.fail() : ils RUNNENT mais sont attendus en échec.
//     Quand Phase 1 lande, ces tests doivent flipper vert → on retire
//     les `.fail` et la PR Phase 1 est validée.
// ═══════════════════════════════════════════════════════════════
const { test, expect } = require('@playwright/test');
const { collectErrors } = require('./helpers');

test.describe('tools.html — Baseline (passe avant Phase 1)', () => {

  test('charge sans erreur console et affiche les 12 onglets', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/tools.html');

    await expect(page.locator('.hero h1')).toContainText(/Calculateurs/i);

    const tabs = page.locator('.tnav-btn[role="tab"]');
    await expect(tabs).toHaveCount(12);

    // Laisse le temps aux scripts defer de tout exécuter
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
    // Le bouton "⟹ Convertir" est dans le même .tc que le champ ts-val
    await page.locator('#tool-ts button.calc-btn').first().click();
    await expect(page.locator('#ts-result')).toContainText('2023');
  });

  test('Hex↔ASCII live converter : "48 65 6C 6C 6F" → "Hello"', async ({ page }) => {
    await page.goto('/tools.html');
    await page.click('#tab-tool-hex');
    await page.fill('#cv-hex', '48 65 6C 6C 6F');
    // Cet outil a un oninput SAIN (un seul attribut) → live update OK aujourd'hui
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
});

// ═══════════════════════════════════════════════════════════════
// Acceptance Phase 1 — bugs identifiés dans la revue.
// Ces tests sont marqués test.fail() : ils décrivent le comportement
// CORRECT (post-fix). En attendant Phase 1, ils échouent — c'est
// volontaire. Le jour où Phase 1 est merged, ils passent vert et
// on retire les `.fail`.
// ═══════════════════════════════════════════════════════════════
test.describe('tools.html — Acceptance Phase 1 (échec attendu avant fix)', () => {

  test.fail('BUG L338-339 : Magic Bytes identifie JPEG en saisissant "FF D8 FF E0"', async ({ page }) => {
    await page.goto('/tools.html');
    await page.click('#tab-tool-magic');
    await page.fill('#magic-in', 'FF D8 FF E0');
    // Aujourd'hui : oninput="saveLastVal('magic-in')" puis un second
    // oninput="identifyMagic()" → seul le premier est conservé par le
    // parseur. identifyMagic ne se déclenche jamais.
    await expect(page.locator('#magic-result')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('#magic-result')).toContainText(/JPEG/i);
  });

  test.fail('BUG L357 : Bitmap décode "0F A2 FF" en temps réel', async ({ page }) => {
    await page.goto('/tools.html');
    await page.click('#tab-tool-bitmap');
    await page.fill('#bm-in', '0F A2 FF');
    // Aujourd'hui : oninput="saveLastVal('bm-in')" puis oninput="decodeBitmap()"
    // → seul saveLastVal s'exécute, rien ne s'affiche.
    await expect(page.locator('#bm-result')).not.toBeEmpty();
  });

  test.fail('BUG L375 : Hash ID identifie un SHA-256 par sa longueur', async ({ page }) => {
    await page.goto('/tools.html');
    await page.click('#tab-tool-hashid');
    // 64 chars hex = signature SHA-256
    await page.fill('#hashid-in', 'a'.repeat(64));
    await expect(page.locator('#hashid-result')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('#hashid-result')).toContainText(/SHA-256/i);
  });

  test.fail('BUG L305 : les 12 panels sont tous dans le conteneur .page', async ({ page }) => {
    await page.goto('/tools.html');
    // </div><!-- /.page --> est mal placé ligne 305 : 6 panels (sfn, magic,
    // bitmap, hashid, cluster, mft) sortent du .page (max-width:860px) et
    // s'étalent en pleine largeur sur desktop.
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
