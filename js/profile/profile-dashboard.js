/* ═══════════════════════════════════════════════════════════════
 * profile-dashboard.js — v2.98 (piste D)
 *
 * "Tableau de bord" — section qui s'insère AU-DESSUS du Hero existant
 * pour donner une vue d'ensemble immédiate de l'avancement transverse.
 *
 * Composé de 4 zones (grille adaptative) :
 *
 *   1. PROFIL EN UN COUP D'ŒIL
 *      Rang + XP + Streak + niveau d'enquêteur (déduit de scenesCount)
 *
 *   2. SPÉCIALITÉ ÉMERGENTE
 *      Branche compétence dominante (la plus jouée) + 2 prochaines
 *
 *   3. PROCHAINE ÉTAPE SUGGÉRÉE
 *      Choisit intelligemment 1-3 actions concrètes parmi :
 *        - acte suivant de la saga en cours la plus avancée
 *        - prochaine scène de l'arc PNJ le plus avancé
 *        - 1 fondamental encore non fait (si <7 fondamentaux validés)
 *        - 1 scène hard pour débloquer expert (si <5 hard validées)
 *
 *   4. SNAPSHOT GLOBAL
 *      Sagas X/3 · Arcs X/32 · Factions X/19 · Distinctions X/Y
 *
 * Dépendances :
 *   - window.Profile.snapshot()
 *   - window.NpcArcs.getAllArcs() (optionnel)
 *   - window.NpcState (optionnel)
 *   - window.SCENES (sinon dégrade gracieusement)
 *   - window.CasInSkillBranches (sinon utilise un fallback minimal)
 *   - data/scenes-chronology.json (lazy fetch)
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  
  // v132g — Résolution path data/ correcte depuis n'importe quelle page
  // (fix régression v131c sur les fetches relatifs depuis pages/, fiches/, etc.)
  function _dataUrl(rel) {
    if (typeof window !== 'undefined' && window.CasInUtils && typeof window.CasInUtils.dataUrl === 'function') {
      return window.CasInUtils.dataUrl(rel);
    }
    const clean = String(rel || '').replace(/^\.?\/?(data\/)?/, '');
    const path = (typeof window !== 'undefined' && window.location) ? window.location.pathname : '/';
    const m = path.match(/^(.*?\/CAS-IN\/|\/)(.*)$/);
    if (!m) return './data/' + clean;
    const slashCount = (m[2].match(/\//g) || []).length;
    const prefix = slashCount > 0 ? '../'.repeat(slashCount) : './';
    return prefix + 'data/' + clean;
  }

if (window.ProfileDashboard) return;

  // ─── Constantes ────────────────────────────────────────────────
  // Niveaux d'enquêteur (purement cosmétiques — Profile gère le vrai rang
  // par XP/track ; ici on donne un libellé tour-de-rôle basé sur le
  // volume de scènes pour rendre la progression plus tangible).
  const LEVELS = [
    { min: 0,   icon: '🔰', label: 'Aspirant·e' },
    { min: 5,   icon: '👤', label: 'Stagiaire' },
    { min: 15,  icon: '🕵', label: 'Inspecteur·trice' },
    { min: 35,  icon: '🎖', label: 'Senior' },
    { min: 70,  icon: '⭐', label: 'Spécialiste' },
    { min: 110, icon: '🏆', label: 'Référent·e' },
    { min: 150, icon: '💎', label: 'Maître·sse' },
  ];

  // Cache chronologie pour les sagas
  let _chronologyCache = null;
  let _chronoLoadPromise = null;

  function loadChronology() {
    if (_chronologyCache) return Promise.resolve(_chronologyCache);
    if (_chronoLoadPromise) return _chronoLoadPromise;
    _chronoLoadPromise = fetch(_dataUrl('scenes-chronology.json'))
      .then(r => r.ok ? r.json() : null)
      .then(d => { _chronologyCache = d; return d; })
      .catch(e => { console.warn('[dashboard] chrono fetch failed:', e); return null; });
    return _chronoLoadPromise;
  }

  // ─── Helpers ───────────────────────────────────────────────────
  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, ch => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]
    ));
  }

  function getResults() {
    try { return JSON.parse(localStorage.getItem('scene_results') || '{}'); }
    catch { return {}; }
  }

  function getSceneTitle(sceneId) {
    if (typeof window.SCENES === 'object' && Array.isArray(window.SCENES)) {
      const s = window.SCENES.find(s => s && s.id === sceneId);
      if (s && s.title) return s.title;
    }
    return sceneId;
  }

  function getLevel(scenesCount) {
    let lvl = LEVELS[0];
    for (const l of LEVELS) {
      if (scenesCount >= l.min) lvl = l;
    }
    const next = LEVELS.find(l => l.min > scenesCount);
    return { ...lvl, nextMin: next ? next.min : null, nextLabel: next ? next.label : null };
  }

  // ─── 1. Profil en un coup d'œil ───────────────────────────────
  function renderQuickProfile(snap) {
    const scenesCount = snap.scenesCount || 0;
    const lvl = getLevel(scenesCount);
    const streak = (snap.streak && snap.streak.current) || 0;
    const xp = snap.xp || 0;
    const rankName = snap.rank ? snap.rank.name : '—';

    const progress = lvl.nextMin
      ? `${scenesCount}/${lvl.nextMin} scènes pour ${escapeHTML(lvl.nextLabel)}`
      : 'Niveau max atteint';
    const pct = lvl.nextMin
      ? Math.min(100, Math.round((scenesCount / lvl.nextMin) * 100))
      : 100;

    return `
      <div class="dash-card dash-card-profile">
        <div class="dash-card-label">PROFIL</div>
        <div class="dash-profile-main">
          <div class="dash-profile-icon">${lvl.icon}</div>
          <div class="dash-profile-text">
            <div class="dash-profile-level">${escapeHTML(lvl.label)}</div>
            <div class="dash-profile-rank">${escapeHTML(rankName)}</div>
          </div>
          <div class="dash-profile-streak" title="Série en cours">${streak} 🔥</div>
        </div>
        <div class="dash-profile-progress">
          <div class="dash-profile-bar"><div class="dash-profile-bar-fill" style="width:${pct}%"></div></div>
          <div class="dash-profile-subtext">${progress}</div>
        </div>
        <div class="dash-profile-xp">${xp.toLocaleString('fr-CH')} XP</div>
      </div>
    `;
  }

  // ─── 2. Spécialité émergente ──────────────────────────────────
  function getBranchAffinity(results) {
    // Compte les scènes complétées (≥60) par branche
    if (typeof window.SCENES === 'undefined') return null;
    if (!window.CasInSkillBranches) return null;
    const branches = window.CasInSkillBranches.ALL_BRANCHES.filter(b => !b.matchAll);
    // .filter pour exclure "comportement" qui matche TOUT
    const tally = branches.map(b => {
      const matched = window.CasInSkillBranches.getBranchScenes(b, window.SCENES);
      const total = matched.length;
      const done = matched.filter(s => {
        const r = results[s.id];
        return r && r.pct >= 60;
      }).length;
      const perfect = matched.filter(s => {
        const r = results[s.id];
        return r && r.pct >= 90;
      }).length;
      return { ...b, total, done, perfect, pct: total ? Math.round(done/total*100) : 0 };
    });
    tally.sort((a, b) => b.done - a.done || b.perfect - a.perfect);
    return tally;
  }

  function renderSpecialty(results) {
    const aff = getBranchAffinity(results);
    if (!aff || aff.length === 0) {
      return `<div class="dash-card dash-card-specialty">
        <div class="dash-card-label">SPÉCIALITÉ</div>
        <div class="dash-specialty-empty">Joue quelques scènes pour révéler ta spécialité</div>
      </div>`;
    }
    const top = aff[0];
    const others = aff.slice(1, 3);
    const hasData = top.done > 0;

    const itemsHTML = others.map(b => `
      <div class="dash-spec-mini">
        <span class="dash-spec-mini-icon">${b.icon}</span>
        <span class="dash-spec-mini-label">${escapeHTML(b.title.split(' & ')[0].split(' ').slice(0,2).join(' '))}</span>
        <span class="dash-spec-mini-count">${b.done}/${b.total}</span>
      </div>
    `).join('');

    return `
      <div class="dash-card dash-card-specialty">
        <div class="dash-card-label">SPÉCIALITÉ ÉMERGENTE</div>
        ${hasData ? `
          <div class="dash-spec-top" style="--branch-color:${top.color || '#00e5cc'}">
            <div class="dash-spec-top-icon">${top.icon}</div>
            <div class="dash-spec-top-body">
              <div class="dash-spec-top-title">${escapeHTML(top.title)}</div>
              <div class="dash-spec-top-meta">
                ${top.done}/${top.total} validées ·
                ${top.perfect} ⭐
              </div>
              <div class="dash-spec-top-bar"><div class="dash-spec-top-bar-fill" style="width:${top.pct}%;background:${top.color || '#00e5cc'}"></div></div>
            </div>
          </div>
          ${others.length > 0 ? `<div class="dash-spec-others">${itemsHTML}</div>` : ''}
        ` : `<div class="dash-specialty-empty">Joue 3-5 scènes pour révéler ta spécialité.</div>`}
      </div>
    `;
  }

  // ─── 3. Prochaine étape suggérée ──────────────────────────────
  function buildSuggestions(snap, results) {
    const out = [];
    const FOUNDATIONS = ['custody','premier_appel','phishing','metadata','trois_artefacts','osint-licite','lockbit-victime'];
    const validIds = new Set((window.SCENES || []).map(s => s && s.id).filter(Boolean));

    // — Saga la plus avancée (mais pas terminée) —
    if (_chronologyCache && _chronologyCache.sagas) {
      let bestSaga = null;
      let bestSagaScore = -1;
      for (const saga of _chronologyCache.sagas) {
        const done = saga.scenes.filter(sid => results[sid] && results[sid].pct >= 60).length;
        if (done > 0 && done < saga.scenes.length) {
          const score = done; // privilégie la saga la plus avancée
          if (score > bestSagaScore) {
            bestSagaScore = score;
            const nextSceneId = saga.scenes.find(sid => !results[sid] || results[sid].pct < 60);
            bestSaga = { saga, done, nextSceneId };
          }
        }
      }
      if (bestSaga && bestSaga.nextSceneId && validIds.has(bestSaga.nextSceneId)) {
        out.push({
          icon: bestSaga.saga.icon || '🎬',
          kind: 'saga',
          title: `Continuer ${bestSaga.saga.title}`,
          subtitle: `Acte ${bestSaga.done + 1}/${bestSaga.saga.scenes.length} — ${getSceneTitle(bestSaga.nextSceneId)}`,
          href: `scene.html#scene=${encodeURIComponent(bestSaga.nextSceneId)}`,
          priority: 100,
        });
      }
    }

    // — Arc PNJ le plus avancé —
    if (window.NpcArcs && typeof window.NpcArcs.getAllArcs === 'function') {
      const arcs = window.NpcArcs.getAllArcs();
      const active = arcs.filter(a => {
        const p = a.progress;
        return p && p.target > 0 && p.current > 0 && p.current < p.target;
      });
      active.sort((a, b) => {
        return (b.progress.current / b.progress.target) - (a.progress.current / a.progress.target);
      });
      const top = active[0];
      if (top) {
        const nextStage = top.stages.find(s => !(top.progress.completedSceneIds || []).includes(s.scene_id));
        if (nextStage && validIds.has(nextStage.scene_id)) {
          out.push({
            icon: top.icon || '👤',
            kind: 'arc',
            title: `Avancer l'arc « ${top.title} »`,
            subtitle: `${top.progress.current}/${top.progress.target} stages — ${getSceneTitle(nextStage.scene_id)}`,
            href: `scene.html#scene=${encodeURIComponent(nextStage.scene_id)}`,
            priority: 80,
          });
        }
      }
    }

    // — Fondamentaux non faits —
    const fundDone = FOUNDATIONS.filter(id => results[id]).length;
    if (fundDone < FOUNDATIONS.length) {
      const nextFund = FOUNDATIONS.find(id => !results[id] && validIds.has(id));
      if (nextFund) {
        out.push({
          icon: '🌱',
          kind: 'fundamental',
          title: 'Compléter les fondamentaux',
          subtitle: `${fundDone}/${FOUNDATIONS.length} — prochain : ${getSceneTitle(nextFund)}`,
          href: `scene.html#scene=${encodeURIComponent(nextFund)}`,
          priority: fundDone < 3 ? 120 : 50,  // très prioritaire si <3 fondamentaux faits
        });
      }
    }

    // — Verrou expert : nb de hard validés —
    if (window.CasInGating && typeof window.CasInGating.countValidatedHard === 'function'
        && !window.CasInGating.isDisabled()) {
      const validated = window.CasInGating.countValidatedHard();
      const HARD_TH = window.CasInGating.HARD_THRESHOLD;
      if (validated < HARD_TH && validated >= 1) {
        // Trouver une scène hard pas encore validée et accessible
        const hardScenes = (window.SCENES || []).filter(s => s && s.difficulty === 'hard');
        const nextHard = hardScenes.find(s => {
          const r = results[s.id];
          return !r || r.pct < 60;
        });
        if (nextHard) {
          out.push({
            icon: '🎓',
            kind: 'unlock',
            title: 'Débloquer les scènes expert',
            subtitle: `${validated}/${HARD_TH} hard validées — prochain : ${getSceneTitle(nextHard.id)}`,
            href: `scene.html#scene=${encodeURIComponent(nextHard.id)}`,
            priority: 40,
          });
        }
      }
    }

    // Trie par priorité décroissante, max 3
    out.sort((a, b) => b.priority - a.priority);
    return out.slice(0, 3);
  }

  function renderNextSteps(suggestions) {
    if (suggestions.length === 0) {
      return `
        <div class="dash-card dash-card-next">
          <div class="dash-card-label">PROCHAINE ÉTAPE</div>
          <div class="dash-next-empty">
            <a href="scene.html" class="dash-next-empty-btn">▶ Choisir une scène</a>
          </div>
        </div>
      `;
    }
    const items = suggestions.map((s, i) => `
      <a href="${s.href}" class="dash-next-item dash-next-item-${s.kind}${i === 0 ? ' dash-next-item-primary' : ''}">
        <span class="dash-next-icon">${s.icon}</span>
        <div class="dash-next-body">
          <div class="dash-next-title">${escapeHTML(s.title)}</div>
          <div class="dash-next-sub">${escapeHTML(s.subtitle)}</div>
        </div>
        <span class="dash-next-arrow">→</span>
      </a>
    `).join('');
    return `
      <div class="dash-card dash-card-next">
        <div class="dash-card-label">PROCHAINE ÉTAPE SUGGÉRÉE</div>
        <div class="dash-next-list">${items}</div>
      </div>
    `;
  }

  // ─── 4. Snapshot global ───────────────────────────────────────
  function renderSnapshot(snap, results) {
    // Sagas
    let sagasTotal = 0, sagasDone = 0;
    if (_chronologyCache && _chronologyCache.sagas) {
      sagasTotal = _chronologyCache.sagas.length;
      sagasDone = _chronologyCache.sagas.filter(saga =>
        saga.scenes.every(sid => results[sid] && results[sid].pct >= 60)
      ).length;
    }
    // Arcs
    let arcsTotal = 0, arcsDone = 0;
    if (window.NpcArcs && typeof window.NpcArcs.getAllArcs === 'function') {
      const arcs = window.NpcArcs.getAllArcs();
      arcsTotal = arcs.length;
      arcsDone = arcs.filter(a => a.progress && a.progress.current >= a.progress.target && a.progress.target > 0).length;
    }
    // Factions (depuis CasInNpcData ou fallback)
    let factionsTotal = 19, factionsDone = 0;
    if (window.NpcState && window.CasInNpcData) {
      const all = window.CasInNpcData.getAll();
      if (all) {
        const encountered = window.NpcState.getEncountered();
        const fams = new Set();
        encountered.forEach(id => {
          const fid = window.CasInNpcData.getInstitutionFamily(id);
          if (fid) fams.add(fid);
        });
        factionsDone = fams.size;
      }
    }
    // Distinctions
    const achTotal = snap.achievements ? (snap.achievements.length || 0) : 0;
    // Total badges connus (essaie via GLOBAL_BADGES si exposé)
    let badgesTotal = 80;
    if (typeof window.GLOBAL_BADGES !== 'undefined' && Array.isArray(window.GLOBAL_BADGES)) {
      badgesTotal = window.GLOBAL_BADGES.length;
    }
    // Scènes
    const scenesCount = snap.scenesCount || 0;
    const scenesTotal = (window.SCENES || []).length || 162;

    return `
      <div class="dash-card dash-card-snapshot">
        <div class="dash-card-label">SNAPSHOT</div>
        <div class="dash-snapshot-grid">
          <div class="dash-snapshot-item">
            <div class="dash-snap-icon">🎬</div>
            <div class="dash-snap-val">${sagasDone}<span class="dash-snap-max">/${sagasTotal}</span></div>
            <div class="dash-snap-label">Sagas</div>
          </div>
          <div class="dash-snapshot-item">
            <div class="dash-snap-icon">👤</div>
            <div class="dash-snap-val">${arcsDone}<span class="dash-snap-max">/${arcsTotal}</span></div>
            <div class="dash-snap-label">Arcs</div>
          </div>
          <div class="dash-snapshot-item">
            <div class="dash-snap-icon">🏛</div>
            <div class="dash-snap-val">${factionsDone}<span class="dash-snap-max">/${factionsTotal}</span></div>
            <div class="dash-snap-label">Factions</div>
          </div>
          <div class="dash-snapshot-item">
            <div class="dash-snap-icon">📊</div>
            <div class="dash-snap-val">${scenesCount}<span class="dash-snap-max">/${scenesTotal}</span></div>
            <div class="dash-snap-label">Scènes</div>
          </div>
          <div class="dash-snapshot-item">
            <div class="dash-snap-icon">🏆</div>
            <div class="dash-snap-val">${achTotal}<span class="dash-snap-max">/${badgesTotal}</span></div>
            <div class="dash-snap-label">Distinctions</div>
          </div>
        </div>
      </div>
    `;
  }

  // ─── Render principal ─────────────────────────────────────────
  async function render() {
    // Cible : insertion en haut de profile-main, avant le Hero existant
    const main = document.querySelector('.profile-main');
    if (!main) return;

    // Vérifier que Profile est dispo
    if (!window.Profile || typeof window.Profile.snapshot !== 'function') {
      return; // pas encore prêt — réessayer plus tard
    }

    const snap = window.Profile.snapshot();
    const results = getResults();

    // Si chronology n'est pas encore chargée, lance le fetch
    await loadChronology();

    // S'assurer que NpcArcs et CasInNpcData sont prêts (best effort)
    if (window.NpcArcs && typeof window.NpcArcs.load === 'function') {
      try { await window.NpcArcs.load(); } catch (_) {}
    }
    if (window.CasInNpcData && typeof window.CasInNpcData.load === 'function') {
      try { await window.CasInNpcData.load(); } catch (_) {}
    }

    const suggestions = buildSuggestions(snap, results);

    let dashboard = document.getElementById('profile-dashboard');
    const html = `
      <div class="dash-grid">
        ${renderQuickProfile(snap)}
        ${renderSpecialty(results)}
        ${renderNextSteps(suggestions)}
        ${renderSnapshot(snap, results)}
      </div>
    `;

    if (!dashboard) {
      dashboard = document.createElement('section');
      dashboard.id = 'profile-dashboard';
      dashboard.className = 'profile-dashboard';
      dashboard.setAttribute('aria-label', 'Tableau de bord');
      dashboard.innerHTML = html;
      // Insérer dans le panel "operational" pour que le tab gère sa visibilité
      const operational = document.getElementById('profile-panel-operational');
      if (operational) {
        operational.insertBefore(dashboard, operational.firstChild);
      } else {
        main.insertBefore(dashboard, main.firstChild);
      }
    } else {
      dashboard.innerHTML = html;
    }
  }

  // ─── Boot ─────────────────────────────────────────────────────
  function init() {
    let retries = 0;
    function tryRender() {
      if (window.Profile && typeof window.Profile.snapshot === 'function') {
        render();
        // Re-render après chaque profile-changed
        window.addEventListener('profile-changed', () => {
          setTimeout(render, 50);
        });
        return;
      }
      if (retries++ < 30) setTimeout(tryRender, 200);
    }
    tryRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ProfileDashboard = { render };
})();
