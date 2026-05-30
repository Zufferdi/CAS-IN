/* ═══════════════════════════════════════════════════════════════
 * completion-watcher.js — v2.99
 *
 * Surveille les complétions de sagas et d'arcs PNJ. Quand une saga
 * ou un arc passe de "en cours" à "100% bouclé(e)", déclenche une
 * célébration via window.Celebration (existant dans le repo).
 *
 * Fonctionne en complément de gamification-toasts.js qui célèbre
 * déjà les achievements individuels. Ici on ajoute :
 *   - "🏆 SAGA BOUCLÉE : L'Affaire Sarine — +150 XP bonus"
 *   - "👤 ARC COMPLÉTÉ : Le Procureur Cyber MPC — Mme Genoud"
 *
 * Architecture :
 *   - État initial calculé au boot (snapshot des sagas/arcs bouclés)
 *   - Écoute l'event `scene-results-changed` (custom event optionnel)
 *     OU intercepte les changements de localStorage.scene_results
 *   - À chaque trigger, recalcule + diff vs snapshot → célébration
 *     pour chaque nouvelle complétion
 *
 * Page : scene.html (où les scènes sont jouées). Sur profile.html
 * c'est moins critique (l'utilisateur a déjà vu la célébration).
 * ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';
  
  // v132g — Résolution path data/ correcte depuis n'importe quelle page
  // (fix régression v131c sur les fetches relatifs depuis pages/, fiches/, etc.)
  function _dataUrl(rel) {
    if (typeof window !== 'undefined' && window.CasInUtils && typeof window.CasInUtils.dataUrl === 'function') {
      return window.CasInUtils.dataUrl(rel);
    }
    const clean = String(rel || '').replace(/^\.?\/?(data\/)?/, '');
    const path = (typeof window !== 'undefined' && window.location) ? window.location.pathname : '/';
    const m = path.match(/^(.*?\/CAS-IN\/|\/)(.*)$/);
    if (!m) return './data/' + clean;
    const slashCount = (m[2].match(/\//g) || []).length;
    const prefix = slashCount > 0 ? '../'.repeat(slashCount) : './';
    return prefix + 'data/' + clean;
  }

if (window.__casInCompletionWatcher) return;
  window.__casInCompletionWatcher = true;

  let _chronologyCache = null;
  let _knownCompletedSagas = new Set();
  let _knownCompletedArcs = new Set();
  let _ready = false;

  function loadChronology() {
    if (_chronologyCache) return Promise.resolve(_chronologyCache);
    return fetch(_dataUrl('scenes-chronology.json'))
      .then(r => r.ok ? r.json() : null)
      .then(d => { _chronologyCache = d; return d; })
      .catch(() => null);
  }

  function getResults() {
    try { return JSON.parse(localStorage.getItem('scene_results') || '{}'); }
    catch { return {}; }
  }

  function computeCompletedSagas() {
    if (!_chronologyCache || !_chronologyCache.sagas) return new Set();
    const results = getResults();
    const out = new Set();
    _chronologyCache.sagas.forEach(saga => {
      const allDone = saga.scenes.every(sid => {
        const r = results[sid];
        return r && r.pct >= 60;
      });
      if (allDone) out.add(saga.id);
    });
    return out;
  }

  function computeCompletedArcs() {
    if (!window.NpcArcs || typeof window.NpcArcs.getAllArcs !== 'function') return new Set();
    const arcs = window.NpcArcs.getAllArcs();
    const out = new Set();
    arcs.forEach(a => {
      if (a.progress && a.progress.current >= a.progress.target && a.progress.target > 0) {
        out.add(a.npcId);
      }
    });
    return out;
  }

  function celebrateSaga(saga) {
    const xp = saga.completion_xp_bonus || 0;
    if (window.Celebration && typeof window.Celebration.show === 'function') {
      window.Celebration.show({
        icon: saga.icon || '🎬',
        title: 'SAGA BOUCLÉE',
        subtitle: `${saga.title}${xp ? ` · +${xp} XP bonus` : ''}`,
      });
    } else {
      flashGenericToast(`🏆 Saga bouclée : ${saga.icon || ''} ${saga.title}${xp ? ` · +${xp} XP` : ''}`);
    }
    // Ajouter le XP bonus si applicable et si Profile l'expose
    if (xp > 0 && window.Profile && typeof window.Profile.addXp === 'function') {
      try { window.Profile.addXp(xp, 'saga-bonus:' + saga.id); }
      catch (_) { /* noop */ }
    }
  }

  function celebrateArc(arc) {
    if (window.Celebration && typeof window.Celebration.show === 'function') {
      window.Celebration.show({
        icon: arc.icon || '👤',
        title: 'ARC COMPLÉTÉ',
        subtitle: arc.title + (arc.subtitle ? ' — ' + arc.subtitle : ''),
      });
    } else {
      flashGenericToast(`👤 Arc complété : ${arc.icon || ''} ${arc.title}`);
    }
  }

  function flashGenericToast(text) {
    let wrap = document.getElementById('gamification-generic-toasts');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'gamification-generic-toasts';
      document.body.appendChild(wrap);
    }
    const toast = document.createElement('div');
    toast.className = 'gamif-toast';
    toast.textContent = text;
    wrap.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('gamif-toast--visible'));
    setTimeout(() => toast.classList.add('gamif-toast--leaving'), 3000);
    setTimeout(() => toast.remove(), 3500);
  }

  // ─── Diff & déclenchement ─────────────────────────────────────
  async function checkCompletions() {
    if (!_ready) return;

    // Recharge l'état arcs (NpcArcs lit le localStorage à chaque appel)
    if (window.NpcArcs && typeof window.NpcArcs.evalAndUnlock === 'function') {
      try { window.NpcArcs.evalAndUnlock(); } catch (_) {}
    }

    const currentSagas = computeCompletedSagas();
    const currentArcs = computeCompletedArcs();

    // Diff sagas
    currentSagas.forEach(id => {
      if (!_knownCompletedSagas.has(id)) {
        const sagas = (_chronologyCache && _chronologyCache.sagas) || [];
        const saga = sagas.find(s => s.id === id);
        if (saga) {
          // Stagger : si on a aussi un arc qui se débloque en même temps
          setTimeout(() => celebrateSaga(saga), 600);
        }
      }
    });

    // Diff arcs
    currentArcs.forEach(id => {
      if (!_knownCompletedArcs.has(id)) {
        const arcs = (window.NpcArcs && typeof window.NpcArcs.getAllArcs === 'function')
          ? window.NpcArcs.getAllArcs()
          : [];
        const arc = arcs.find(a => a.npcId === id);
        if (arc) {
          setTimeout(() => celebrateArc(arc), 1400);
        }
      }
    });

    _knownCompletedSagas = currentSagas;
    _knownCompletedArcs = currentArcs;
  }

  // ─── Boot ─────────────────────────────────────────────────────
  async function init() {
    await loadChronology();
    if (window.NpcArcs && typeof window.NpcArcs.load === 'function') {
      try { await window.NpcArcs.load(); } catch (_) {}
    }

    // État initial : on considère ce qui est déjà bouclé comme "connu"
    _knownCompletedSagas = computeCompletedSagas();
    _knownCompletedArcs = computeCompletedArcs();
    _ready = true;
    console.log('[completion-watcher] ready — sagas terminées :', _knownCompletedSagas.size,
                ', arcs terminés :', _knownCompletedArcs.size);

    // Triggers : profile-changed (XP, achievements) + scene-results-changed custom
    window.addEventListener('profile-changed', () => {
      // Léger délai pour laisser scene_results s'écrire d'abord
      setTimeout(checkCompletions, 300);
    });
    window.addEventListener('scene-results-changed', () => {
      setTimeout(checkCompletions, 100);
    });
    // Storage event (autre onglet ou même onglet via setItem)
    window.addEventListener('storage', (e) => {
      if (e.key === 'scene_results') {
        setTimeout(checkCompletions, 100);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
  } else {
    setTimeout(init, 500);
  }

  window.CasInCompletionWatcher = { check: checkCompletions };
})();
