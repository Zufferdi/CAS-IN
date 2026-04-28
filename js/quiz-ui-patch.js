/* ============================================================
   CAS-IN v2.6 · quiz-ui-patch.js
   Patches UI pour le Groupe B (header allégé + action-row state machine).
   Chargé APRÈS quiz-app.js, ne modifie pas le coeur du JS principal.
   ============================================================ */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────
  // 1) Menu "Plus" (⋯) — handlers absents de quiz-app.js
  // ─────────────────────────────────────────────────────────
  window.toggleMoreMenu = function () {
    const menu = document.getElementById('more-menu');
    if (!menu) return;
    const wasOpen = menu.classList.contains('open');
    // ferme aussi l'autre dropdown si ouvert (mutex)
    document.getElementById('enquete-menu')?.classList.remove('open');
    if (!wasOpen) menu.classList.add('open');
    else menu.classList.remove('open');
  };

  window.closeMoreMenu = function () {
    document.getElementById('more-menu')?.classList.remove('open');
  };

  // Fermeture au clic extérieur
  document.addEventListener('click', function (e) {
    const more = document.getElementById('more-dropdown');
    if (more && !more.contains(e.target)) window.closeMoreMenu();
  });

  // Fermeture au clic sur un item
  document.addEventListener('click', function (e) {
    const item = e.target.closest('#more-menu .hdr-dropdown-item');
    if (item) {
      // léger délai pour laisser l'action se déclencher
      setTimeout(window.closeMoreMenu, 0);
    }
  });

  // ─────────────────────────────────────────────────────────
  // 2) Label son dans le menu Plus — synchroniser avec toggleSound()
  // ─────────────────────────────────────────────────────────
  // Le quiz-app.js fait `sound-btn.textContent = '🔊'` ou '🔇'.
  // Notre nouveau bouton contient maintenant un span d'icône et un span de label.
  // On wrappe la fonction toggleSound originale pour aussi mettre à jour le label.
  const origToggleSound = window.toggleSound;
  if (typeof origToggleSound === 'function') {
    window.toggleSound = function () {
      origToggleSound.apply(this, arguments);
      syncSoundLabel();
    };
  }

  function syncSoundLabel() {
    const btn = document.getElementById('sound-btn');
    const lbl = document.getElementById('sound-label');
    if (!btn || !lbl) return;
    // Le JS principal a déjà mis '🔊' ou '🔇' dans textContent — mais ça écrase nos spans.
    // On reconstruit le bouton si textContent n'a plus la structure attendue.
    const txt = btn.textContent.trim();
    if (txt === '🔊') {
      btn.innerHTML = '<span>🔊</span> <span id="sound-label">Son activé</span>';
    } else if (txt === '🔇') {
      btn.innerHTML = '<span>🔇</span> <span id="sound-label">Son coupé</span>';
    }
  }
  // Synchro initiale (au cas où quiz-app.js a mis le textContent au boot)
  document.addEventListener('DOMContentLoaded', () => setTimeout(syncSoundLabel, 50));
  // Aussi après le load complet (quiz-app.js est defer)
  window.addEventListener('load', () => setTimeout(syncSoundLabel, 100));

  // ─────────────────────────────────────────────────────────
  // 3) Action-row : griser hint-btn / skip-btn après validation
  //    (au lieu de les masquer comme le fait le JS d'origine)
  // ─────────────────────────────────────────────────────────
  // On intercepte les changements de display sur ces deux boutons et on
  // les transforme en `disabled = true/false` pour préserver leur place.
  // Au lieu de patcher chaque appel, on observe le DOM via MutationObserver.
  function setupActionRowGuard() {
    const hint = document.getElementById('hint-btn');
    const skip = document.getElementById('skip-btn');
    if (!hint || !skip) return;

    function syncDisabled(btn) {
      // Le JS principal manipule btn.style.display. Si display = 'none' → disabled = true.
      // Mais on ne veut PAS qu'ils disparaissent, donc on neutralise le display.
      const dispStyle = btn.style.display;
      if (dispStyle === 'none') {
        btn.disabled = true;
        btn.style.display = '';   // remettre visible
      } else if (dispStyle === 'block' || dispStyle === '') {
        btn.disabled = false;
      }
    }

    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'style') syncDisabled(m.target);
      }
    });
    [hint, skip].forEach(btn => {
      obs.observe(btn, { attributes: true, attributeFilter: ['style'] });
      // Synchro initiale
      syncDisabled(btn);
    });
  }

  // ─────────────────────────────────────────────────────────
  // 4) Stub pour openExplModal — le bouton expl-btn a été supprimé
  //    mais le JS principal a encore une référence dormante au cas où.
  // ─────────────────────────────────────────────────────────
  if (typeof window.openExplModal !== 'function') {
    // Si pas défini (ne devrait pas arriver), no-op silencieux
    window.openExplModal = function () {
      console.debug('[quiz-ui-patch] openExplModal called but explanation now inline.');
    };
  }

  // ─────────────────────────────────────────────────────────
  // Boot
  // ─────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupActionRowGuard);
  } else {
    setupActionRowGuard();
  }
})();
