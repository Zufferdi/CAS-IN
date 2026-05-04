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
    const slides = [
      {
        icon: '🔍',
        title: 'Bienvenue dans CAS-IN',
        body: '<p>Une plateforme suisse pour s\'entraîner à l\'investigation numérique forensique : du séquestre légal d\'un disque dur au démantèlement de réseaux ransomware en passant par la coopération internationale.</p><p>Conçue pour les candidat·e·s du CAS Investigation Numérique, mais accessible à tous les curieux du DFIR.</p>',
      },
      {
        icon: '🛤️',
        title: 'Trois chemins, une seule discipline',
        body: '<div class="onb-paths"><div class="onb-path"><span class="onb-path-icon">🎬</span><strong>Scénarios narratifs</strong><br><span class="onb-path-desc">123 cas vécus, choix multiples, conséquences réelles. Format 5-15 min par scène.</span></div><div class="onb-path"><span class="onb-path-icon">💊</span><strong>Quiz</strong><br><span class="onb-path-desc">~1900 questions sur 8 thèmes (FS, OS, crypto, droit, OSINT...). Mode normal, daily, examen blanc.</span></div><div class="onb-path"><span class="onb-path-icon">📚</span><strong>Fiches</strong><br><span class="onb-path-desc">110 fiches techniques avec exercices intégrés, débloquables progressivement.</span></div></div>',
      },
      {
        icon: '🚀',
        title: 'Prêt·e à démarrer ?',
        body: '<p>Tu peux commencer par <strong>n\'importe quelle entrée du menu principal</strong>. Si tu hésites, voici un parcours suggéré pour bien débuter :</p><div class="onb-suggestions"><div class="onb-sug-item"><span>1.</span> Joue ta première scène <strong>Facile</strong> (l\'app gardera trace de ta progression)</div><div class="onb-sug-item"><span>2.</span> Tente quelques questions du Quiz Daily pour calibrer ton niveau</div><div class="onb-sug-item"><span>3.</span> Reviens sur cette page voir ton XP, tes quêtes et tes badges</div></div><p style="margin-top: 1rem;">Bonne enquête ! 🔍</p>',
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
