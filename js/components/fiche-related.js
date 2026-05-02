/* CAS-IN — Composant "Voir aussi" pour les fiches
 * ───────────────────────────────────────────────
 * Injecte en bas de chaque fiche une section avec liens vers :
 *   - Quiz : questions liées au sujet
 *   - TP : exercices pratiques connexes
 *   - Scènes : scénarios DFIR pertinents
 *
 * Charge data/cross-links.json (35 KB, mis en cache via SW).
 *
 * À inclure sur chaque fiche/*.html :
 *   <script src="../js/components/fiche-related.js" defer></script>
 *
 * v1.0 — 2026-05-02
 */
(function () {
  'use strict';

  // Détecter le nom de la fiche depuis l'URL
  const path = window.location.pathname;
  const m = path.match(/\/fiches\/([^/]+\.html)$/);
  if (!m) return;   // pas une fiche
  const ficheFile = m[1];
  if (ficheFile === 'index.html') return;   // page d'accueil des fiches

  // ─── Chargement du mapping ───
  fetch('../data/cross-links.json')
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(data => {
      const fiche = data.fiches && data.fiches[ficheFile];
      if (!fiche) return;
      const hasContent = (fiche.questions && fiche.questions.length) ||
                         (fiche.tps && fiche.tps.length) ||
                         (fiche.scenes && fiche.scenes.length);
      if (!hasContent) return;
      injectRelated(fiche, data);
    })
    .catch(err => {
      console.warn('[fiche-related] Mapping non chargé :', err.message);
    });

  // ─── Injection ───
  function injectRelated(fiche, data) {
    // Trouver l'endroit où injecter : après la dernière section du contenu,
    // avant le footer ou les nav buttons s'ils existent.
    let anchor = document.querySelector('.fiche-cta-row, .fiche-footer, footer');
    if (!anchor) {
      // Fallback : juste avant </body>
      anchor = document.body.lastElementChild;
    }
    if (!anchor) return;

    const section = document.createElement('section');
    section.className = 'fiche-related';
    section.style.cssText = `
      margin: 3rem auto 1.5rem;
      max-width: 900px;
      padding: 1.4rem 1.6rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
    `;

    const html = [];
    html.push(`
      <h2 class="related-h2" style="
        margin: 0 0 1rem;
        font-size: 1rem;
        font-family: var(--mono);
        color: var(--cyan);
        font-weight: 700;
        letter-spacing: .05em;
        text-transform: uppercase;
      ">📚 Voir aussi</h2>
    `);

    const cols = [];

    // ─── Quiz ───
    if (fiche.questions && fiche.questions.length) {
      const n = fiche.questions.length;
      // On va construire un lien vers le quiz qui filtre sur les indices
      // Stocker en localStorage le filtre, puis quiz.html le lit au démarrage
      const sample = fiche.questions.slice(0, n);
      cols.push(`
        <a class="related-card" data-related-quiz='${JSON.stringify(sample)}'
           style="
             flex: 1; min-width: 200px;
             display: block; padding: .9rem 1.1rem;
             background: rgba(0, 229, 204, .04);
             border: 1px solid rgba(0, 229, 204, .15);
             border-radius: 8px;
             text-decoration: none; color: var(--text);
             transition: all .15s;
             cursor: pointer;
           ">
          <div style="font-size: 1.4rem; margin-bottom: .35rem">🎯</div>
          <div style="font-family: var(--sans); font-weight: 700; margin-bottom: .25rem; font-size: .92rem">
            Tester vos connaissances
          </div>
          <div style="font-size: .78rem; color: var(--dim); font-family: var(--mono)">
            ${n} question${n > 1 ? 's' : ''} sur ce sujet
          </div>
        </a>
      `);
    }

    // ─── TPs ───
    if (fiche.tps && fiche.tps.length) {
      for (const tpId of fiche.tps.slice(0, 3)) {
        const tp = data.tps && data.tps[tpId];
        if (!tp) continue;
        cols.push(`
          <a class="related-card"
             href="../tp.html#${tpId}"
             onclick="try { localStorage.setItem('cas-in-tp-cat', '${tpId}'); } catch(e) {}"
             style="
               flex: 1; min-width: 200px;
               display: block; padding: .9rem 1.1rem;
               background: rgba(255, 162, 64, .04);
               border: 1px solid rgba(255, 162, 64, .15);
               border-radius: 8px;
               text-decoration: none; color: var(--text);
               transition: all .15s;
             ">
            <div style="font-size: 1.4rem; margin-bottom: .35rem">${escapeHTML(tp.icon)}</div>
            <div style="font-family: var(--sans); font-weight: 700; margin-bottom: .25rem; font-size: .92rem">
              TP ${escapeHTML(tp.label)}
            </div>
            <div style="font-size: .78rem; color: var(--orange, #f0a040); font-family: var(--mono)">
              Exercice pratique →
            </div>
          </a>
        `);
      }
    }

    // ─── Scènes ───
    if (fiche.scenes && fiche.scenes.length) {
      for (const sceneId of fiche.scenes.slice(0, 3)) {
        const sc = data.scenes && data.scenes[sceneId];
        if (!sc) continue;
        cols.push(`
          <a class="related-card"
             href="../scene.html?id=${encodeURIComponent(sceneId)}"
             style="
               flex: 1; min-width: 200px;
               display: block; padding: .9rem 1.1rem;
               background: rgba(188, 140, 255, .04);
               border: 1px solid rgba(188, 140, 255, .15);
               border-radius: 8px;
               text-decoration: none; color: var(--text);
               transition: all .15s;
             ">
            <div style="font-size: 1.4rem; margin-bottom: .35rem">${escapeHTML(sc.icon)}</div>
            <div style="font-family: var(--sans); font-weight: 700; margin-bottom: .25rem; font-size: .92rem">
              ${escapeHTML(sc.title)}
            </div>
            <div style="font-size: .78rem; color: var(--purple, #bc8cff); font-family: var(--mono)">
              Scénario DFIR →
            </div>
          </a>
        `);
      }
    }

    if (cols.length === 0) return;

    html.push(`
      <div style="display: flex; gap: .8rem; flex-wrap: wrap">
        ${cols.join('\n')}
      </div>
    `);

    section.innerHTML = html.join('\n');
    anchor.parentNode.insertBefore(section, anchor);

    // Hover effect global via stylesheet
    if (!document.getElementById('fiche-related-style')) {
      const s = document.createElement('style');
      s.id = 'fiche-related-style';
      s.textContent = `
        .related-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, .15);
        }
        [data-theme="light"] .fiche-related {
          background: var(--surface);
          border-color: var(--border);
        }
        @media (max-width: 600px) {
          .fiche-related {
            padding: 1rem !important;
            margin: 2rem auto 1rem !important;
          }
          .related-card { min-width: 100% !important }
        }
      `;
      document.head.appendChild(s);
    }

    // Bind quiz card avec mémorisation des indices
    const quizCard = section.querySelector('[data-related-quiz]');
    if (quizCard) {
      quizCard.addEventListener('click', e => {
        e.preventDefault();
        try {
          const indices = JSON.parse(quizCard.getAttribute('data-related-quiz'));
          // Stocker en localStorage : quiz-app.js peut lire ce filtre
          localStorage.setItem('cas-in-quiz-filter', JSON.stringify({
            type: 'fiche',
            fiche: ficheFile,
            indices: indices,
            createdAt: Date.now(),
          }));
        } catch (err) {}
        // Rediriger vers quiz.html
        window.location.href = '../quiz.html?from=fiche&fiche=' + encodeURIComponent(ficheFile);
      });
    }
  }

  function escapeHTML(s) {
    return (s || '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }
})();
