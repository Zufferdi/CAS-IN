/**
 * tutoriels-app.js — Gestion pédagogique des tutoriels DFIR (v124)
 *
 * Responsabilités :
 *   • Marquage de sections (✓ Étape réussie) avec persistance localStorage
 *   • Barre de progression dynamique + sommaire mis à jour
 *   • Copie de commandes en un clic
 *   • Quiz de fin (vérification immédiate + score + déblocage trophée)
 *   • Intégration avec le profil CAS-IN (compétences + trophées + scenesCompleted)
 *
 * Clé localStorage :
 *   casIn_tutoriels = { autopsy: { sections: ['s1','s2'], quizScore: 80, completed: true }, ... }
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────
  // 1. Persistance
  // ─────────────────────────────────────────────────────────
  const STORAGE_KEY = 'casIn_tutoriels';

  function loadAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveAll(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[tutoriels] localStorage indisponible');
    }
  }

  function getTutorialState(tutoId) {
    const all = loadAll();
    return all[tutoId] || { sections: [], quizScore: null, completed: false };
  }

  function setTutorialState(tutoId, state) {
    const all = loadAll();
    all[tutoId] = state;
    saveAll(all);
  }

  // ─────────────────────────────────────────────────────────
  // 2. Page tutoriel — boot
  // ─────────────────────────────────────────────────────────
  function initTutorialPage() {
    const root = document.querySelector('[data-tutoriel-id]');
    if (!root) return;

    const tutoId = root.dataset.tutorielId;
    const state = getTutorialState(tutoId);

    // Sections
    const sections = root.querySelectorAll('.tuto-section');
    sections.forEach((sec) => {
      const secId = sec.dataset.sectionId;
      if (state.sections.includes(secId)) {
        sec.classList.add('done');
        const btn = sec.querySelector('.tuto-mark-done');
        if (btn) {
          btn.classList.add('done');
          btn.textContent = 'Étape réussie';
        }
        const link = document.querySelector(`.tuto-sidebar a[href="#${secId}"]`);
        if (link) link.classList.add('done');
      }
    });

    // Boutons « Étape réussie »
    root.querySelectorAll('.tuto-mark-done').forEach((btn) => {
      btn.addEventListener('click', function () {
        const sec = btn.closest('.tuto-section');
        const secId = sec.dataset.sectionId;
        const st = getTutorialState(tutoId);
        if (st.sections.includes(secId)) {
          // Démarquer
          st.sections = st.sections.filter((s) => s !== secId);
          sec.classList.remove('done');
          btn.classList.remove('done');
          btn.textContent = 'Marquer comme réussie';
          document.querySelector(`.tuto-sidebar a[href="#${secId}"]`)?.classList.remove('done');
        } else {
          // Marquer
          st.sections.push(secId);
          sec.classList.add('done');
          btn.classList.add('done');
          btn.textContent = 'Étape réussie';
          document.querySelector(`.tuto-sidebar a[href="#${secId}"]`)?.classList.add('done');
        }
        setTutorialState(tutoId, st);
        updateProgressBar(root, tutoId);
      });
    });

    // Boutons copier
    root.querySelectorAll('.tuto-cmd-copy').forEach((btn) => {
      btn.addEventListener('click', function () {
        const pre = btn.closest('.tuto-cmd').querySelector('pre');
        const text = pre.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            btn.textContent = '✓ Copié';
            btn.classList.add('copied');
            setTimeout(() => {
              btn.textContent = '📋 Copier';
              btn.classList.remove('copied');
            }, 1500);
          });
        } else {
          // Fallback
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); btn.textContent = '✓ Copié'; }
          catch (e) { btn.textContent = '⚠ Erreur'; }
          document.body.removeChild(ta);
          setTimeout(() => { btn.textContent = '📋 Copier'; }, 1500);
        }
      });
    });

    // Reset button
    const resetBtn = document.querySelector('.tuto-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (confirm('Réinitialiser la progression de ce tutoriel ?')) {
          setTutorialState(tutoId, { sections: [], quizScore: null, completed: false });
          location.reload();
        }
      });
    }

    // Sommaire : section active au scroll
    initScrollSpy(root);

    // Init quiz si présent
    initQuiz(root, tutoId);

    // Première mise à jour
    updateProgressBar(root, tutoId);
  }

  function updateProgressBar(root, tutoId) {
    const state = getTutorialState(tutoId);
    const sections = root.querySelectorAll('.tuto-section');
    const totalSections = sections.length;
    const doneSections = state.sections.length;
    const hasQuiz = !!root.querySelector('.tuto-quiz');
    const total = totalSections + (hasQuiz ? 1 : 0);
    const done = doneSections + (state.quizScore !== null && state.quizScore >= 60 ? 1 : 0);
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const fill = document.querySelector('.tuto-progress-fill');
    const text = document.querySelector('.tuto-progress-text');
    if (fill) fill.style.width = pct + '%';
    if (text) {
      text.innerHTML = `<strong>${done}</strong> / ${total} · ${pct}%`;
    }

    // Marqueur "completed" si tout est fait
    if (pct === 100 && !state.completed) {
      state.completed = true;
      setTutorialState(tutoId, state);
      onTutorialCompleted(tutoId);
    }
  }

  function initScrollSpy(root) {
    const sections = Array.from(root.querySelectorAll('.tuto-section'));
    const links = document.querySelectorAll('.tuto-sidebar a');
    if (!sections.length || !links.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.dataset.sectionId;
          links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
        }
      });
    }, { rootMargin: '-100px 0px -60% 0px' });

    sections.forEach((s) => obs.observe(s));
  }

  // ─────────────────────────────────────────────────────────
  // 3. Quiz
  // ─────────────────────────────────────────────────────────
  function initQuiz(root, tutoId) {
    const quiz = root.querySelector('.tuto-quiz');
    if (!quiz) return;

    const questions = quiz.querySelectorAll('.tuto-quiz-question');
    let answered = 0;
    let correct = 0;

    questions.forEach((q) => {
      const options = q.querySelectorAll('.tuto-quiz-option');
      const correctIdx = parseInt(q.dataset.correct, 10);
      const feedback = q.querySelector('.tuto-quiz-feedback');

      options.forEach((opt, idx) => {
        opt.addEventListener('click', function () {
          // Verrouiller toutes les options de cette question
          options.forEach((o) => { o.disabled = true; });
          answered++;
          const isCorrect = idx === correctIdx;
          opt.classList.add(isCorrect ? 'correct' : 'wrong');
          if (!isCorrect) {
            options[correctIdx].classList.add('correct');
          }
          if (isCorrect) correct++;
          if (feedback) {
            feedback.classList.add('show', isCorrect ? 'success' : 'fail');
            feedback.textContent = isCorrect
              ? (q.dataset.feedbackOk || '✓ Correct.')
              : (q.dataset.feedbackKo || '✗ Bonne réponse : ' + (options[correctIdx].textContent.trim()));
          }
          // Fin du quiz ?
          if (answered === questions.length) {
            finishQuiz(quiz, tutoId, correct, questions.length, root);
          }
        });
      });
    });

    // Bouton restart
    const restart = quiz.querySelector('.tuto-quiz-restart');
    if (restart) {
      restart.addEventListener('click', function () {
        questions.forEach((q) => {
          q.querySelectorAll('.tuto-quiz-option').forEach((o) => {
            o.disabled = false;
            o.classList.remove('correct', 'wrong');
          });
          const fb = q.querySelector('.tuto-quiz-feedback');
          if (fb) { fb.classList.remove('show', 'success', 'fail'); fb.textContent = ''; }
        });
        const result = quiz.querySelector('.tuto-quiz-result');
        if (result) result.classList.remove('show', 'win', 'lose');
        answered = 0;
        correct = 0;
      });
    }
  }

  function finishQuiz(quiz, tutoId, correct, total, root) {
    const score = Math.round((correct / total) * 100);
    const result = quiz.querySelector('.tuto-quiz-result');
    if (result) {
      const win = score >= 80;
      result.classList.add('show', win ? 'win' : 'lose');
      const scoreEl = result.querySelector('.tuto-quiz-result-score');
      const msgEl = result.querySelector('.tuto-quiz-result-msg');
      if (scoreEl) scoreEl.textContent = correct + ' / ' + total + ' (' + score + '%)';
      if (msgEl) {
        msgEl.textContent = win
          ? '🏆 Quiz validé. Trophée débloqué pour ce tutoriel.'
          : 'Pas encore (≥ 80% requis). Relis les sections et retente.';
      }
    }
    // Persister
    const state = getTutorialState(tutoId);
    state.quizScore = score;
    setTutorialState(tutoId, state);
    updateProgressBar(root, tutoId);
  }

  // ─────────────────────────────────────────────────────────
  // 4. Hook trophée / compétences
  // ─────────────────────────────────────────────────────────
  function onTutorialCompleted(tutoId) {
    // Intégration avec le système de trophées CAS-IN (cas-in-achievements.js)
    // Ici on déclenche un événement personnalisé que le moteur principal écoutera.
    try {
      window.dispatchEvent(new CustomEvent('casin:tutoriel-completed', {
        detail: { tutoId, timestamp: Date.now() }
      }));
    } catch (e) {}

    // Petit feedback visuel (toast simple si gamification-toasts.js chargé)
    if (window.GamificationToasts && typeof window.GamificationToasts.show === 'function') {
      window.GamificationToasts.show({
        icon: '🏆',
        title: 'Tutoriel terminé !',
        message: 'Tu as complété ' + tutoId.toUpperCase() + '.',
        type: 'success'
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  // 5. Page index — Affichage de la progression de chaque carte
  // ─────────────────────────────────────────────────────────
  function initIndexPage() {
    const cards = document.querySelectorAll('.tuto-card[data-tutoriel-id]');
    if (!cards.length) return;

    cards.forEach((card) => {
      const tutoId = card.dataset.tutorielId;
      const state = getTutorialState(tutoId);
      const totalSections = parseInt(card.dataset.totalSections, 10) || 1;
      const hasQuiz = card.dataset.hasQuiz === 'true';
      const total = totalSections + (hasQuiz ? 1 : 0);
      const done = state.sections.length + (state.quizScore !== null && state.quizScore >= 60 ? 1 : 0);
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      const fill = card.querySelector('.tuto-card-progress-fill');
      if (fill) fill.style.width = pct + '%';

      if (state.completed) card.classList.add('completed');
    });
  }

  // ─────────────────────────────────────────────────────────
  // 6. Boot
  // ─────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initTutorialPage();
      initIndexPage();
    });
  } else {
    initTutorialPage();
    initIndexPage();
  }

  // Exposer une API minimale
  window.CasInTutoriels = {
    getState: getTutorialState,
    reset: function (tutoId) {
      setTutorialState(tutoId, { sections: [], quizScore: null, completed: false });
    },
    getAllProgress: loadAll,
  };
})();
