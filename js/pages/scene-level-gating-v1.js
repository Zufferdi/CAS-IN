/* ═══════════════════════════════════════════════════════════════
 * scene-level-gating-v1.js — v2.96
 *
 * Verrouillage SOFT des scènes expert tant que l'utilisateur n'a
 * pas validé ≥ HARD_THRESHOLD scènes hard à ≥ MIN_PCT %.
 * 
 * "Soft" : la card est marquée .locked (greyscale + opacity) avec
 * un cadenas, mais reste cliquable. Le click ouvre une confirmation
 * "Es-tu sûr(e) ? Ce cas est conçu pour les enquêteurs expérimentés"
 * qui débloque l'usage cas par cas.
 *
 * L'utilisateur peut aussi désactiver le gating définitivement
 * (toggle dans les paramètres OU bouton "Lever la limite" dans
 * la confirm dialog).
 *
 * Architecture :
 *   - IIFE auto-installée, idempotente (window.__casInLevelGating)
 *   - S'installe APRÈS lobby-v3 (defer + delay)
 *   - Observe le grid et wrap les cards expert
 *   - localStorage : cas_gating_disabled = '1' pour désactiver
 *                    cas_gating_allowed = JSON Set des scene_ids autorisés
 * ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';
  if (window.__casInLevelGating) return;
  window.__casInLevelGating = true;

  const HARD_THRESHOLD = 5;   // nb de hard validés exigés pour ouvrir les expert
  const MIN_PCT = 60;          // seuil de validation pédagogique

  const LS_DISABLED   = 'cas_gating_disabled';
  const LS_ALLOWED    = 'cas_gating_allowed';

  function lsGet(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch { /* noop */ }
  }

  function isGatingDisabled() {
    try { return localStorage.getItem(LS_DISABLED) === '1'; }
    catch { return false; }
  }

  function getAllowedSet() {
    const arr = lsGet(LS_ALLOWED, []);
    return new Set(Array.isArray(arr) ? arr : []);
  }
  function allow(sceneId) {
    const s = getAllowedSet();
    s.add(sceneId);
    lsSet(LS_ALLOWED, Array.from(s));
  }

  function countValidatedHard() {
    let results = {};
    try { results = JSON.parse(localStorage.getItem('scene_results') || '{}'); }
    catch { return 0; }
    if (typeof window.SCENES === 'undefined') return 0;
    const hardIds = new Set(
      window.SCENES.filter(s => s && s.difficulty === 'hard').map(s => s.id)
    );
    return Object.keys(results).filter(id => {
      if (!hardIds.has(id)) return false;
      const r = results[id];
      return r && typeof r.pct === 'number' && r.pct >= MIN_PCT;
    }).length;
  }

  function shouldGate() {
    if (isGatingDisabled()) return false;
    if (typeof window.SCENES === 'undefined') return false;
    return countValidatedHard() < HARD_THRESHOLD;
  }

  // ─── Wrap des cards expert ──────────────────────────────────────
  function applyGating() {
    if (!shouldGate()) {
      // Cleanup éventuel si l'utilisateur a passé le seuil
      document.querySelectorAll('.scene-card.gated-expert').forEach(c => {
        c.classList.remove('gated-expert', 'locked');
        const badge = c.querySelector('.gating-badge');
        if (badge) badge.remove();
      });
      removeBanner();
      return;
    }

    const allowed = getAllowedSet();
    const grid = document.getElementById('scene-grid');
    if (!grid) return;

    const cards = grid.querySelectorAll('.scene-card[data-scene-id][data-diff="expert"]');
    let lockedCount = 0;
    cards.forEach(card => {
      const sid = card.dataset.sceneId;
      if (allowed.has(sid)) {
        // Déjà autorisé explicitement par l'utilisateur
        card.classList.remove('gated-expert');
        const b = card.querySelector('.gating-badge'); if (b) b.remove();
        return;
      }
      if (card.classList.contains('gated-expert')) {
        // Déjà gaté → rien à refaire
        lockedCount++;
        return;
      }
      card.classList.add('gated-expert', 'locked');
      // Badge cadenas
      const badge = document.createElement('div');
      badge.className = 'gating-badge';
      badge.innerHTML = '🔒';
      badge.title = `Scène expert — verrouillée tant que tu n'as pas validé ${HARD_THRESHOLD} scènes "hard"`;
      card.appendChild(badge);
      // Intercepter le click en capture
      card.addEventListener('click', onGatedClick, true);
      lockedCount++;
    });

    renderBanner(lockedCount);
  }

  function onGatedClick(ev) {
    if (isGatingDisabled()) return; // si désactivé entre-temps
    const card = ev.currentTarget;
    if (!card.classList.contains('gated-expert')) return;
    const sid = card.dataset.sceneId;
    if (getAllowedSet().has(sid)) return; // déjà autorisé
    ev.preventDefault();
    ev.stopPropagation();
    openGateDialog(sid, card);
  }

  // ─── Dialog de confirmation ────────────────────────────────────
  function openGateDialog(sceneId, card) {
    // Remove any existing dialog first
    const existing = document.getElementById('gating-dialog');
    if (existing) existing.remove();

    const scene = (window.SCENES || []).find(s => s && s.id === sceneId) || {};
    const validatedHard = countValidatedHard();
    const remaining = Math.max(0, HARD_THRESHOLD - validatedHard);

    const dialog = document.createElement('div');
    dialog.className = 'gating-dialog-overlay';
    dialog.id = 'gating-dialog';
    dialog.innerHTML = `
      <div class="gating-dialog" role="dialog" aria-modal="true" aria-labelledby="gating-dialog-title">
        <button class="gating-dialog-close" aria-label="Fermer">×</button>
        <div class="gating-dialog-header">
          <div class="gating-dialog-icon">⚠</div>
          <h3 class="gating-dialog-title" id="gating-dialog-title">Scénario expert verrouillé</h3>
        </div>
        <p class="gating-dialog-scene">
          <strong>${escapeHTML(scene.title || sceneId)}</strong>
          <span class="gating-dialog-diff">EXPERT</span>
        </p>
        <p class="gating-dialog-body">
          Pour bénéficier de cette scène à fond, on conseille d'avoir d'abord
          validé <strong>${HARD_THRESHOLD} scènes de difficulté "hard"</strong>
          (≥${MIN_PCT}%). Tu en as actuellement
          <strong style="color:var(--gold)">${validatedHard}/${HARD_THRESHOLD}</strong>
          ${remaining > 0 ? `(${remaining} à faire)` : ''}.
        </p>
        <div class="gating-dialog-actions">
          <button class="gating-btn gating-btn-secondary" data-action="back">
            ← Choisir une scène plus accessible
          </button>
          <button class="gating-btn gating-btn-primary" data-action="play">
            ▶ Je suis prêt(e), lancer quand même
          </button>
        </div>
        <details class="gating-dialog-options">
          <summary>Options avancées</summary>
          <button class="gating-btn gating-btn-ghost" data-action="disable">
            Désactiver complètement le verrouillage
          </button>
        </details>
      </div>
    `;

    document.body.appendChild(dialog);
    requestAnimationFrame(() => dialog.classList.add('open'));

    function close() {
      dialog.classList.remove('open');
      setTimeout(() => dialog.remove(), 200);
    }

    dialog.querySelector('.gating-dialog-close').addEventListener('click', close);
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) close();
    });

    dialog.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'back') {
          close();
        } else if (action === 'play') {
          allow(sceneId);
          close();
          // Re-trigger click (sans l'intercepteur)
          setTimeout(() => {
            card.classList.remove('gated-expert', 'locked');
            const badge = card.querySelector('.gating-badge');
            if (badge) badge.remove();
            // Synthesize a click (the listener with capture=true is removed via class check)
            card.click();
          }, 220);
        } else if (action === 'disable') {
          if (confirm('Désactiver le verrouillage des scènes expert pour toutes les futures sessions ?\n\n(Tu peux le réactiver via les paramètres.)')) {
            try { localStorage.setItem(LS_DISABLED, '1'); } catch {}
            close();
            applyGating(); // cleanup
          }
        }
      });
    });

    // Esc to close
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  // ─── Banner explicatif (s'affiche en haut du grid) ─────────────
  function renderBanner(lockedCount) {
    if (lockedCount === 0) { removeBanner(); return; }
    const grid = document.getElementById('scene-grid');
    if (!grid) return;
    let banner = document.getElementById('gating-banner');
    const validatedHard = countValidatedHard();
    const html = `
      <div class="gating-banner-content">
        <span class="gating-banner-icon">🎓</span>
        <div class="gating-banner-text">
          <div class="gating-banner-title">${lockedCount} scènes expert verrouillées</div>
          <div class="gating-banner-sub">
            Valide ${HARD_THRESHOLD - validatedHard} scènes "hard" (≥${MIN_PCT}%) supplémentaires
            pour les ouvrir naturellement. Ou clique sur une expert pour la débloquer ponctuellement.
          </div>
        </div>
        <button class="gating-banner-dismiss" title="Masquer">×</button>
      </div>
    `;
    if (banner) {
      banner.innerHTML = html;
    } else {
      banner = document.createElement('div');
      banner.id = 'gating-banner';
      banner.className = 'gating-banner';
      banner.innerHTML = html;
      grid.insertBefore(banner, grid.firstChild);
    }
    banner.querySelector('.gating-banner-dismiss')?.addEventListener('click', () => {
      try { localStorage.setItem('cas_gating_banner_dismissed', '1'); } catch {}
      banner.remove();
    });
    // Honor dismissed
    try {
      if (localStorage.getItem('cas_gating_banner_dismissed') === '1') banner.remove();
    } catch {}
  }
  function removeBanner() {
    const b = document.getElementById('gating-banner');
    if (b) b.remove();
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, ch => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]
    ));
  }

  // ─── Boot et observation des changements de grid ───────────────
  function init() {
    applyGating();

    // Observer le grid pour réappliquer quand lobby-v3 le repeuple
    const grid = document.getElementById('scene-grid');
    if (grid) {
      const obs = new MutationObserver(() => {
        // Throttle : un seul applyGating par tick
        clearTimeout(init._t);
        init._t = setTimeout(applyGating, 80);
      });
      obs.observe(grid, { childList: true, subtree: false });
    }

    // Réappliquer après chaque retour au lobby
    window.addEventListener('scene-results-changed', applyGating);
    window.addEventListener('hashchange', () => setTimeout(applyGating, 200));
  }

  // Boot après que SCENES soit chargé
  function waitForScenes(retries = 30) {
    if (typeof window.SCENES !== 'undefined' && Array.isArray(window.SCENES) && window.SCENES.length > 0) {
      init();
      return;
    }
    if (retries <= 0) return;
    setTimeout(() => waitForScenes(retries - 1), 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(waitForScenes, 400));
  } else {
    setTimeout(waitForScenes, 400);
  }

  // API publique (pour debug + integration future avec un panel paramètres)
  window.CasInGating = {
    apply: applyGating,
    isDisabled: isGatingDisabled,
    enable: () => { try { localStorage.removeItem(LS_DISABLED); } catch {} applyGating(); },
    disable: () => { try { localStorage.setItem(LS_DISABLED, '1'); } catch {} applyGating(); },
    reset: () => { try { localStorage.removeItem(LS_ALLOWED); localStorage.removeItem('cas_gating_banner_dismissed'); } catch {} applyGating(); },
    countValidatedHard,
    HARD_THRESHOLD, MIN_PCT,
  };

  console.log('[gating] v2.96 loaded');
})();
