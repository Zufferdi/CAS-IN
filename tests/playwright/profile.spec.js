// ═══════════════════════════════════════════════════════════════
// tests/playwright/profile.spec.js
//
// Profile est la page la moins touchée par Phase 1-2 mais c'est elle
// qui consolide TOUT le reste (XP, streak, achievements, mastery).
// Donc : smoke minimal — charge sans erreur, affiche le pseudo,
// se relit après ajout d'un achievement programmatique.
// ═══════════════════════════════════════════════════════════════
const { test, expect } = require('@playwright/test');
const { collectErrors, readLS } = require('./helpers');

test.describe('profile.html — smoke', () => {

  test('charge sans erreur console (profil vierge)', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/profile.html');
    await page.waitForLoadState('networkidle');
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });

  test('expose window.Profile avec une snapshot lisible', async ({ page }) => {
    await page.goto('/profile.html');
    // cas-in-profile.js est chargé en defer → on attend qu'il s'initialise
    await page.waitForFunction(() => typeof window.Profile?.snapshot === 'function', { timeout: 5000 });
    const snap = await page.evaluate(() => window.Profile.snapshot());
    expect(snap).toBeTruthy();
    expect(typeof snap.version).toBe('number');
    expect(Array.isArray(snap.achievements)).toBe(true);
  });

  test("un achievement débloqué programmatiquement se persiste dans casIn_profile", async ({ page }) => {
    await page.goto('/profile.html');
    await page.waitForFunction(() => typeof window.Profile?.unlockAchievement === 'function', { timeout: 5000 });

    await page.evaluate(() => window.Profile.unlockAchievement('tp_first'));
    const profile = await readLS(page, 'casIn_profile', {});
    expect(Array.isArray(profile.achievements)).toBe(true);
    expect(profile.achievements).toContain('tp_first');
  });
});
