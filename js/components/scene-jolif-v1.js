/* ═══════════════════════════════════════════════════════════════
 * scene-jolif-v1.js — v3.3.0 (Jolification scène — fix critiques)
 *
 * Branche des améliorations UX au scene engine v4 :
 *   P1.  Briefing condensé par défaut + toggle "Voir le briefing complet"
 *   P1+. (v3.3) Bandeau Faveurs PNJ traité séparément : reste actionnable
 *        en mode condensé, sous forme de chip cliquable qui s'étend.
 *   P2.  Auto-scroll vers le feedback dès qu'il apparaît
 *   P2.  Raccourcis clavier : 1-9 pour choisir, Entrée/Espace pour Suivant
 *   P2+. (v3.3) Le focus auto sur "Suivant" est désactivé si l'utilisateur
 *        a scrollé après l'apparition du feedback (il lit autre chose).
 *   P1++ (v3.3) Première visite : tant que l'utilisateur n'a pas vu N
 *        briefings complets, le mode défaut est 'full' (pédago > UX).
 *
 * S'auto-installe au DOMContentLoaded. Non invasif : observe le DOM
 * et patche les éléments existants sans toucher au scene engine.
 *
 * Préférences persistées :
 *   localStorage.cas_briefing_mode      = 'condensed' | 'full' (préf manuelle)
 *   localStorage.cas_briefing_seen_full = '0'..'3' (compteur d'exposition)
 *
 * ─── Changements v3.3 vs v3.2.3 ─────────────────────────────
 *   • T1 — Retrait de '.npc-favors-banner' du tableau SECONDARY (le
 *     sélecteur était de toute façon incorrect : la vraie classe est
 *     'favors-banner'). Remplacé par un traitement dédié qui collapse
 *     le bandeau en chip cliquable au lieu de le masquer.
 *   • T2 — Première visite : `getBriefingMode()` retourne 'full' tant
 *     que `cas_briefing_seen_full < FULL_SEEN_THRESHOLD`, sauf si une
 *     préférence manuelle explicite existe (qui court-circuite tout).
 *   • T3 — Focus auto sur "Suivant" conditionné à l'absence de scroll
 *     utilisateur depuis l'apparition du feedback (heuristique 500ms
 *     pour distinguer le scroll programmatique du scroll volontaire).
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__casInJolif) return;
  window.__casInJolif = true;

  const LS_BRIEF_MODE = 'cas_briefing_mode';
  const LS_BRIEF_SEEN = 'cas_briefing_seen_full';
  const FULL_SEEN_THRESHOLD = 3;

  // ─── P1 : Briefing condensé ──────────────────────────────────
  // Sélecteurs des éléments "secondaires" du briefing à masquer en condensé.
  // On garde TOUJOURS visibles : briefing-top (titre+hook+description)
  //   + warning sensible (.v4-sensitive-warning) + bouton démarrer.
  // v3.3 : '.npc-favors-banner' RETIRÉ — le bandeau Faveurs est actionnable
  //        (boutons indices/excuses), pas informatif. Traité via
  //        collapseFavorsBanner() qui le bascule en chip cliquable.
  const SECONDARY = [
    '.v4-briefing-id',           // Carte d'identité v4 (durée, niveau, articles)
    '.scene-arc-pill',           // Pill arcs/sagas
    '.scene-arc-context-pill',   // Pill arc-context
    '.briefing-situation',       // Situation initiale (si tag custom)
    '.briefing-articles',        // Articles juridiques (si tag custom)
  ];

  function getSeenFullCount() {
    try { return parseInt(localStorage.getItem(LS_BRIEF_SEEN) || '0', 10) || 0; }
    catch { return 0; }
  }
  function bumpSeenFullCount() {
    try { localStorage.setItem(LS_BRIEF_SEEN, String(getSeenFullCount() + 1)); }
    catch (_) { /* noop */ }
  }
  function hasExplicitMode() {
    try {
      const v = localStorage.getItem(LS_BRIEF_MODE);
      return v === 'condensed' || v === 'full';
    } catch { return false; }
  }
  function getBriefingMode() {
    // Priorité 1 : préférence manuelle explicite (l'utilisateur a déjà cliqué le toggle)
    try {
      const explicit = localStorage.getItem(LS_BRIEF_MODE);
      if (explicit === 'condensed' || explicit === 'full') return explicit;
    } catch (_) {}
    // Priorité 2 : auto-full tant qu'on n'a pas vu N briefings complets
    if (getSeenFullCount() < FULL_SEEN_THRESHOLD) return 'full';
    // Sinon : condensé par défaut
    return 'condensed';
  }
  function setBriefingMode(mode) {
    try { localStorage.setItem(LS_BRIEF_MODE, mode); } catch (_) {}
  }

  // ─── P1+ : Bandeau Faveurs en chip cliquable (v3.3) ──────────
  function collapseFavorsBanner(card) {
    const banner = card.querySelector('#favors-banner, .favors-banner');
    if (!banner) return;
    const mode = getBriefingMode();

    // En mode full : version complète, on retire le mode chip
    if (mode === 'full') {
      banner.classList.remove('favors-banner--chip', 'favors-banner--chip-expanded');
      return;
    }

    // En mode condensé : on bascule vers une version chip
    banner.classList.add('favors-banner--chip');

    // Si chip déjà installé, on rafraîchit juste le résumé (au cas où
    // une faveur vient d'être consommée ou un PNJ état changé)
    let summary = banner.querySelector('.favors-chip-summary');
    const parts = computeFavorsChipSummary(banner);
    const summaryHTML = `🎭 Relations : ${parts.length ? parts.join(' · ') : 'aucune'} <span class="favors-chip-caret">▾</span>`;

    if (!summary) {
      summary = document.createElement('button');
      summary.type = 'button';
      summary.className = 'favors-chip-summary';
      summary.setAttribute('aria-expanded', 'false');
      summary.setAttribute('aria-label', 'Déplier les relations PNJ');
      summary.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isExpanded = banner.classList.toggle('favors-banner--chip-expanded');
        summary.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      });
      banner.insertBefore(summary, banner.firstChild);
    }
    summary.innerHTML = summaryHTML;
  }

  function computeFavorsChipSummary(banner) {
    // Compte rapide pour le chip : faveurs disponibles, hostiles, méfiance
    const favs = banner.querySelectorAll('.favor-btn:not([disabled])').length;
    const host = banner.querySelectorAll('.favor-block-hostiles .favor-hostile-item').length;
    const mef  = banner.querySelector('.favor-block-mefiants') ? 1 : 0;
    const used = banner.querySelector('.favor-used-note') ? 1 : 0;
    const parts = [];
    if (favs) parts.push(`🤝 ${favs} faveur${favs > 1 ? 's' : ''}`);
    else if (used) parts.push('🤝 faveur utilisée');
    if (host) parts.push(`😠 ${host} hostile${host > 1 ? 's' : ''}`);
    if (mef)  parts.push('🤨 méfiance');
    return parts;
  }

  // ─── Application du mode ────────────────────────────────────
  function applyBriefingMode(card) {
    if (!card) return;
    const mode = getBriefingMode();

    SECONDARY.forEach(sel => {
      card.querySelectorAll(sel).forEach(el => {
        el.setAttribute('data-jolif-secondary', '1');
        el.style.display = (mode === 'condensed') ? 'none' : '';
      });
    });

    // v3.3 : Faveurs traitées séparément (chip cliquable, pas display:none)
    collapseFavorsBanner(card);

    // Met à jour le label du toggle
    const tog = card.querySelector('.jolif-brief-toggle');
    if (tog) {
      const isExplicit = hasExplicitMode();
      const remainingForcedFull = !isExplicit && getSeenFullCount() < FULL_SEEN_THRESHOLD
        ? Math.max(0, FULL_SEEN_THRESHOLD - getSeenFullCount())
        : 0;
      let label;
      if (mode === 'condensed') {
        label = '📖 Voir le briefing complet';
      } else if (remainingForcedFull > 0) {
        // Mode full automatique première visite : on l'indique pour ne pas
        // faire croire à l'utilisateur que c'est sa préférence définitive
        label = `📕 Briefing complet (${remainingForcedFull} restant${remainingForcedFull > 1 ? 's' : ''} avant condensé auto)`;
      } else {
        label = '📕 Masquer les détails';
      }
      tog.textContent = label;
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

    // v3.3 : compteur d'exposition. On bump une fois par scène, quand le
    // briefing s'affiche en mode full ET qu'il est suffisamment rempli pour
    // qu'on puisse considérer qu'il a été "exposé".
    let bumpedThisScene = false;
    const maybeBumpSeenFull = () => {
      if (bumpedThisScene) return;
      if (hasExplicitMode()) return;            // préférence manuelle → pas de compteur
      if (getBriefingMode() !== 'full') return; // déjà en condensé → pas pertinent
      // Heuristique d'exposition réelle : la fiche d'identité v4 est rendue
      // (ça veut dire que enrichBriefing de scene-engine-v4 est passé)
      if (!card.querySelector('.v4-briefing-id')) return;
      bumpedThisScene = true;
      bumpSeenFullCount();
    };

    if (card.children.length > 0) {
      injectBriefingToggle(card);
      maybeBumpSeenFull();
    }
    const obs = new MutationObserver(() => {
      // Reset du flag quand la scène change (briefing-content se vide puis se remplit)
      if (card.children.length === 0) {
        bumpedThisScene = false;
        return;
      }
      if (!card.querySelector('.jolif-brief-toggle')) {
        injectBriefingToggle(card);
      } else {
        applyBriefingMode(card);
      }
      maybeBumpSeenFull();
    });
    obs.observe(card, { childList: true, subtree: false });
  }

  // ─── P2.a : Auto-scroll vers le feedback (v3.3 : focus conditionnel) ───
  function observeFeedback() {
    const fb = document.getElementById('feedback-area');
    if (!fb) return;

    // v3.3 : détection du scroll utilisateur après apparition du feedback.
    // Le scroll programmatique de scrollIntoView({behavior:'smooth'}) dure
    // typiquement 300-400ms, donc on ne compte comme "user scroll" que les
    // événements arrivant après 500ms. Heuristique simple et robuste.
    let userScrolledAfterFeedback = false;
    let feedbackAppearedAt = 0;
    const SCROLL_IGNORE_MS = 500;

    const onScroll = () => {
      if (!feedbackAppearedAt) return;
      if (Date.now() - feedbackAppearedAt > SCROLL_IGNORE_MS) {
        userScrolledAfterFeedback = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const obs = new MutationObserver(() => {
      if (fb.style.display !== 'none' && fb.children.length > 0) {
        // Nouveau feedback : reset
        feedbackAppearedAt = Date.now();
        userScrolledAfterFeedback = false;

        const rect = fb.getBoundingClientRect();
        const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (!inView) {
          fb.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // Focus auto sur "Suivant" — sauf si l'utilisateur a pris la main
        setTimeout(() => {
          if (userScrolledAfterFeedback) return; // respect : il lit autre chose
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
    // v3.3 — Helpers debug
    getSeenFullCount,
    resetSeenFullCount: () => { try { localStorage.removeItem(LS_BRIEF_SEEN); } catch (_) {} },
    forceMode: (mode) => {
      // 'auto' efface la préférence manuelle (retour au comportement par défaut)
      if (mode === 'auto') {
        try { localStorage.removeItem(LS_BRIEF_MODE); } catch (_) {}
      } else if (mode === 'condensed' || mode === 'full') {
        setBriefingMode(mode);
      }
      const card = document.getElementById('briefing-content');
      if (card) applyBriefingMode(card);
    },
  };
})();
