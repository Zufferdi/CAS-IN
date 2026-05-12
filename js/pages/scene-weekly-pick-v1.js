/* ═══════════════════════════════════════════════════════════════
 * scene-weekly-pick-v1.js — v2.99 (piste B4)
 *
 * "Mission de la semaine" — sélectionne 3 scènes qui changent chaque
 * lundi, mises en valeur en haut du lobby.
 *
 * Logique de sélection :
 *   - Seed = numéro ISO de semaine (anné + semaine), donc déterministe
 *     et identique pour tous les utilisateurs sur la même période
 *   - 3 picks équilibrés :
 *     1. Une "découverte" : scène jamais jouée par l'utilisateur, diff
 *        adaptée à son niveau (easy si <3 scènes, medium si <15, etc.)
 *     2. Une "perfection" : scène jouée mais <90%, à reprendre pour ⭐
 *     3. Une "stretch" : scène plus dure que ce que l'utilisateur fait
 *        d'habitude (un cran au-dessus)
 *
 * Si une des catégories est vide (ex: pas encore de scène <90%), la
 * carte est remplacée par une autre "découverte".
 *
 * Architecture :
 *   - Bandeau injecté en haut de #scene-grid, AVANT l'onboarding et
 *     AVANT les parcours (priorité haute)
 *   - Dismissable pour la semaine en cours (key: cas_weekly_dismissed_<weekId>)
 * ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';
  if (window.__casInWeeklyPick) return;
  window.__casInWeeklyPick = true;

  // ─── Helpers ──────────────────────────────────────────────────
  function getISOWeek(date) {
    // ISO 8601 week number — semaines commencent lundi, semaine 1 contient le 1er jeudi
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNo };
  }

  function weekId() {
    const { year, week } = getISOWeek(new Date());
    return `${year}W${String(week).padStart(2, '0')}`;
  }

  // PRNG déterministe (mulberry32) seedée par weekId
  function makeSeededRandom(seedStr) {
    // Hash simple du string → uint32
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    let a = h >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffled(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getResults() {
    try { return JSON.parse(localStorage.getItem('scene_results') || '{}'); }
    catch { return {}; }
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, ch => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]
    ));
  }

  // Détermine la difficulté adaptée au profil
  function getAdaptedDifficulty(scenesCount) {
    if (scenesCount < 3) return 'easy';
    if (scenesCount < 12) return 'medium';
    if (scenesCount < 40) return 'hard';
    return 'expert';
  }

  function getStretchDifficulty(baseDiff) {
    const order = ['easy', 'medium', 'hard', 'expert'];
    const i = order.indexOf(baseDiff);
    if (i < 0 || i === order.length - 1) return baseDiff;
    return order[i + 1];
  }

  // ─── Sélection ────────────────────────────────────────────────
  function pickThree() {
    if (typeof window.SCENES === 'undefined' || !Array.isArray(window.SCENES)) return null;
    const all = window.SCENES.filter(s => s && s.id);
    if (all.length === 0) return null;

    const results = getResults();
    const scenesCount = Object.keys(results).filter(k => results[k] && results[k].pct >= 60).length;
    const baseDiff = getAdaptedDifficulty(scenesCount);
    const stretchDiff = getStretchDifficulty(baseDiff);

    const rng = makeSeededRandom(weekId());

    // Pool 1 : découverte (jamais jouée, diff adaptée)
    let pool1 = all.filter(s => !results[s.id] && s.difficulty === baseDiff);
    if (pool1.length === 0) pool1 = all.filter(s => !results[s.id]);

    // Pool 2 : perfection (jouée mais <90%)
    const pool2 = all.filter(s => results[s.id] && results[s.id].pct < 90 && results[s.id].pct >= 60);

    // Pool 3 : stretch (un cran au-dessus, jamais jouée)
    let pool3 = all.filter(s => !results[s.id] && s.difficulty === stretchDiff);
    if (pool3.length === 0) pool3 = all.filter(s => s.difficulty === stretchDiff);

    const picks = [];
    const used = new Set();
    function takeFrom(pool, kind, label, color) {
      const filtered = pool.filter(s => !used.has(s.id));
      if (filtered.length === 0) return null;
      const picked = shuffled(filtered, rng)[0];
      used.add(picked.id);
      return { scene: picked, kind, label, color };
    }

    // Si l'utilisateur n'a rien encore joué : 3 découvertes
    if (scenesCount === 0) {
      for (let i = 0; i < 3; i++) {
        const p = takeFrom(pool1, 'discover', 'Découverte', '#00e5cc');
        if (p) picks.push(p);
      }
    } else {
      const p1 = takeFrom(pool1, 'discover', 'Découverte', '#00e5cc');
      const p2 = takeFrom(pool2, 'perfect', 'À perfectionner', '#f0c040');
      const p3 = takeFrom(pool3, 'stretch', 'Cran au-dessus', '#e24b4a');
      [p1, p2, p3].forEach(p => { if (p) picks.push(p); });
      // Complète à 3 si certaines catégories étaient vides
      while (picks.length < 3) {
        const extra = takeFrom(pool1, 'discover', 'Découverte', '#00e5cc');
        if (!extra) break;
        picks.push(extra);
      }
    }
    return picks;
  }

  // ─── Rendering ────────────────────────────────────────────────
  function renderBanner() {
    // Dismissed pour cette semaine ?
    try {
      if (localStorage.getItem('cas_weekly_dismissed_' + weekId()) === '1') return;
    } catch { /* noop */ }

    const grid = document.getElementById('scene-grid');
    if (!grid) return;

    // Pas de doublon
    if (document.getElementById('weekly-pick-banner')) return;

    const picks = pickThree();
    if (!picks || picks.length === 0) return;

    const banner = document.createElement('div');
    banner.id = 'weekly-pick-banner';
    banner.className = 'weekly-pick-banner';
    const { year, week } = getISOWeek(new Date());
    banner.innerHTML = `
      <div class="weekly-pick-header">
        <span class="weekly-pick-icon">📌</span>
        <div class="weekly-pick-text">
          <div class="weekly-pick-title">Mission de la semaine</div>
          <div class="weekly-pick-sub">Semaine ${week} · trois cas qui devraient te tenter cette semaine</div>
        </div>
        <button class="weekly-pick-dismiss" title="Masquer pour cette semaine" aria-label="Masquer">×</button>
      </div>
      <div class="weekly-pick-cards">
        ${picks.map(p => `
          <div class="weekly-pick-card" data-scene-id="${escapeHTML(p.scene.id)}" data-kind="${p.kind}" style="--kind-color:${p.color}" role="button" tabindex="0">
            <div class="weekly-pick-card-kind">${escapeHTML(p.label)}</div>
            <div class="weekly-pick-card-icon">${p.scene.icon || '📌'}</div>
            <div class="weekly-pick-card-title">${escapeHTML(p.scene.title)}</div>
            <div class="weekly-pick-card-meta">
              <span class="weekly-pick-diff diff-${p.scene.difficulty}">${p.scene.difficulty}</span>
              · ${p.scene.stepCount || (p.scene.steps && p.scene.steps.length) || '?'} décisions
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Insertion tout en haut du grid (avant onboarding-banner)
    grid.insertBefore(banner, grid.firstChild);

    // Bindings
    banner.querySelectorAll('.weekly-pick-card').forEach(card => {
      const launch = (e) => {
        e.preventDefault();
        const sid = card.dataset.sceneId;
        if (typeof window.loadFullScene === 'function' && typeof window.startScene === 'function') {
          window.loadFullScene(sid).then(window.startScene).catch(err => {
            console.error('[weekly] launch failed:', err);
            if (typeof window.showToast === 'function') {
              window.showToast('⚠ Scène introuvable');
            }
          });
        } else {
          window.location.hash = '#scene=' + encodeURIComponent(sid);
        }
      };
      card.addEventListener('click', launch);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') launch(e);
      });
    });

    banner.querySelector('.weekly-pick-dismiss').addEventListener('click', (e) => {
      e.stopPropagation();
      try { localStorage.setItem('cas_weekly_dismissed_' + weekId(), '1'); } catch {}
      banner.remove();
    });
  }

  function tryRender(retries = 30) {
    if (typeof window.SCENES !== 'undefined' && Array.isArray(window.SCENES) && window.SCENES.length > 0) {
      renderBanner();
      // Observer du grid pour réinjecter si lobby-v3 le repeuple
      const grid = document.getElementById('scene-grid');
      if (grid) {
        const obs = new MutationObserver(() => {
          if (!document.getElementById('weekly-pick-banner')) {
            clearTimeout(tryRender._t);
            tryRender._t = setTimeout(renderBanner, 100);
          }
        });
        obs.observe(grid, { childList: true });
      }
      return;
    }
    if (retries <= 0) return;
    setTimeout(() => tryRender(retries - 1), 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(tryRender, 400));
  } else {
    setTimeout(tryRender, 400);
  }

  // API publique (pour debug)
  window.CasInWeeklyPick = {
    pick: pickThree,
    weekId,
    rerender: renderBanner,
  };

  console.log('[weekly-pick] v2.99 loaded — week', weekId());
})();
