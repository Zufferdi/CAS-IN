/* ═══════════════════════════════════════════════════════════════
 * scene-jolif-v1.js — v3.2.3 (Jolification scène)
 *
 * Branche 3 améliorations UX au scene engine v4 :
 *   P1. Briefing condensé par défaut + toggle "Voir le briefing complet"
 *   P2. Auto-scroll vers le feedback dès qu'il apparaît
 *   P2. Raccourcis clavier : 1-9 pour choisir, Entrée/Espace pour Suivant
 *
 * S'auto-installe au DOMContentLoaded. Non invasif : observe le DOM
 * et patche les éléments existants sans toucher au scene engine.
 *
 * Préférence persistée :
 *   localStorage.cas_briefing_mode = 'condensed' | 'full'
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__casInJolif) return;
  window.__casInJolif = true;

  const LS_BRIEF_MODE = 'cas_briefing_mode';

  // ─── P1 : Briefing condensé ──────────────────────────────────
  function getBriefingMode() {
    try { return localStorage.getItem(LS_BRIEF_MODE) || 'condensed'; }
    catch { return 'condensed'; }
  }
  function setBriefingMode(mode) {
    try { localStorage.setItem(LS_BRIEF_MODE, mode); } catch (_) {}
  }

  function applyBriefingMode(card) {
    if (!card) return;
    const mode = getBriefingMode();
    // Sélecteurs des éléments "secondaires" du briefing à masquer en condensé.
    // On garde TOUJOURS visibles : briefing-top (titre+hook+description)
    //   + warning sensible (.v4-sensitive-warning) + bouton démarrer.
    const SECONDARY = [
      '.v4-briefing-id',           // Carte d'identité v4 (durée, niveau, articles)
      '.npc-favors-banner',        // Bandeau Relations en jeu
      '.scene-arc-pill',           // Pill arcs/sagas
      '.scene-arc-context-pill',   // Pill arc-context
      '.briefing-situation',       // Situation initiale (si tag custom)
      '.briefing-articles',        // Articles juridiques (si tag custom)
    ];
    SECONDARY.forEach(sel => {
      card.querySelectorAll(sel).forEach(el => {
        el.setAttribute('data-jolif-secondary', '1');
        el.style.display = (mode === 'condensed') ? 'none' : '';
      });
    });
    // Met à jour le label du toggle
    const tog = card.querySelector('.jolif-brief-toggle');
    if (tog) {
      tog.textContent = (mode === 'condensed')
        ? '📖 Voir le briefing complet'
        : '📕 Masquer les détails';
      tog.setAttribute('aria-expanded', mode === 'full' ? 'true' : 'false');
    }
  }

  function injectBriefingToggle(card) {
    if (!card || card.querySelector('.jolif-brief-toggle')) return;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'jolif-brief-toggle';
    toggle.setAttribute('aria-expanded', getBriefingMode() === 'full' ? 'true' : 'false');
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newMode = getBriefingMode() === 'condensed' ? 'full' : 'condensed';
      setBriefingMode(newMode);
      applyBriefingMode(card);
    });
    // Localisation : avant le bouton start s'il existe
    const startBtn = card.querySelector(
      '.path-btn, .briefing-start-btn, [onclick*="launchRecommendedScene"], [onclick*="startScene"], button[onclick*="next"]'
    );
    if (startBtn && startBtn.parentElement) {
      startBtn.parentElement.insertBefore(toggle, startBtn);
    } else {
      card.appendChild(toggle);
    }
    applyBriefingMode(card);
  }

  function observeBriefing() {
    const card = document.getElementById('briefing-content');
    if (!card) return;
    if (card.children.length > 0) {
      injectBriefingToggle(card);
    }
    const obs = new MutationObserver(() => {
      if (!card.querySelector('.jolif-brief-toggle') && card.children.length > 0) {
        injectBriefingToggle(card);
      } else {
        applyBriefingMode(card);
      }
    });
    obs.observe(card, { childList: true, subtree: false });
  }

  // ─── P2.a : Auto-scroll vers le feedback ────────────────────
  function observeFeedback() {
    const fb = document.getElementById('feedback-area');
    if (!fb) return;
    const obs = new MutationObserver(() => {
      if (fb.style.display !== 'none' && fb.children.length > 0) {
        const rect = fb.getBoundingClientRect();
        const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (!inView) {
          fb.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // Focus auto sur le bouton "Suivant" s'il devient enabled
        setTimeout(() => {
          const nextBtn = document.getElementById('next-step-btn');
          if (nextBtn && !nextBtn.disabled) {
            try { nextBtn.focus({ preventScroll: true }); }
            catch (_) { try { nextBtn.focus(); } catch (__) {} }
          }
        }, 350);
      }
    });
    obs.observe(fb, {
      attributes: true,
      attributeFilter: ['style'],
      childList: true,
    });
  }

  // ─── P2.b : Pills 1/2/3 sur les boutons + raccourcis clavier ────
  function refreshChoiceKeys() {
    const buttons = [...document.querySelectorAll('.choice-btn:not(.eliminated)')]
      .filter(b => !b.disabled && b.offsetParent !== null);
    buttons.forEach((btn, idx) => {
      // Nettoyer les anciennes pills
      const oldKey = btn.querySelector('.jolif-choice-key');
      if (oldKey) oldKey.remove();
      if (idx >= 9) return;
      const key = document.createElement('span');
      key.className = 'jolif-choice-key';
      key.textContent = String(idx + 1);
      btn.insertBefore(key, btn.firstChild);
    });
  }

  function observeChoices() {
    const sceneContent = document.getElementById('step-content') || document.getElementById('screen-scene');
    if (!sceneContent) return;
    refreshChoiceKeys();
    const obs = new MutationObserver(() => {
      // Rafraîchir avec un léger délai pour laisser le DOM se stabiliser
      clearTimeout(window.__casInJolifTimer);
      window.__casInJolifTimer = setTimeout(refreshChoiceKeys, 50);
    });
    obs.observe(sceneContent, { childList: true, subtree: true });
  }

  function bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ne pas intercepter si l'user tape dans un input/textarea
      const ae = document.activeElement;
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Seulement actif sur screen-scene
      const sceneScreen = document.getElementById('screen-scene');
      if (!sceneScreen || !sceneScreen.classList.contains('active')) return;

      // Touches 1-9 : choisir
      if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        const buttons = [...document.querySelectorAll('.choice-btn:not(.eliminated):not(:disabled)')]
          .filter(b => b.offsetParent !== null);
        if (buttons[idx]) {
          e.preventDefault();
          buttons[idx].classList.add('jolif-pulse');
          setTimeout(() => buttons[idx].classList.remove('jolif-pulse'), 200);
          buttons[idx].click();
        }
        return;
      }
      // Entrée ou Espace : passer au prochain step
      if (e.key === 'Enter' || e.key === ' ') {
        const nextBtn = document.getElementById('next-step-btn');
        if (nextBtn && !nextBtn.disabled && nextBtn.offsetParent !== null) {
          e.preventDefault();
          nextBtn.click();
        }
      }
    });
  }

  // ─── Init ────────────────────────────────────────────────────
  function init() {
    observeBriefing();
    observeFeedback();
    observeChoices();
    bindKeyboardShortcuts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API publique
  window.CasInJolif = {
    getBriefingMode,
    setBriefingMode,
    applyBriefingMode: () => {
      const card = document.getElementById('briefing-content');
      if (card) applyBriefingMode(card);
    },
    refreshChoiceKeys,
  };
})();
