/* CAS-IN — js/components/fiche-common.js
 * ───────────────────────────────────────
 * Centralise les comportements UI répétés dans toutes les fiches :
 *   • Barre de progression de défilement (.scroll-progress / #scroll-progress)
 *   • Bouton retour-haut (#back-top / .back-top)
 *   • Quiz révélation (.quiz-reveal-btn → .quiz-answer)
 *   • Sections collapsibles (.collapsible / .collapsible-header)
 *   • Onglets génériques (data-tab-group / data-tab-btn / data-tab-page)
 *
 * AVANT v2.20 : ces 4 fonctionnalités étaient INLINE dans 108+ fiches HTML
 * (~5 KB/fiche) → ~500 KB de duplication. Ce module remplace tout ça.
 *
 * Inclus dans toutes les fiches via fiche-common.js (defer).
 * Idempotent : peut s'exécuter avant ou après d'autres scripts sans casser.
 *
 * v1.0 — 2026-05-02
 */
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────
  // 1) Barre de progression de défilement
  //    Active si <div id="scroll-progress"> ou <* class="scroll-progress">
  // ─────────────────────────────────────────────────────────────────
  function initScrollProgress() {
    var bar = document.getElementById('scroll-progress') ||
              document.querySelector('.scroll-progress');
    if (!bar) return;

    function update() {
      var d = document.documentElement;
      var pct = Math.min(100, (d.scrollTop / (d.scrollHeight - d.clientHeight)) * 100);
      bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ─────────────────────────────────────────────────────────────────
  // 2) Bouton retour-haut
  //    Active si <* id="back-top"> ou <* class="back-top">
  //    Apparaît après 300px de scroll (classe 'visible')
  // ─────────────────────────────────────────────────────────────────
  function initBackTop() {
    var btn = document.getElementById('back-top') ||
              document.querySelector('.back-top');
    if (!btn) return;

    if (!btn.id) btn.id = 'back-top';

    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });

    // Click → scroll smooth en haut (au cas où ce serait un <button> sans href)
    if (btn.tagName === 'BUTTON' && !btn.onclick) {
      btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 3) Quiz révélation (.quiz-reveal-btn)
  //    Click sur un bouton → toggle .visible sur .quiz-answer dans .quiz-wrap
  //    Met à jour le texte du bouton : "Révéler →" ↔ "Masquer ↑"
  // ─────────────────────────────────────────────────────────────────
  function initQuizReveal() {
    var btns = document.querySelectorAll('.quiz-reveal-btn');
    btns.forEach(function (btn) {
      // Anti double-bind si le script est chargé deux fois
      if (btn.dataset.quizRevealBound) return;
      btn.dataset.quizRevealBound = '1';

      btn.addEventListener('click', function () {
        var wrap = btn.closest('.quiz-wrap');
        if (!wrap) return;
        var ans = wrap.querySelector('.quiz-answer');
        if (!ans) return;
        var isVisible = ans.classList.toggle('visible');
        btn.textContent = isVisible ? 'Masquer ↑' : 'Révéler →';
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 4) Sections collapsibles (.collapsible / .collapsible-header)
  //    Click sur .collapsible-header → toggle .open sur le parent .collapsible
  // ─────────────────────────────────────────────────────────────────
  function initCollapsibles() {
    var headers = document.querySelectorAll('.collapsible-header');
    headers.forEach(function (h) {
      if (h.dataset.collapsibleBound) return;
      h.dataset.collapsibleBound = '1';

      h.addEventListener('click', function () {
        var parent = h.closest('.collapsible');
        if (parent) parent.classList.toggle('open');
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 5) Onglets génériques (data-tab-group / data-tab-btn / data-tab-page)
  //
  //    Convention HTML :
  //      <div data-tab-group="ntfs">
  //        <button data-tab-btn="overview" class="active">Overview</button>
  //        <button data-tab-btn="advanced">Avancé</button>
  //      </div>
  //      <div data-tab-page="overview" class="active">…</div>
  //      <div data-tab-page="advanced">…</div>
  //
  //    Cliquer sur un bouton désactive ses voisins et active la page correspondante.
  //    Plusieurs groupes peuvent coexister sur la même page.
  // ─────────────────────────────────────────────────────────────────
  function initTabs() {
    var btns = document.querySelectorAll('[data-tab-btn]');
    btns.forEach(function (btn) {
      if (btn.dataset.tabBound) return;
      btn.dataset.tabBound = '1';

      btn.addEventListener('click', function () {
        var group = btn.closest('[data-tab-group]');
        var groupId = group ? group.getAttribute('data-tab-group') : null;
        var target = btn.getAttribute('data-tab-btn');

        // Désactiver tous les boutons du même groupe
        var siblings = group ? group.querySelectorAll('[data-tab-btn]')
                             : document.querySelectorAll('[data-tab-btn]');
        siblings.forEach(function (s) { s.classList.remove('active'); });
        btn.classList.add('active');

        // Activer la page correspondante (chercher d'abord dans le scope du groupe)
        var pageScope = group ? group.parentNode : document;
        var pages = pageScope.querySelectorAll('[data-tab-page]');
        pages.forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-tab-page') === target);
        });

        // Smooth scroll vers le top du groupe d'onglets si visible
        if (group && groupId) {
          var rect = group.getBoundingClientRect();
          if (rect.top < 0) {
            window.scrollTo({
              top: window.scrollY + rect.top - 60,
              behavior: 'smooth'
            });
          }
        }
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Initialisation à DOMContentLoaded (ou immédiatement si déjà passé)
  // ─────────────────────────────────────────────────────────────────
  function init() {
    initScrollProgress();
    initBackTop();
    initQuizReveal();
    initCollapsibles();
    initTabs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
