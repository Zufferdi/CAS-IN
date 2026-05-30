// ═══════════════════════════════════════════════════════════════
// onboarding-ui.js — Overlay d'accueil 3 écrans (v2.60)
//
// Affiche un overlay 3 écrans la première fois qu'un utilisateur
// arrive sur l'app, pour donner les repères de base :
//   1. Bienvenue dans CAS-IN
//   2. Trois chemins : scénarios / quiz / fiches
//   3. Suggestion de premier scénario
//
// Skippable. Une fois complété (ou skippé), n'apparaît plus.
// Stocké via cas_onboarding_done = '1'.
//
// Ne s'affiche QUE sur index.html (le hub principal).
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const STORAGE_KEY = 'cas_onboarding_done';
  let currentSlide = 0;

  function isDone() {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; }
    catch (_) { return true; } // En cas d'erreur, on n'embête pas
  }

  function markDone() {
    try { localStorage.setItem(STORAGE_KEY, '1'); }
    catch (_) {}
  }

  // ─────────────────────────────────────────────────────────────
  // Détection : sommes-nous sur la page index ?
  // ─────────────────────────────────────────────────────────────
  function isLandingPage() {
    const path = window.location.pathname;
    return path.endsWith('/') ||
           path.endsWith('/index.html') ||
           path.endsWith('CAS-IN/') ||
           path.endsWith('CAS-IN/index.html');
  }

  // ─────────────────────────────────────────────────────────────
  // Construction de l'overlay
  // ─────────────────────────────────────────────────────────────
  function buildOverlay() {
    // v132o — Contenu mis à jour pour la structure v3.0-jolification (4 hubs symétriques)
    // Compteurs : 2235 questions / 392 scènes / 120 fiches / 28 tutoriels / 316 trophées
    const slides = [
      {
        icon: '🔍',
        title: 'Bienvenue dans CAS-IN',
        body: '<p>Une plateforme suisse pour s\'entraîner à l\'investigation numérique forensique : du séquestre légal d\'un disque dur au démantèlement de réseaux ransomware en passant par la coopération internationale.</p><p>Conçue pour les candidat·e·s du CAS Investigation Numérique, mais accessible à tous les curieux du DFIR.</p>',
      },
      {
        icon: '🧭',
        title: 'Quatre pôles d\'apprentissage',
        body: '<div class="onb-paths">' +
              '<div class="onb-path"><span class="onb-path-icon">📚</span><strong>Apprendre</strong><br><span class="onb-path-desc">Fiches techniques (120), tutoriels d\'outils DFIR (28), références. Pour acquérir la théorie.</span></div>' +
              '<div class="onb-path"><span class="onb-path-icon">🧪</span><strong>Pratiquer</strong><br><span class="onb-path-desc">43 catégories de TP interactifs et calculateurs forensiques. Pour ancrer le geste.</span></div>' +
              '<div class="onb-path"><span class="onb-path-icon">🔍</span><strong>Enquêter</strong><br><span class="onb-path-desc">392 scènes immersives, sagas narratives, études de cas. Pour le réflexe d\'enquêteur.</span></div>' +
              '<div class="onb-path"><span class="onb-path-icon">💊</span><strong>Se tester</strong><br><span class="onb-path-desc">2235 questions, examen blanc, mastery par fiche, 316 trophées. Pour calibrer ta progression.</span></div>' +
              '</div>' +
              '<p style="margin-top:1rem;font-size:.85rem;color:var(--muted)">Les 4 pilules colorées de l\'accueil mènent à un hub dédié pour chaque pôle, avec ta progression et des recommandations personnalisées.</p>',
      },
      {
        icon: '🚀',
        title: 'Prêt·e à démarrer ?',
        body: '<p>Tu peux commencer par <strong>n\'importe quel pôle</strong>. Tout est sauvegardé localement (RGPD : rien ne quitte ton appareil) et l\'app fonctionne hors-ligne.</p>' +
              '<div class="onb-suggestions">' +
              '<div class="onb-sug-item"><span>1.</span> <strong>Curieux·se ?</strong> Commence par <em>Apprendre → Tutoriels</em> pour découvrir les outils DFIR pas à pas</div>' +
              '<div class="onb-sug-item"><span>2.</span> <strong>Pressé·e ?</strong> Lance directement une <em>scène Facile</em> dans Enquêter — 10 minutes suffisent</div>' +
              '<div class="onb-sug-item"><span>3.</span> <strong>Évaluation ?</strong> Va sur <em>Se tester → Quiz</em> en mode libre pour identifier tes points faibles</div>' +
              '</div>' +
              '<p style="margin-top:1rem;font-size:.82rem;color:var(--muted)">💡 Astuce : sur clavier, les touches <kbd>B</kbd> <kbd>V</kbd> <kbd>O</kbd> <kbd>R</kbd> activent directement les 4 pilules.</p>' +
              '<p style="margin-top:.5rem">Bonne enquête ! 🔍</p>',
      },
    ];

    const overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'onboarding-title');

    overlay.innerHTML = `
      <div class="onboarding-backdrop"></div>
      <div class="onboarding-card">
        <button class="onboarding-skip" aria-label="Passer le tutoriel">Passer ✕</button>
        <div class="onboarding-slides">
          ${slides.map((s, i) => `
            <div class="onboarding-slide ${i === 0 ? 'is-active' : ''}" data-slide="${i}">
              <div class="onboarding-icon">${s.icon}</div>
              <h2 class="onboarding-title" id="${i === 0 ? 'onboarding-title' : ''}">${s.title}</h2>
              <div class="onboarding-body">${s.body}</div>
            </div>
          `).join('')}
        </div>
        <div class="onboarding-nav">
          <div class="onboarding-dots">
            ${slides.map((_, i) => `<span class="onboarding-dot ${i === 0 ? 'is-active' : ''}" data-dot="${i}"></span>`).join('')}
          </div>
          <div class="onboarding-buttons">
            <button class="onboarding-prev" disabled>← Précédent</button>
            <button class="onboarding-next">Suivant →</button>
            <button class="onboarding-finish" style="display:none">Commencer 🚀</button>
          </div>
        </div>
      </div>
    `;

    return { overlay, slides };
  }

  // ─────────────────────────────────────────────────────────────
  // Wiring (navigation entre slides)
  // ─────────────────────────────────────────────────────────────
  function wireUp(overlay, totalSlides) {
    function show(index) {
      currentSlide = Math.max(0, Math.min(totalSlides - 1, index));
      overlay.querySelectorAll('.onboarding-slide').forEach(el => {
        el.classList.toggle('is-active', parseInt(el.dataset.slide) === currentSlide);
      });
      overlay.querySelectorAll('.onboarding-dot').forEach(el => {
        el.classList.toggle('is-active', parseInt(el.dataset.dot) === currentSlide);
      });
      const prev = overlay.querySelector('.onboarding-prev');
      const next = overlay.querySelector('.onboarding-next');
      const finish = overlay.querySelector('.onboarding-finish');
      prev.disabled = currentSlide === 0;
      const isLast = currentSlide === totalSlides - 1;
      next.style.display = isLast ? 'none' : '';
      finish.style.display = isLast ? '' : 'none';
    }

    function close() {
      markDone();
      overlay.classList.add('is-leaving');
      setTimeout(() => overlay.remove(), 350);
    }

    overlay.querySelector('.onboarding-prev').addEventListener('click', () => show(currentSlide - 1));
    overlay.querySelector('.onboarding-next').addEventListener('click', () => show(currentSlide + 1));
    overlay.querySelector('.onboarding-finish').addEventListener('click', close);
    overlay.querySelector('.onboarding-skip').addEventListener('click', close);

    // Cliquer le backdrop ferme aussi
    overlay.querySelector('.onboarding-backdrop').addEventListener('click', close);

    // Cliquer un dot va à ce slide
    overlay.querySelectorAll('.onboarding-dot').forEach(dot => {
      dot.addEventListener('click', () => show(parseInt(dot.dataset.dot)));
    });

    // Esc = close
    function onKey(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', onKey);
      } else if (e.key === 'ArrowRight') {
        show(currentSlide + 1);
      } else if (e.key === 'ArrowLeft') {
        show(currentSlide - 1);
      }
    }
    document.addEventListener('keydown', onKey);
  }

  // ─────────────────────────────────────────────────────────────
  // Lancement
  // ─────────────────────────────────────────────────────────────
  function maybeShow() {
    if (isDone()) return;
    if (!isLandingPage()) return;
    const { overlay, slides } = buildOverlay();
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-active'));
    wireUp(overlay, slides.length);
  }

  // API publique pour debug / re-show manuel
  window.Onboarding = {
    show: function () {
      // Force show même si done (pour debug)
      const { overlay, slides } = buildOverlay();
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('is-active'));
      wireUp(overlay, slides.length);
    },
    reset: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    },
    isDone,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeShow);
  } else {
    maybeShow();
  }
})();
