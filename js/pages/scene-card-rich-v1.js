/* ═══════════════════════════════════════════════════════════════
   scene-card-rich-v1.js — v2.92
   ───────────────────────────────────────────────────────────────
   Améliorations visibles du lobby de scènes :

   1) BANDEAU PROGRESSION (au-dessus de la grille de scénarios)
      - Compteur scénarios complétés / total
      - Barre vers le prochain palier (5, 10, 25, 50, 100%)
      - XP cumulé issu des scènes (lecture de Profile.xpBySource.scene)
      - Compteur de scénarios "maîtrisés" (≥ 80% au meilleur run)

   2) ENRICHISSEMENT DES CARTES
      - Durée estimée (fonction du stepCount)
      - XP de récompense potentielle (run parfait, mode standard)
      - Pin "PROCHAIN" sur le scénario recommandé par computeRecommendedScene()

   Le module se branche après scene-app.js + scene-lobby-v3.js. Il ré-applique
   ses enrichissements après chaque ré-rendu de la grille (filtre, tri).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Constantes UI / formules ─────────────────────────────────
  const SECONDS_PER_STEP = 50; // estimation lecture + décision
  const DIFF_MULT = { easy: 1, medium: 1.5, hard: 2, expert: 2.5 };
  // Reproduit la formule de scene-app.js : xpBase = pct * diffMult * 0.8
  // (mode standard, sans bonus streak ni procureur)
  function xpRewardForScene(scene) {
    const m = DIFF_MULT[scene.difficulty] || 1;
    return Math.round(100 * m * 0.8); // pct = 100% (run parfait)
  }
  function durationForScene(scene) {
    const steps = scene.stepCount || (scene.steps && scene.steps.length) || 5;
    const min = Math.max(2, Math.round((steps * SECONDS_PER_STEP) / 60));
    return min;
  }

  // Paliers de progression — à atteindre pour un run "complet"
  const MILESTONES = [
    { count: 1,  label: 'Premier dossier' },
    { count: 5,  label: 'Cinq enquêtes' },
    { count: 10, label: 'Dix dossiers' },
    { count: 25, label: 'Vingt-cinq enquêtes' },
    { count: 50, label: 'Cinquante dossiers' },
    { count: 100, label: 'Centurion' },
  ];

  // ── Helpers ──────────────────────────────────────────────────
  function lsGetSafe(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      try { return JSON.parse(raw); } catch (_) { return raw; }
    } catch (_) { return fallback; }
  }

  function totalScenes() {
    return Array.isArray(window.SCENES) ? window.SCENES.length : 0;
  }

  function nextMilestone(done, total) {
    const candidates = MILESTONES.filter(m => m.count <= total);
    for (const m of candidates) {
      if (done < m.count) return m;
    }
    // Au-delà du dernier palier : objectif final = 100 % du corpus
    if (done < total) {
      return { count: total, label: 'Tous les scénarios' };
    }
    return null; // tout est fait
  }

  function getSceneXp() {
    if (window.Profile && typeof window.Profile.snapshot === 'function') {
      try {
        const snap = window.Profile.snapshot();
        const v = snap && snap.xpBySource && snap.xpBySource.scene;
        return Number.isFinite(v) ? v : 0;
      } catch (_) {}
    }
    return 0;
  }

  function getMasteredCount(saved) {
    let n = 0;
    for (const id in saved) {
      const r = saved[id];
      if (r && typeof r.pct === 'number' && r.pct >= 80) n++;
    }
    return n;
  }

  // Compte les scènes complétées AUJOURD'HUI. Le date stocké dans
  // scene_results est `new Date().toLocaleDateString('fr')` → "DD/MM/YYYY".
  function getTodayCount(saved) {
    const today = new Date().toLocaleDateString('fr');
    let n = 0;
    for (const id in saved) {
      const r = saved[id];
      if (r && r.date === today) n++;
    }
    return n;
  }

  function getFirstClearsSet() {
    const arr = lsGetSafe('cas_first_clears', []);
    return new Set(Array.isArray(arr) ? arr : []);
  }

  function getStreakDays() {
    // Réutilise le store cas_streak posé par scene-app.js
    const s = lsGetSafe('cas_streak', null);
    if (s && typeof s === 'object' && Number.isFinite(s.count)) return s.count;
    return 0;
  }

  // ── 1) Bandeau progression ───────────────────────────────────
  function renderProgressionBar() {
    const gridHeader = document.getElementById('grid-header');
    if (!gridHeader) return;

    const total = totalScenes();
    if (total === 0) return;

    const saved = lsGetSafe('scene_results', {}) || {};
    const done = Object.keys(saved).length;
    const mastered = getMasteredCount(saved);
    const todayCount = getTodayCount(saved);
    const xp = getSceneXp();
    const streak = getStreakDays();

    const todayChip = todayCount > 0
      ? `<span class="spbar-stat spbar-stat--today" title="Scénarios complétés aujourd'hui">
           <span class="spbar-stat-icon">📅</span>
           <span class="spbar-stat-val">${todayCount}</span>
           <span class="spbar-stat-lbl">aujourd'hui</span>
         </span>`
      : `<span class="spbar-stat spbar-stat--today spbar-stat--idle" title="Aucun scénario complété aujourd'hui — joues-en un pour entretenir la série">
           <span class="spbar-stat-icon">📅</span>
           <span class="spbar-stat-val">0</span>
           <span class="spbar-stat-lbl">aujourd'hui</span>
         </span>`;

    const ms = nextMilestone(done, total);
    let progressLabel, progressPct, progressTo;
    if (ms) {
      progressTo = ms.count;
      progressPct = Math.min(100, Math.round((done / ms.count) * 100));
      progressLabel = `${done} / ${ms.count} · ${ms.label}`;
    } else {
      progressTo = total;
      progressPct = 100;
      progressLabel = `${total} / ${total} · Corpus complet 🎖`;
    }

    let bar = document.getElementById('scene-progression-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'scene-progression-bar';
      bar.className = 'scene-progression-bar';
      gridHeader.parentNode.insertBefore(bar, gridHeader);
    }

    bar.innerHTML = `
      <div class="spbar-row spbar-row--progress">
        <span class="spbar-icon" aria-hidden="true">🏆</span>
        <div class="spbar-progress">
          <div class="spbar-label">${escapeText(progressLabel)}</div>
          <div class="spbar-track"><div class="spbar-fill" style="width:${progressPct}%"></div></div>
        </div>
        <span class="spbar-progress-pct">${progressPct}%</span>
      </div>
      <div class="spbar-row spbar-row--stats">
        ${todayChip}
        <span class="spbar-stat" title="XP gagné via les scènes">
          <span class="spbar-stat-icon">⚡</span>
          <span class="spbar-stat-val">${formatNumber(xp)}</span>
          <span class="spbar-stat-lbl">XP scènes</span>
        </span>
        <span class="spbar-stat" title="Scénarios maîtrisés (score ≥ 80%)">
          <span class="spbar-stat-icon">🎖</span>
          <span class="spbar-stat-val">${mastered}</span>
          <span class="spbar-stat-lbl">maîtrisés</span>
        </span>
        <span class="spbar-stat" title="Série en cours (jours consécutifs)">
          <span class="spbar-stat-icon">🔥</span>
          <span class="spbar-stat-val">${streak}</span>
          <span class="spbar-stat-lbl">jours</span>
        </span>
      </div>
    `;
  }

  // ── 2) Enrichissement des cartes ─────────────────────────────
  function findSceneById(id) {
    if (!Array.isArray(window.SCENES)) return null;
    return window.SCENES.find(s => s && s.id === id) || null;
  }

  function enrichCard(card, ctx) {
    if (!card || card.dataset.richEnriched === '1') return;
    const id = card.dataset.sceneId;
    if (!id) return;
    const scene = findSceneById(id);
    if (!scene) return;

    // Position des nouveaux meta : on cible le bloc .scene-meta pour ajouter
    // durée + récompense XP. Si .scene-meta absent (variantes), on no-op.
    const meta = card.querySelector('.scene-meta');
    if (!meta) return;

    // Évite les doublons sur ré-enrichissement
    meta.querySelectorAll('.scene-meta-rich').forEach(n => n.remove());

    const dur = durationForScene(scene);
    const xpReward = xpRewardForScene(scene);

    const durEl = document.createElement('span');
    durEl.className = 'scene-steps-count scene-meta-rich scene-meta-rich--duration';
    durEl.title = 'Durée moyenne estimée';
    durEl.innerHTML = `<span class="rich-icon">⏱</span> ~${dur} min`;
    meta.appendChild(durEl);

    const xpEl = document.createElement('span');
    xpEl.className = 'scene-steps-count scene-meta-rich scene-meta-rich--xp';
    xpEl.title = `Récompense XP pour un run parfait (${scene.difficulty}). Bonifié par streak / mode procureur.`;
    xpEl.innerHTML = `<span class="rich-icon">⚡</span> ≈ ${xpReward} XP`;
    meta.appendChild(xpEl);

    // Badge "+20 XP première" — uniquement sur les scènes pas encore
    // first-cleared (jamais jouées à ≥60%). Skipped si scène verrouillée.
    if (ctx && ctx.firstClears && !ctx.firstClears.has(id) && !card.classList.contains('locked')) {
      const fcEl = document.createElement('span');
      fcEl.className = 'scene-steps-count scene-meta-rich scene-meta-rich--firstclear';
      fcEl.title = 'Bonus de découverte : +20 XP la première fois que tu termines à 60% ou plus';
      fcEl.innerHTML = `<span class="rich-icon">🌟</span> +20 première`;
      meta.appendChild(fcEl);
    }

    card.dataset.richEnriched = '1';
  }

  function highlightRecommended() {
    // Reset précédents marqueurs
    document.querySelectorAll('.scene-grid .scene-card.scene-card--next').forEach(c => {
      c.classList.remove('scene-card--next');
      const pin = c.querySelector('.scene-next-pin');
      if (pin) pin.remove();
    });

    const recId = window.RECOMMENDED_SCENE_ID;
    if (!recId) return;

    const card = document.querySelector(
      `.scene-grid .scene-card[data-scene-id="${cssEscape(recId)}"]`
    );
    if (!card) return;
    if (card.classList.contains('locked')) return; // pas de pin sur scène verrouillée

    card.classList.add('scene-card--next');
    if (!card.querySelector('.scene-next-pin')) {
      const pin = document.createElement('span');
      pin.className = 'scene-next-pin';
      pin.title = 'Prochain scénario recommandé pour ta progression';
      pin.innerHTML = '<span class="scene-next-pin-arrow">→</span> PROCHAIN';
      card.appendChild(pin);
    }
  }

  function enrichAllCards() {
    const ctx = { firstClears: getFirstClearsSet() };
    document.querySelectorAll('.scene-grid .scene-card[data-scene-id]').forEach(c => enrichCard(c, ctx));
    highlightRecommended();
  }

  // ── Hooks de re-render ───────────────────────────────────────

  function applyEnrichments() {
    try { renderProgressionBar(); } catch (e) { console.warn('[scene-rich] progression bar:', e); }
    try { enrichAllCards(); } catch (e) { console.warn('[scene-rich] enrich cards:', e); }
  }

  function installHooks() {
    if (window.__casSceneRichInstalled) return;
    window.__casSceneRichInstalled = true;

    // Wrap initLobby (déjà wrappé par lobby-v3 le cas échéant) :
    // notre wrap s'exécute après celui de v3 car on l'installe après.
    if (typeof window.initLobby === 'function') {
      const origInit = window.initLobby;
      window.initLobby = function () {
        const r = origInit.apply(this, arguments);
        // Laisser v3 finir son applyV3Layer (50ms), puis on enrichit.
        setTimeout(applyEnrichments, 120);
        return r;
      };
    }

    // Wrap applyLobbyFilters pour ré-enrichir après chaque filtre.
    if (typeof window.applyLobbyFilters === 'function') {
      const origFilter = window.applyLobbyFilters;
      window.applyLobbyFilters = function () {
        const r = origFilter.apply(this, arguments);
        // Les cartes filtrées qui réapparaissent restent enrichies
        // (on conserve dataset.richEnriched), mais on rafraîchit la
        // mise en avant "PROCHAIN" et le bandeau (compteur affiché).
        try { renderProgressionBar(); } catch (_) {}
        try { highlightRecommended(); } catch (_) {}
        return r;
      };
    }

    // Filet de sécurité : si le lobby est déjà rendu (cas où nos hooks
    // arrivent après le 1er rendu — peu probable mais possible avec defer),
    // on enrichit immédiatement.
    setTimeout(() => {
      const grid = document.getElementById('scene-grid');
      if (grid && grid.querySelector('.scene-card')) applyEnrichments();
    }, 200);
  }

  // ── Utilitaires ──────────────────────────────────────────────
  function escapeText(s) {
    return String(s).replace(/[<>&"']/g, ch => (
      { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
  }
  function cssEscape(s) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(s);
    return String(s).replace(/[^a-zA-Z0-9_-]/g, ch => '\\' + ch);
  }
  function formatNumber(n) {
    if (!Number.isFinite(n)) return '0';
    return n.toLocaleString('fr-CH').replace(/\u202f/g, ' ');
  }

  // ── Boot ─────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installHooks);
  } else {
    installHooks();
  }
})();
