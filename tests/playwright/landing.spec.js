// ═══════════════════════════════════════════════════════════════
// tests/playwright/landing.spec.js
//
// Phase 3a v3.1 — landing-3d.js a remplacé sa table autonome de 6 rangs
// par des appels à window.Profile.getRank().
//
// Ces tests vérifient que :
//   • La landing affiche le rang du Profile, pas l'ancien table local.
//   • Le rang reflète le track choisi (Magistrat ≠ Enquêteur).
//   • Le rang affiché sur la landing est cohérent avec celui du profile.html.
//
// Stratégie : on pré-cuit `casIn_profile` en localStorage AVANT la nav,
// puis on force la "DFIR view" via `casIn_landingViews=5`, puis on lit
// le textContent de #dfir-agent-rank.
// ═══════════════════════════════════════════════════════════════
const { test, expect } = require('@playwright/test');
const { collectErrors } = require('./helpers');

// Pré-cuisson : injecter un profil v=4 cohérent + 5 sessions pour
// forcer l'affichage DFIR view.
async function seed(page, { xp = 5000, track = 'investigator' } = {}) {
  await page.addInitScript(({ xp, track }) => {
    const profile = {
      v: 4,
      createdAt: Date.now() - 86400000,  // 1j ago
      migrated: false,
      agent: { pseudo: 'TESTAGENT', track, trackChosenAt: Date.now() - 3600000 },
      xp,
      firstXpAt: Date.now() - 86400000,
      xpBySource: { quiz: xp, scene: 0, quest: 0, tp: 0, fiches: 0 },
      streak: { current: 3, max: 5, lastDate: new Date().toISOString().slice(0, 10) },
      activity: { quiz: Date.now() - 3600000 },
      milestones: {},
      achievements: [],
      preferences: { viewMode: 'auto', equippedTitle: null },
    };
    localStorage.setItem('casIn_profile', JSON.stringify(profile));
    localStorage.setItem('casIn_landingViews', '5');
    localStorage.setItem('casIn_landingLastVisit', String(Date.now() - 86400000));
  }, { xp, track });
}

test.describe('landing — rang via Profile (Phase 3a)', () => {

  test('5000 XP track investigator → "Inspecteur Columbo" (pas l\'ancien "Expert")', async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page, { xp: 5000, track: 'investigator' });
    await page.goto('/index.html');

    // landing-3d.js attend le DOM ; on attend que #dfir-agent-rank soit peuplé
    await expect(page.locator('#dfir-agent-rank')).toContainText('clearance', { timeout: 5000 });

    const text = await page.locator('#dfir-agent-rank').textContent();

    // 5000 XP en v=4 → idx 7 (seuil 4950) → "Inspecteur Columbo"
    // L'ANCIEN système (Phase 0) aurait dit "Expert" (3000 ≤ 5000 < 6000).
    // Si le test échoue avec "Expert", c'est que la table locale n'a pas été retirée.
    expect(text).toContain('Inspecteur Columbo');
    expect(text).not.toContain('Expert');     // ancien nom Phase 0
    expect(text).not.toContain('Analyste');   // ancien nom Phase 0

    await page.waitForLoadState('networkidle');
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });

  test('Même XP, track Magistrat → rang du track Magistrat (pas Enquêteur)', async ({ page }) => {
    await seed(page, { xp: 5000, track: 'magistrate' });
    await page.goto('/index.html');

    await expect(page.locator('#dfir-agent-rank')).toContainText('clearance', { timeout: 5000 });
    const text = await page.locator('#dfir-agent-rank').textContent();

    // L'ANCIEN système ignorait le track → toujours "Enquêteur"/etc.
    // Phase 3a : le nom dépend du track. À idx 7, track magistrate a son propre nom.
    // On ne hardcode pas le nom exact (track magistrate peut évoluer), on vérifie
    // juste que ce N'EST PAS un nom du track investigator.
    expect(text).not.toContain('Inspecteur Columbo');
    expect(text).not.toContain('Sherlock Holmes');
    expect(text).not.toContain('Abby Sciuto');
    // Et ce n'est pas l'ancien "Expert" non plus
    expect(text).not.toContain('Expert');
  });

  test('XP=0 (profil neuf) → Stagiaire (rang 0)', async ({ page }) => {
    await seed(page, { xp: 0, track: 'investigator' });
    await page.goto('/index.html');

    await expect(page.locator('#dfir-agent-rank')).toContainText('clearance', { timeout: 5000 });
    const text = await page.locator('#dfir-agent-rank').textContent();
    expect(text).toContain('Stagiaire');
    expect(text).toContain('clearance lvl 1');
  });

  test('XP max (>32650) → rang ultime + "MAX" comme prochain palier', async ({ page }) => {
    await seed(page, { xp: 50000, track: 'investigator' });
    await page.goto('/index.html');

    await expect(page.locator('#dfir-agent-rank')).toContainText('clearance', { timeout: 5000 });
    const text = await page.locator('#dfir-agent-rank').textContent();

    // L'ANCIEN système plafonnait à "Inspecteur Principal" à 10000 XP.
    // Phase 3a : continue jusqu'à 32650 puis "Légende DFIR".
    expect(text).toContain('Légende DFIR');
    expect(text).not.toContain('Inspecteur Principal'); // ancien nom Phase 0

    // Le label "next" doit dire "MAX" ou "rang max"
    const nextText = await page.locator('#dfir-next-val').textContent();
    expect(nextText, `next label: ${nextText}`).toMatch(/MAX|max/);
  });

  test('Pourcentage XP cohérent : 700 XP track investigator → ~37% du rang 2', async ({ page }) => {
    // Seuils v=4 : rang 2 = [550, 950]. À 700 XP : (700-550)/(950-550) = 37,5%
    await seed(page, { xp: 700, track: 'investigator' });
    await page.goto('/index.html');

    await page.waitForFunction(() =>
      document.getElementById('dr-xp-fill')?.style.width !== ''
    , { timeout: 5000 });

    const width = await page.locator('#dr-xp-fill').evaluate(el => el.style.width);
    // Pct ∈ [35, 40] — tolérance pour arrondis
    const pct = parseInt(width, 10);
    expect(pct, `Width: ${width}`).toBeGreaterThanOrEqual(35);
    expect(pct).toBeLessThanOrEqual(40);
  });
});
