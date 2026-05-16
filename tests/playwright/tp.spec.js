// ═══════════════════════════════════════════════════════════════
// tests/playwright/tp.spec.js
//
// Couvre le moteur TP côté boucle d'exercices :
//   • Une cat se rend, les choix sont cliquables.
//   • Résoudre 5 exos endian incrémente tp_solved.endian = 5.
//   • L'achievement tp_first se débloque dans casIn_profile.
//   • Le streak grimpe et tp_streak5 se débloque.
//
// + Acceptance Phase 1 pour les 3 bugs tp.html identifiés
//   (updateGroupProgress oublie 'win', catGroup incomplet,
//   buildMobBar duplique les pills _exam/_tools).
// ═══════════════════════════════════════════════════════════════
const { test, expect } = require('@playwright/test');
const {
  collectErrors,
  readLS,
  solveMultipleChoice,
} = require('./helpers');

test.describe('tp.html — Baseline (passe avant Phase 1)', () => {
  // Note : pas de beforeEach. Chaque test reçoit un BrowserContext frais
  // (defaut Playwright) → localStorage vierge, pas de SW carryover, pas de
  // cookies. Si un test devient flaky à cause du SW, ajouter localement :
  //   await unregisterServiceWorker(page);

  test('charge la sidebar avec les 4 groupes et la zone d\'exercice', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/tp.html');

    // 4 groupes attendus dans la sidebar (fs, win, calc, inv, + tools=outils)
    const groups = page.locator('.sb-group');
    await expect(groups).toHaveCount(5); // 4 thématiques + 1 outils/examen

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

    // Petit délai pour le setItem + le bridge (setTimeout 30ms)
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

    // Stuber confirm() avant de cliquer Reset
    page.on('dialog', d => d.accept());
    await page.locator('.sbf-btn[onclick="doReset()"]').click();

    const solved = await readLS(page, 'tp_solved', null);
    // Soit la clé est absente, soit elle vaut {}
    expect(solved === null || Object.keys(solved).length === 0).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// Acceptance Phase 1 — bugs tp.html
// ═══════════════════════════════════════════════════════════════
test.describe('tp.html — Acceptance Phase 1 (échec attendu avant fix)', () => {

  test.fail("BUG L337-341 : updateGroupProgress couvre le groupe 'Artefacts Windows'", async ({ page }) => {
    // Le groupe `win` (registry/prefetch/lnk) est absent du mapping
    // `groups` dans tp.html → sa barre #gp-win reste à 0% pour toujours.
    // Le fix consiste à ajouter : win: ['registry','prefetch','lnk'].
    await page.goto('/tp.html');

    // On vérifie côté code : la fonction expose-t-elle le groupe win ?
    const result = await page.evaluate(() => {
      // updateGroupProgress lit `groups` et écrit dans #gp-fs, #gp-calc, #gp-inv...
      // Si elle écrit aussi dans #gp-win, on a le fix.
      const fnSrc = (window.updateGroupProgress || (()=>{})).toString();
      return fnSrc.includes("win:") || fnSrc.includes("'win'") || fnSrc.includes('"win"');
    });
    expect(result, "updateGroupProgress doit inclure la clé 'win'").toBe(true);
  });

  test.fail("BUG L280 : catGroup couvre registry/prefetch/lnk", async ({ page }) => {
    await page.goto('/tp.html');
    // Naviguer vers #registry → si catGroup n'a pas la clé, le groupe
    // grp-win ne se déplie pas. On vérifie en cliquant sur registry et
    // en regardant si grp-win est ouvert.
    await page.goto('/tp.html#registry');
    await page.waitForTimeout(300);

    const winCollapsed = await page.evaluate(() => {
      return document.getElementById('grp-win')?.classList.contains('collapsed') ?? true;
    });
    expect(winCollapsed, "grp-win doit être déplié après #registry").toBe(false);
  });

  test.fail("BUG L430 : buildMobBar n'émet pas de pills doublons (_exam, _tools)", async ({ page }) => {
    await page.goto('/tp.html');
    await page.waitForTimeout(200);

    const brokenPills = await page.evaluate(() => {
      const pills = [...document.querySelectorAll('.mob-pill[data-cat]')];
      // Les pills _exam/_tools générés par le map() au lieu de showTool() :
      // ils ont un onclick qui appelle go('_exam') alors qu'il faudrait showTool().
      return pills.filter(p => {
        const cat = p.dataset.cat;
        if (cat !== '_exam' && cat !== '_tools') return false;
        const onclick = p.getAttribute('onclick') || '';
        return onclick.startsWith('go('); // mauvais handler
      }).length;
    });
    expect(brokenPills, "0 pill cassée pour _exam/_tools").toBe(0);
  });
});
