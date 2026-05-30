// ═══════════════════════════════════════════════════════════════════
// quiz-fiche-gating.js — CAS-IN delta v135
//
// Verrouille les questions de quiz qui touchent à des fiches non lues.
// Mode "étude" activable depuis le panneau Filtres & Options.
//
// Règle pédagogique : une question est débloquée si AU MOINS UNE de
// ses fiches associées (champ q.fiches) a été lue (clé localStorage
// "fiche-reader.read" alimentée par fiche-reader.js après 90s sur une fiche).
//
// Si toggle OFF (défaut) : aucun effet, comportement quiz inchangé.
// Si toggle ON          : les questions verrouillées affichent une carte
//                         alternative avec bouton "📄 Lire la fiche" et
//                         "⏭ Passer cette question".
//
// Affichage : compteur "X/Y débloquées" sur chaque chip de thème.
//
// Dépendances : fiche-reader.js (pour la clé localStorage)
//               quiz-app.js (hook sur renderQuestion)
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  if (window.QuizGating) return;  // déjà chargé

  const STORAGE_KEY_READ = 'fiche-reader.read';
  const STORAGE_KEY_TOGGLE = 'quiz_gating_enabled';

  // ─── Lecture des fiches lues ────────────────────────────────────
  function getReadFiches() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_READ);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (_) {
      return new Set();
    }
  }

  // ─── Toggle persisté ────────────────────────────────────────────
  function isEnabled() {
    try {
      return localStorage.getItem(STORAGE_KEY_TOGGLE) === '1';
    } catch (_) {
      return false;
    }
  }
  function setEnabled(on) {
    try {
      localStorage.setItem(STORAGE_KEY_TOGGLE, on ? '1' : '0');
    } catch (_) {}
  }

  // ─── Vérification d'une question ────────────────────────────────
  function isQuestionUnlocked(q) {
    if (!isEnabled()) return true;
    if (!q || !Array.isArray(q.fiches) || q.fiches.length === 0) return true;
    const read = getReadFiches();
    // Une question est débloquée si AU MOINS UNE fiche est lue
    return q.fiches.some(f => read.has(f + '.html') || read.has(f));
  }

  // ─── Détails du verrou (pour l'affichage) ───────────────────────
  function getLockInfo(q) {
    if (!q || !Array.isArray(q.fiches)) return { fiches: [], read: [], unread: [] };
    const read = getReadFiches();
    const ficheList = q.fiches;
    const wasRead = (f) => read.has(f + '.html') || read.has(f);
    return {
      fiches: ficheList,
      read: ficheList.filter(wasRead),
      unread: ficheList.filter(f => !wasRead(f))
    };
  }

  // ─── Statistiques par thème ─────────────────────────────────────
  // allQuestions : tableau de toutes les questions (ALL_Q côté quiz-app)
  function getThemeProgress(theme, allQuestions) {
    if (!Array.isArray(allQuestions)) return null;
    const qsOfTheme = allQuestions.filter(q => q.theme === theme);
    if (qsOfTheme.length === 0) return null;
    const read = getReadFiches();
    const unlockedQ = qsOfTheme.filter(q => {
      if (!Array.isArray(q.fiches) || q.fiches.length === 0) return true;
      return q.fiches.some(f => read.has(f + '.html') || read.has(f));
    }).length;
    // Fiches du thème (union de toutes les fiches référencées)
    const ficheSet = new Set();
    qsOfTheme.forEach(q => (q.fiches || []).forEach(f => ficheSet.add(f)));
    const fichesRead = [...ficheSet].filter(f => read.has(f + '.html') || read.has(f)).length;
    return {
      theme,
      totalQ: qsOfTheme.length,
      unlockedQ,
      lockedQ: qsOfTheme.length - unlockedQ,
      fichesTotal: ficheSet.size,
      fichesRead
    };
  }

  // ─── Rendu de la carte "verrouillée" ────────────────────────────
  // Remplace #question-card par un message + boutons "Lire" + "Passer"
  function renderLockedCard(q) {
    const card = document.getElementById('question-card');
    if (!card) return false;
    const info = getLockInfo(q);
    const firstFiche = info.unread[0] || (info.fiches[0] || '');

    // Récupérer le titre lisible depuis window.FICHES_TITLES (chargé par quiz-app.js)
    function titleOf(slug) {
      if (window.FICHES_TITLES && window.FICHES_TITLES[slug]) return window.FICHES_TITLES[slug];
      // Fallback : reformater le slug en titre
      return slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    const readableTitle = titleOf(firstFiche);
    const ficheUrl = '../fiches/' + firstFiche + '.html';

    // Couleur de fond cohérente avec le thème de la question
    const themeColor = (window.TC && window.TC[q.theme]) || 'var(--cyan)';

    card.className = 'card locked-question';
    card.innerHTML = `
      <div class="locked-q-inner" style="padding: 1.5rem 1.2rem; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: .5rem;" aria-hidden="true">🔒</div>
        <div style="font-family: var(--mono); font-size: .75rem; color: var(--dim); text-transform: uppercase; letter-spacing: .08em; margin-bottom: .4rem;">
          Question verrouillée
        </div>
        <h3 style="margin: 0 0 .8rem 0; font-size: 1.05rem; color: ${themeColor};">
          ▸ ${q.theme}${q.chapter ? ' · ' + q.chapter : ''}
        </h3>
        <p style="color: var(--text); font-size: .95rem; line-height: 1.5; margin: 0 0 1rem 0;">
          Pour répondre à cette question, lis d'abord la fiche&nbsp;:<br>
          <strong style="color: ${themeColor};">📄 ${readableTitle}</strong>
        </p>
        ${info.fiches.length > 1 ? `
          <p style="font-size: .8rem; color: var(--dim); margin: 0 0 1.2rem 0;">
            (Cette question couvre ${info.fiches.length} fiches&nbsp;: lire ${info.read.length > 0 ? 'une autre' : 'au moins une'} suffit à la débloquer.)
          </p>
        ` : ''}
        <div style="display: flex; gap: .6rem; justify-content: center; flex-wrap: wrap; margin-top: .8rem;">
          <a href="${ficheUrl}" target="_blank" rel="noopener" class="locked-q-btn locked-q-btn-primary"
             style="display: inline-flex; align-items: center; gap: .4rem; padding: .55rem 1.1rem; background: ${themeColor}; color: var(--bg); border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: .9rem; text-decoration: none;">
            📄 Lire la fiche
          </a>
          <button type="button" class="locked-q-btn" id="locked-q-skip"
                  style="display: inline-flex; align-items: center; gap: .4rem; padding: .55rem 1.1rem; background: var(--surface2); color: var(--text); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; font-weight: 600; font-size: .9rem;">
            ⏭ Passer cette question
          </button>
          <button type="button" class="locked-q-btn" id="locked-q-disable"
                  style="display: inline-flex; align-items: center; gap: .4rem; padding: .55rem 1.1rem; background: transparent; color: var(--dim); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; font-size: .85rem;">
            ⚙ Désactiver le mode étude
          </button>
        </div>
      </div>
    `;

    // Cacher les contrôles classiques (boutons valider/skip/hint en bas du quiz)
    const opts = document.getElementById('options');
    if (opts) opts.style.display = 'none';
    const va = document.getElementById('validate-btn');
    if (va) va.style.display = 'none';
    const nb = document.getElementById('next-btn');
    if (nb) nb.style.display = 'none';
    const sk = document.getElementById('skip-btn');
    if (sk) sk.style.display = 'none';
    const hb = document.getElementById('hint-btn');
    if (hb) hb.style.display = 'none';
    const multih = document.getElementById('multi-hint');
    if (multih) multih.style.display = 'none';

    // Bindings
    const skipBtn = document.getElementById('locked-q-skip');
    if (skipBtn) skipBtn.onclick = () => {
      if (typeof window.nextQuestion === 'function') {
        restoreNormalControls();
        window.nextQuestion();
      }
    };
    const disableBtn = document.getElementById('locked-q-disable');
    if (disableBtn) disableBtn.onclick = () => {
      setEnabled(false);
      restoreNormalControls();
      if (typeof window.nextQuestion === 'function') window.nextQuestion();
    };

    return true;
  }

  function restoreNormalControls() {
    // Restaure l'affichage par défaut (sera repeuplé par le prochain renderQuestion)
    const opts = document.getElementById('options');
    if (opts) opts.style.display = '';
    const va = document.getElementById('validate-btn');
    if (va) va.style.display = '';
    const sk = document.getElementById('skip-btn');
    if (sk) sk.style.display = '';
    const hb = document.getElementById('hint-btn');
    if (hb) hb.style.display = '';
  }

  // ─── Hook sur renderQuestion ────────────────────────────────────
  // S'exécute après chargement de quiz-app.js
  let _hookInstalled = false;
  function installHook() {
    if (_hookInstalled) return;
    if (typeof window.renderQuestion !== 'function') return;
    const origRender = window.renderQuestion;
    window.renderQuestion = function (item) {
      // item peut être {q, idx} ou directement q
      const q = item && item.q ? item.q : item;
      if (q && !isQuestionUnlocked(q)) {
        renderLockedCard(q);
        return;
      }
      // Sinon on restaure les contrôles (au cas où la précédente était verrouillée)
      restoreNormalControls();
      return origRender.apply(this, arguments);
    };
    _hookInstalled = true;
    console.log('[quiz-gating] hook installé sur renderQuestion');
  }

  // ─── Mise à jour des chips de thème (compteur "X/Y débloquées") ──
  function updateThemeChipsProgress() {
    if (!isEnabled()) {
      // Retirer les compteurs s'ils étaient affichés
      document.querySelectorAll('#theme-chips .gating-counter').forEach(el => el.remove());
      return;
    }
    if (!window.ALL_Q || !Array.isArray(window.ALL_Q)) return;
    document.querySelectorAll('#theme-chips .chip').forEach(chip => {
      const theme = chip.dataset.theme || chip.textContent.trim();
      const prog = getThemeProgress(theme, window.ALL_Q);
      if (!prog) return;
      // Retirer ancien compteur
      const oldCounter = chip.querySelector('.gating-counter');
      if (oldCounter) oldCounter.remove();
      // Ajouter nouveau compteur
      const counter = document.createElement('span');
      counter.className = 'gating-counter';
      counter.style.cssText = 'font-size:.7rem;margin-left:.4rem;padding:.1rem .35rem;border-radius:6px;background:rgba(0,229,204,.15);color:var(--cyan);font-family:var(--mono);';
      const pct = prog.totalQ > 0 ? Math.round(100 * prog.unlockedQ / prog.totalQ) : 0;
      counter.textContent = `${prog.unlockedQ}/${prog.totalQ}`;
      counter.title = `${prog.unlockedQ}/${prog.totalQ} questions débloquées (${prog.fichesRead}/${prog.fichesTotal} fiches lues)`;
      chip.appendChild(counter);
    });
  }

  // ─── API publique ───────────────────────────────────────────────
  window.QuizGating = {
    get enabled() { return isEnabled(); },
    set enabled(v) {
      setEnabled(v);
      updateThemeChipsProgress();
      // Si on désactive en plein milieu, rebascule sur question normale
      if (!v && typeof window.renderQuestion === 'function' && window.S && window.S.curQ) {
        restoreNormalControls();
      }
    },
    isQuestionUnlocked,
    getLockInfo,
    getThemeProgress,
    updateThemeChipsProgress,
    toggle() {
      const newVal = !isEnabled();
      this.enabled = newVal;
      return newVal;
    },
    // Forcer un re-rendu de la question courante (utilisé après toggle)
    refresh() {
      if (typeof window.renderQuestion === 'function' && window.S && window.S.curQ) {
        window.renderQuestion({ q: window.S.curQ, idx: window.S.curIdx });
      }
    }
  };

  // ─── Initialisation différée ────────────────────────────────────
  // Le hook nécessite que renderQuestion soit définie. On essaie au load,
  // puis on retry quelques fois en cas de retard de chargement.
  function init() {
    let attempts = 0;
    const tryHook = () => {
      installHook();
      if (!_hookInstalled && attempts < 20) {
        attempts++;
        setTimeout(tryHook, 250);
      }
      // Update affichage progression
      updateThemeChipsProgress();
    };
    tryHook();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Observer : mettre à jour le compteur quand les chips sont créées ─
  // (l'app peut les regénérer à plusieurs reprises)
  document.addEventListener('DOMContentLoaded', () => {
    const target = document.getElementById('theme-chips');
    if (target && window.MutationObserver) {
      const observer = new MutationObserver(() => {
        // Throttle léger
        if (window._gatingUpdateTimer) clearTimeout(window._gatingUpdateTimer);
        window._gatingUpdateTimer = setTimeout(updateThemeChipsProgress, 100);
      });
      observer.observe(target, { childList: true });
    }
  });

})();
