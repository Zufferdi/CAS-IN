/* ═══════════════════════════════════════════════════════════════
 * cas-in-npc-state.js — v2.71 (Niveau 4)
 *
 * Gère l'état dynamique des PNJ : trust (0-100), interactions,
 * state (hostile|méfiant|professionnel|complice).
 *
 * État persisté en localStorage sous la clé 'cas_npc_state'.
 *
 * API publique :
 *   NpcState.get(id)              → { trust, state, interactions: [...] }
 *   NpcState.recordInteraction(npcIds, sceneId, outcome)
 *                                 → trust mis à jour selon outcome
 *   NpcState.getState(id)         → 'hostile'|'méfiant'|'professionnel'|'complice'
 *   NpcState.getAllStates()       → { id: state, ... }
 *   NpcState.getCounts()          → { hostile: n, méfiant: n, ... }
 *   NpcState.reset()              → tout RAZ
 *   NpcState.rebuildFromMastery() → reconstruction rétroactive
 *   NpcState.getEncountered()     → liste des PNJ déjà rencontrés
 *
 * Source de l'état dérivé "state" depuis trust (0-100) :
 *   0-25  → hostile
 *   26-50 → méfiant
 *   51-75 → professionnel  (état neutre par défaut, trust de départ = 50)
 *   76-100 → complice
 *
 * Outcomes (mapping vers delta de trust) :
 *   'success'   → +10 par PNJ de la scène
 *   'degraded'  →  +5
 *   'failure'   → -15
 *   'critical'  → -25 (choix critical raté)
 * ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STORAGE_KEY = 'cas_npc_state';
  const TRUST_DEFAULT = 50;
  const TRUST_MIN = 0;
  const TRUST_MAX = 100;

  const OUTCOME_DELTA = {
    success: +10,
    degraded: +5,
    failure: -15,
    critical: -25,
  };

  // ── Storage helpers ────────────────────────────────────────
  function _read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function _write(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _clamp(n) {
    return Math.max(TRUST_MIN, Math.min(TRUST_MAX, n));
  }

  // ── Dérivation state à partir de trust ───────────────────
  function trustToState(trust) {
    if (trust <= 25) return 'hostile';
    if (trust <= 50) return 'méfiant';
    if (trust <= 75) return 'professionnel';
    return 'complice';
  }

  function stateLabel(state) {
    const labels = {
      hostile: '😠 Hostile',
      'méfiant': '🤨 Méfiant',
      'professionnel': '🙂 Professionnel',
      complice: '🤝 Complice',
    };
    return labels[state] || state;
  }

  function stateIcon(state) {
    const icons = {
      hostile: '😠',
      'méfiant': '🤨',
      'professionnel': '🙂',
      complice: '🤝',
    };
    return icons[state] || '😐';
  }

  // ── API publique ───────────────────────────────────────────

  function get(id) {
    const all = _read();
    if (all[id]) {
      return {
        ...all[id],
        state: trustToState(all[id].trust),
      };
    }
    return null;  // jamais rencontré
  }

  function getOrInit(id) {
    const existing = get(id);
    if (existing) return existing;
    return {
      trust: TRUST_DEFAULT,
      interactions: [],
      state: trustToState(TRUST_DEFAULT),
    };
  }

  function getState(id) {
    const data = get(id);
    return data ? data.state : null;
  }

  function recordInteraction(npcIds, sceneId, outcome) {
    if (!Array.isArray(npcIds)) npcIds = [npcIds];
    if (!OUTCOME_DELTA.hasOwnProperty(outcome)) {
      console.warn('NpcState: outcome inconnu :', outcome);
      return;
    }
    const delta = OUTCOME_DELTA[outcome];
    const all = _read();
    const now = new Date().toISOString().split('T')[0];

    npcIds.forEach(id => {
      if (!id) return;
      if (!all[id]) {
        all[id] = {
          trust: TRUST_DEFAULT,
          interactions: [],
        };
      }
      // Évite les doublons : si même scène + même outcome déjà enregistré → skip
      const existing = all[id].interactions.find(i => i.scene === sceneId && i.outcome === outcome);
      if (existing) return;

      all[id].trust = _clamp(all[id].trust + delta);
      all[id].interactions.push({
        scene: sceneId,
        outcome: outcome,
        date: now,
      });
      // Limiter l'historique aux 50 derniers
      if (all[id].interactions.length > 50) {
        all[id].interactions = all[id].interactions.slice(-50);
      }
    });

    _write(all);
  }

  function getAllStates() {
    const all = _read();
    const out = {};
    for (const id in all) {
      out[id] = trustToState(all[id].trust);
    }
    return out;
  }

  function getCounts() {
    const all = _read();
    const counts = { hostile: 0, 'méfiant': 0, 'professionnel': 0, complice: 0 };
    for (const id in all) {
      counts[trustToState(all[id].trust)]++;
    }
    return counts;
  }

  function getEncountered() {
    const all = _read();
    return Object.keys(all);
  }

  function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ── Reconstruction rétroactive depuis Mastery ─────────────
  function rebuildFromMastery() {
    if (typeof window.Mastery === 'undefined' || !window.Mastery.getTier) {
      console.warn('NpcState.rebuildFromMastery: Mastery non disponible');
      return false;
    }
    if (typeof window.SCENES === 'undefined' || !Array.isArray(window.SCENES)) {
      console.warn('NpcState.rebuildFromMastery: SCENES non disponibles');
      return false;
    }

    // Reset puis rebuild
    reset();
    const all = {};
    let processedScenes = 0;

    window.SCENES.forEach(scene => {
      if (!scene.id || !scene.npcs) return;
      const tier = window.Mastery.getTier(scene.id);
      if (tier === 'untouched') return;

      let outcome;
      if (tier === 'mastered') outcome = 'success';
      else if (tier === 'cleared') outcome = 'success';
      else if (tier === 'touched') outcome = 'degraded';
      else outcome = null;

      if (!outcome) return;

      const npcIds = scene.npcs.map(n => typeof n === 'string' ? n : n.id).filter(Boolean);
      const delta = OUTCOME_DELTA[outcome];

      npcIds.forEach(id => {
        if (!all[id]) {
          all[id] = {
            trust: TRUST_DEFAULT,
            interactions: [],
          };
        }
        all[id].trust = _clamp(all[id].trust + delta);
        all[id].interactions.push({
          scene: scene.id,
          outcome: outcome,
          date: '(rétroactif)',
        });
      });
      processedScenes++;
    });

    _write(all);
    return {
      scenes: processedScenes,
      npcs: Object.keys(all).length,
    };
  }

  // ── Helpers UI ─────────────────────────────────────────────

  function trustBar(trust, width) {
    const w = width || 100;
    const pct = Math.max(0, Math.min(100, trust));
    const color = trust <= 25 ? '#dc3c46' :
                  trust <= 50 ? '#e68232' :
                  trust <= 75 ? '#dcc832' : '#32b464';
    return `<div class="npc-trust-bar" style="width:${w}px;height:6px;background:rgba(80,88,100,0.3);border-radius:3px;overflow:hidden;display:inline-block;vertical-align:middle">
      <div style="width:${pct}%;height:100%;background:${color};transition:width 0.3s"></div>
    </div>`;
  }

  // ── Exposition globale ───────────────────────────────────
  window.NpcState = {
    get,
    getOrInit,
    getState,
    getAllStates,
    getCounts,
    getEncountered,
    recordInteraction,
    reset,
    rebuildFromMastery,
    // utils
    trustToState,
    stateLabel,
    stateIcon,
    trustBar,
    OUTCOME_DELTA,
    TRUST_DEFAULT,
  };

})();
