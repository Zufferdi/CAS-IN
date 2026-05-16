// ═══════════════════════════════════════════════════════════════
// tests/playwright/tp.spec.js
//
// Couvre le moteur TP côté boucle d'exercices + intégration profil.
// Phase 1 mergée → les acceptance tests sont passés en baseline.
// ═══════════════════════════════════════════════════════════════
const { test, expect } = require('@playwright/test');
const {
  collectErrors,
  readLS,
  solveMultipleChoice,
} = require('./helpers');

test.describe('tp.html — Baseline', () => {

  test('charge la sidebar avec les 5 groupes et la zone d\'exercice', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/tp.html');

    // 5 groupes : fs, win, calc, inv, tools (Outils & Examen)
    const groups = page.locator('.sb-group');
    await expect(groups).toHaveCount(5);

    // L'exercice par défaut (endian) est rendu
    await expect(page.locator('#ex-container .ex-card')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.tp-choice').first()).toBeVisible();

    await page.waitForLoadState('networkidle');
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });

  test('résoudre 5 exos endian → tp_solved.endian = 5', async ({ page }) => {
    await page.goto('/tp.html#endian');
    await expect(page.locator('.tp-choice').first()).toBeVisible();

    await solveMultipleChoice(page, 5);
    await page.waitForTimeout(150);

    const solved = await readLS(page, 'tp_solved', {});
    expect(solved.endian, JSON.stringify(solved)).toBe(5);

    const streak = await readLS(page, 'tp_streak', '0');
    expect(parseInt(streak, 10)).toBe(5);

    const bestStreak = await readLS(page, 'tp_bestStreak', '0');
    expect(parseInt(bestStreak, 10)).toBe(5);
  });

  test('après 5 résolutions sans indice : tp_first et tp_streak5 sont débloqués', async ({ page }) => {
    await page.goto('/tp.html#endian');
    await expect(page.locator('.tp-choice').first()).toBeVisible();

    await solveMultipleChoice(page, 5);
    // Bridge fait setTimeout(evalAchievements, 30) → on attend
    await page.waitForTimeout(200);

    const profile = await readLS(page, 'casIn_profile', {});
    const unlocked = Array.isArray(profile?.achievements) ? profile.achievements : [];
    expect(unlocked, `achievements: ${JSON.stringify(unlocked)}`).toContain('tp_first');
    expect(unlocked).toContain('tp_streak5');
  });

  test('Reset : doReset() avec confirm=true vide tp_solved', async ({ page }) => {
    await page.goto('/tp.html#endian');
    await expect(page.locator('.tp-choice').first()).toBeVisible();
    await solveMultipleChoice(page, 2);
    await page.waitForTimeout(100);

    page.on('dialog', d => d.accept());
    await page.locator('.sbf-btn[onclick="doReset()"]').click();

    const solved = await readLS(page, 'tp_solved', null);
    expect(solved === null || Object.keys(solved).length === 0).toBe(true);
  });

  // ── Phase 4 PR 4.1 : tp-engine-fat.js sharding ──

  test('Cat FAT (extraite en tp-engine-fat.js) répond aux exercices', async ({ page }) => {
    await page.goto('/tp.html#fat');
    // Si le sharding casse l'enregistrement de GENERATORS.fat, l'exo n'apparait pas
    await expect(page.locator('.tp-choice').first()).toBeVisible({ timeout: 5000 });
    await solveMultipleChoice(page, 1);
    await page.waitForTimeout(150);

    const solved = await readLS(page, 'tp_solved', {});
    expect(solved.fat, `tp-engine-fat.js doit enregistrer GENERATORS.fat. Got: ${JSON.stringify(solved)}`).toBe(1);
  });

  test('Cat bitmap (extraite en tp-engine-fat.js) répond aux exercices', async ({ page }) => {
    await page.goto('/tp.html#bitmap');
    await expect(page.locator('.tp-choice').first()).toBeVisible({ timeout: 5000 });
    await solveMultipleChoice(page, 1);
    await page.waitForTimeout(150);

    const solved = await readLS(page, 'tp_solved', {});
    expect(solved.bitmap).toBe(1);
  });

  // ── Phase 4 PR 4.2 : tp-engine-ntfs.js sharding ──

  test('Cat runlist (extraite en tp-engine-ntfs.js) répond aux exercices', async ({ page }) => {
    await page.goto('/tp.html#runlist');
    await expect(page.locator('.tp-choice').first()).toBeVisible({ timeout: 5000 });
    await solveMultipleChoice(page, 1);
    await page.waitForTimeout(150);

    const solved = await readLS(page, 'tp_solved', {});
    expect(solved.runlist, `tp-engine-ntfs.js doit enregistrer GENERATORS.runlist. Got: ${JSON.stringify(solved)}`).toBe(1);
  });

  test('Cat timestomping (extraite en tp-engine-ntfs.js) répond aux exercices', async ({ page }) => {
    await page.goto('/tp.html#timestomping');
    await expect(page.locator('.tp-choice').first()).toBeVisible({ timeout: 5000 });
    await solveMultipleChoice(page, 1);
    await page.waitForTimeout(150);

    const solved = await readLS(page, 'tp_solved', {});
    expect(solved.timestomping).toBe(1);
  });

  // ── Phase 4 PR 4.3 : tp-engine-disk.js sharding ──

  test('Cat timestamp (extraite en tp-engine-disk.js) répond aux exercices', async ({ page }) => {
    await page.goto('/tp.html#timestamp');
    await expect(page.locator('.tp-choice, .ex-input').first()).toBeVisible({ timeout: 5000 });
    // timestamp peut avoir des saisies texte ; le test "5 endian solved" couvre
    // déjà l'extraction endian. On vérifie ici juste que la cat est trouvée.
    const found = await page.evaluate(() =>
      typeof window.GENERATORS?.timestamp === 'function'
    );
    expect(found, "tp-engine-disk.js doit enregistrer GENERATORS.timestamp").toBe(true);
  });

  test('Cat mbr (extraite en tp-engine-disk.js) répond aux exercices', async ({ page }) => {
    await page.goto('/tp.html#mbr');
    await expect(page.locator('.tp-choice').first()).toBeVisible({ timeout: 5000 });
    await solveMultipleChoice(page, 1);
    await page.waitForTimeout(150);

    const solved = await readLS(page, 'tp_solved', {});
    expect(solved.mbr).toBe(1);
  });

  // ── Fix Phase 1 : updateGroupProgress couvrait pas le groupe Windows ──

  test("updateGroupProgress couvre le groupe 'Artefacts Windows'", async ({ page }) => {
    await page.goto('/tp.html');

    const fnSrc = await page.evaluate(() => (window.updateGroupProgress || (()=>{})).toString());
    // Après fix : `groups` contient `win: [...]`
    expect(fnSrc).toMatch(/win:\s*\[/);
    expect(fnSrc).toContain("'registry'");
    expect(fnSrc).toContain("'prefetch'");
    expect(fnSrc).toContain("'lnk'");
  });

  // ── Fix Phase 1 : catGroup incomplet pour registry/prefetch/lnk ──

  test('navigation #registry déplie grp-win et marque le bouton actif', async ({ page }) => {
    await page.goto('/tp.html#registry');
    await page.waitForTimeout(300);

    const winCollapsed = await page.evaluate(() =>
      document.getElementById('grp-win')?.classList.contains('collapsed') ?? true
    );
    expect(winCollapsed, "grp-win doit être déplié après #registry").toBe(false);

    // Le bouton registry doit avoir la classe active
    await expect(page.locator('.sb-cat[data-cat="registry"]')).toHaveClass(/active/);
  });

  // ── Fix Phase 1 : buildMobBar émettait des pills doublons ──

  test("buildMobBar n'émet pas de pills doublons (_exam, _tools)", async ({ page }) => {
    await page.goto('/tp.html');
    await page.waitForTimeout(200);

    const result = await page.evaluate(() => {
      const pills = [...document.querySelectorAll('.mob-pill[data-cat]')];
      const examPills = pills.filter(p => p.dataset.cat === '_exam');
      const toolsPills = pills.filter(p => p.dataset.cat === '_tools');
      return {
        examCount:  examPills.length,
        toolsCount: toolsPills.length,
        examOnclick:  examPills[0]?.getAttribute('onclick')  || '',
        toolsOnclick: toolsPills[0]?.getAttribute('onclick') || '',
      };
    });

    // Une seule pill chacun, et elles appellent showTool() pas go()
    expect(result.examCount,  '1 pill _exam').toBe(1);
    expect(result.toolsCount, '1 pill _tools').toBe(1);
    expect(result.examOnclick).toContain('showTool');
    expect(result.toolsOnclick).toContain('showTool');
  });
});
