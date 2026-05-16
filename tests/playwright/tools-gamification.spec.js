// ═══════════════════════════════════════════════════════════════
// tests/playwright/tools-gamification.spec.js
//
// Phase 3b — tools.html branché au système Profile + Achievements.
//
// Couvre :
//   • L'usage d'un outil incrémente localStorage.tools_used[key]
//   • La rafale de keystrokes dans Hex↔ASCII = 1 incrément (debounce 500ms)
//   • 5 outils différents → tools_swiss_knife débloqué dans Profile
//   • Le même outil 20 fois → tools_artisan débloqué
//   • 12 outils différents → tools_polymath débloqué
//
// Les tests Phase 1+2 (tools.spec.js / tp.spec.js / profile.spec.js)
// ne sont pas modifiés — ils doivent rester verts.
// ═══════════════════════════════════════════════════════════════
const { test, expect } = require('@playwright/test');
const { collectErrors, readLS } = require('./helpers');

test.describe('tools.html — Gamification (Phase 3b)', () => {

  test('tools.html charge avec Profile + AchievementsCore + ToolsProfileBridge', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/tools.html');

    // Tous les scripts en defer → on attend la fin
    await page.waitForFunction(() => {
      return typeof window.Profile?.snapshot === 'function'
        && typeof window.AchievementsCore?.evalAndUnlock === 'function'
        && typeof window.ToolsProfileBridge?.notifyToolUse === 'function';
    }, { timeout: 5000 });

    await page.waitForLoadState('networkidle');
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });

  test("la catégorie 'Tools · Calculateurs' est exposée avec 3 achievements", async ({ page }) => {
    await page.goto('/tools.html');
    await page.waitForFunction(() => typeof window.AchievementsCore?.byCategory === 'function');

    const cats = await page.evaluate(() => {
      const all = window.AchievementsCore.byCategory();
      return { keys: Object.keys(all), toolsAch: (all['Tools · Calculateurs'] || []).map(a => a.id) };
    });

    expect(cats.keys, JSON.stringify(cats.keys)).toContain('Tools · Calculateurs');
    expect(cats.toolsAch).toEqual(['tools_swiss_knife', 'tools_artisan', 'tools_polymath']);
  });

  test('Timestamps : 1 conversion réussie → tools_used.ts incrémenté', async ({ page }) => {
    await page.goto('/tools.html');
    await page.waitForFunction(() => typeof window.ToolsProfileBridge?.notifyToolUse === 'function');

    await page.selectOption('#ts-fmt', 'unix');
    await page.fill('#ts-val', '1700000000');
    await page.locator('#tool-ts button.calc-btn').first().click();

    // Debounce 500ms + un peu de marge pour le SW etc.
    await page.waitForTimeout(700);

    const used = await readLS(page, 'tools_used', {});
    expect(used.ts, JSON.stringify(used)).toBe(1);
  });

  test('Hex↔ASCII rafale de keystrokes → 1 seul incrément (debounce 500ms)', async ({ page }) => {
    await page.goto('/tools.html');
    await page.waitForFunction(() => typeof window.ToolsProfileBridge?.notifyToolUse === 'function');

    await page.click('#tab-tool-hex');
    // Tape "Hello" caractère par caractère — 5 invocations de cvFrom
    await page.locator('#cv-hex').pressSequentially('48 65 6C 6C 6F', { delay: 50 });
    // Le résultat doit être correct (test de non-régression)
    await expect(page.locator('#cv-asc')).toHaveValue('Hello');

    await page.waitForTimeout(700);

    const used = await readLS(page, 'tools_used', {});
    // 5 keystrokes → 1 enregistrement grâce au debounce
    expect(used.hex, `Debounce raté : ${JSON.stringify(used)}`).toBe(1);
  });

  test('Erreur (alert-box) → tools_used NON incrémenté', async ({ page }) => {
    await page.goto('/tools.html');
    await page.waitForFunction(() => typeof window.ToolsProfileBridge?.notifyToolUse === 'function');

    await page.click('#tab-tool-sfn');
    // Saisie trop courte → "⚠ N/32 octets saisis" (alert-box)
    await page.fill('#sfn-in', '41 42 43');
    await page.locator('#tool-sfn button.calc-btn').first().click();
    await page.waitForTimeout(700);

    const used = await readLS(page, 'tools_used', {});
    expect(used.sfn, "Une erreur ne doit pas compter comme usage").toBeUndefined();
  });

  test('5 outils différents utilisés → tools_swiss_knife débloqué', async ({ page }) => {
    await page.goto('/tools.html');
    await page.waitForFunction(() => typeof window.ToolsProfileBridge?.notifyToolUse === 'function');

    // Direct notify x5 — on teste la mécanique du bridge, pas chaque UI
    await page.evaluate(() => {
      ['ts','rl','fat','ntfs','hex'].forEach(k => window.ToolsProfileBridge.notifyToolUse(k));
    });
    await page.waitForTimeout(150);

    const used = await readLS(page, 'tools_used', {});
    expect(Object.keys(used).filter(k => used[k] > 0).length).toBe(5);

    const profile = await readLS(page, 'casIn_profile', {});
    const unlocked = Array.isArray(profile?.achievements) ? profile.achievements : [];
    expect(unlocked, `achievements: ${JSON.stringify(unlocked)}`).toContain('tools_swiss_knife');

    // Phase 3a v3.1 — Profile.activity.tools doit être peuplé (cleanup hérité Phase 3b)
    expect(profile?.activity?.tools,
      `activity.tools attendu après notifyToolUse, profile.activity = ${JSON.stringify(profile?.activity)}`
    ).toBeGreaterThan(0);
  });

  test('Un outil utilisé 20 fois → tools_artisan débloqué', async ({ page }) => {
    await page.goto('/tools.html');
    await page.waitForFunction(() => typeof window.ToolsProfileBridge?.notifyToolUse === 'function');

    await page.evaluate(() => {
      for (let i = 0; i < 20; i++) window.ToolsProfileBridge.notifyToolUse('mft');
    });
    await page.waitForTimeout(150);

    const used = await readLS(page, 'tools_used', {});
    expect(used.mft).toBe(20);

    const profile = await readLS(page, 'casIn_profile', {});
    const unlocked = profile?.achievements || [];
    expect(unlocked).toContain('tools_artisan');
  });

  test('12 outils différents utilisés → tools_polymath débloqué', async ({ page }) => {
    await page.goto('/tools.html');
    await page.waitForFunction(() => typeof window.ToolsProfileBridge?.notifyToolUse === 'function');

    await page.evaluate(() => {
      const all = ['ts','rl','fat','ntfs','hex','enc','sfn','magic','bitmap','hashid','cluster','mft'];
      all.forEach(k => window.ToolsProfileBridge.notifyToolUse(k));
    });
    await page.waitForTimeout(150);

    const profile = await readLS(page, 'casIn_profile', {});
    const unlocked = profile?.achievements || [];
    expect(unlocked).toContain('tools_swiss_knife'); // seuil 5 franchi en route
    expect(unlocked).toContain('tools_polymath');    // seuil 12 atteint
  });

  test('Clé inconnue passée au bridge → no-op silencieux', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/tools.html');
    await page.waitForFunction(() => typeof window.ToolsProfileBridge?.notifyToolUse === 'function');

    const result = await page.evaluate(() =>
      window.ToolsProfileBridge.notifyToolUse('unknown_tool_42')
    );
    expect(result).toEqual([]);
    expect(errors).toEqual([]);

    const used = await readLS(page, 'tools_used', {});
    expect(used.unknown_tool_42).toBeUndefined();
  });
});
