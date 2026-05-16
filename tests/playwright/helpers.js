// ═══════════════════════════════════════════════════════════════
// tests/playwright/helpers.js
//
// Helpers partagés par les specs. Volontairement minimal — on
// préfère 30 lignes lisibles à un framework de helpers tentaculaire.
// ═══════════════════════════════════════════════════════════════

/**
 * Capture les erreurs console et page durant un test.
 * Retourne un tableau qu'on inspecte en fin de test :
 *
 *   const errors = collectErrors(page);
 *   await page.goto(...);
 *   ...
 *   expect(errors).toEqual([]);
 *
 * Filtre les bruits non-fatals (favicons, ressources tierces).
 */
function collectErrors(page) {
  const errors = [];

  page.on('pageerror', err => {
    errors.push({ kind: 'pageerror', text: String(err && err.message || err) });
  });

  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // Bruits acceptables :
    if (text.includes('favicon')) return;
    if (text.includes('net::ERR_FAILED')) return;       // ressources blocked au mock
    if (text.match(/Failed to load resource.*404/i)) return;
    errors.push({ kind: 'console', text });
  });

  return errors;
}

/**
 * Désinscrit tout Service Worker enregistré pour l'origine courante.
 * À appeler avant les assertions critiques pour éviter qu'un SW
 * resservi du cache ne masque un changement réel.
 *
 * Idempotent — sûr à appeler plusieurs fois.
 */
async function unregisterServiceWorker(page) {
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return;
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
  });
}

/**
 * Lit une clé localStorage et la parse en JSON (avec fallback).
 *
 *   const profile = await readLS(page, 'casIn_profile', {});
 */
async function readLS(page, key, fallback = null) {
  return page.evaluate(({ key, fallback }) => {
    try {
      const v = localStorage.getItem(key);
      if (v === null) return fallback;
      try { return JSON.parse(v); } catch { return v; }
    } catch { return fallback; }
  }, { key, fallback });
}



/**
 * Résout N exercices de la catégorie courante du TP.
 *
 * Stratégie : on lit l'attribut `data-correct="true"` exposé par
 * tp-engine.js sur chaque `.tp-choice`. Pas glamour, mais c'est ce que
 * le moteur utilise lui-même pour vérifier, donc c'est honnête.
 *
 * Note : tp-engine.js expose `data-correct` partout, et parfois aussi
 * `data-is-correct` (legacy redondant — candidat nettoyage Phase 2).
 * On s'aligne sur `data-correct`, plus universel.
 *
 * Hypothèses : tp.html déjà chargé, premier exo rendu.
 * Limite : ne marche que pour les exos à choix multiples (.tp-choice).
 * Les exos à saisie libre (input + bouton "Vérifier") ne sont pas couverts
 * — ils seraient un autre helper, à ajouter quand on en aura besoin.
 */
async function solveMultipleChoice(page, n) {
  for (let i = 0; i < n; i++) {
    // Attendre que l'exercice soit rendu et qu'au moins un choix soit cliquable
    await page.waitForFunction(() => {
      const btns = document.querySelectorAll('.tp-choice[data-correct]');
      return btns.length > 0 && [...btns].some(b => !b.disabled);
    }, { timeout: 10_000 });

    await page.locator('.tp-choice[data-correct="true"]:not([disabled])').first().click();

    // Sauf pour le dernier exo, passer au suivant
    if (i < n - 1) {
      // btn-next devient visible après une réponse
      await page.locator('#btn-next').waitFor({ state: 'visible', timeout: 5_000 });
      await page.locator('#btn-next').click();
    }
  }
}

module.exports = {
  collectErrors,
  unregisterServiceWorker,
  readLS,
  solveMultipleChoice,
};
