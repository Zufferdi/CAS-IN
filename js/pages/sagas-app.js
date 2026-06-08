/**
 * sagas-app.js — Page Sagas (v121a — Reclassification kind)
 *
 * v121a (mai 2026) :
 *   - Filtrage par champ `kind` (saga|affaire|collection) au lieu de id.startsWith('saga-')
 *   - Sépare visuellement les Sagas (10, vrais arcs narratifs) et les Affaires (23, format "L'Affaire X")
 *   - Les Collections (10, thématiques) ne sont PAS affichées ici — page dédiée collections.html
 *   - Ajout d'un sélecteur kind: Toutes / Sagas / Affaires
 *   - Filtres par niveau préservés (stagiaire/inspecteur/enqueteur/expert)
 *
 * Quand kind='all', deux sections distinctes sont affichées (Sagas puis Affaires).
 * Quand kind='saga' ou 'affaire', une seule section.
 *
 * Charge data/campaigns.json, calcule la progression de chaque entrée
 * en lisant scene_results dans localStorage.
 *
 * Seuil de complétion d'une scène : pct >= 60 (cohérent avec cas-in-arcs.js).
 *
 * v3.0 — 2026-05-27 (v121a — sections visuelles séparées Sagas/Affaires)
 */
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

const STAGE_THRESHOLD = 60;
const PERFECT_THRESHOLD = 90;

  function t(key, fb) {
    return (window.CASi18n && window.CASi18n.t) ? window.CASi18n.t(key, fb) : fb;
  }

  const LEVEL_COLORS = {
    stagiaire:  '#30e88a',
    inspecteur: '#f0c040',
    enqueteur:  '#ff4060',
    expert:     '#c97df5',
    easy:       '#30e88a',
    medium:     '#f0c040',
    hard:       '#ff4060'
  };

  // v3.4 — Métadonnées des grades (fallback si data.levels indisponible)
  const LEVEL_META_FALLBACK = {
    stagiaire:  { icon: '🎓', title: 'Stagiaire' },
    inspecteur: { icon: '🔍', title: 'Inspecteur' },
    enqueteur:  { icon: '⚖️', title: 'Enquêteur' },
    expert:     { icon: '💎', title: 'Expert DFIR' }
  };
  let LEVEL_META = LEVEL_META_FALLBACK;

  let currentKind = 'all';
  let currentLevel = 'all';

  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function lsSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  function getSagaProgress(saga, results) {
    const sceneIds = saga.scenes || [];
    const total = sceneIds.length;
    if (total === 0) {
      return { completed: 0, perfect: 0, total: 0, pctCatalog: 0, avgPct: 0, isCompleted: false, allPerfect: false, nextSceneId: null };
    }
    let completed = 0;
    let perfect = 0;
    let sumPct = 0;
    let countPct = 0;
    let nextSceneId = null;
    for (const sceneId of sceneIds) {
      const r = results[sceneId];
      if (r && typeof r.pct === 'number') {
        sumPct += r.pct;
        countPct += 1;
        if (r.pct >= STAGE_THRESHOLD) {
          completed += 1;
          if (r.pct >= PERFECT_THRESHOLD) perfect += 1;
        } else if (!nextSceneId) {
          nextSceneId = sceneId;
        }
      } else if (!nextSceneId) {
        nextSceneId = sceneId;
      }
    }
    const pctCatalog = Math.round((completed / total) * 100);
    const avgPct = countPct > 0 ? Math.round(sumPct / countPct) : 0;
    const isCompleted = completed === total;
    const allPerfect = isCompleted && perfect === total;
    if (!nextSceneId && sceneIds.length > 0) nextSceneId = sceneIds[0];
    return { completed, perfect, total, pctCatalog, avgPct, isCompleted, allPerfect, nextSceneId };
  }

  // v3.4 — Statut harmonisé avec campaignStats() de scene-campaigns-v1.js
  function getStatus(progress) {
    if (progress.completed === 0) {
      return { label: 'NON OUVERT', cls: 'new', icon: '○' };
    }
    if (progress.isCompleted) {
      if (progress.allPerfect) {
        return { label: 'MAÎTRISÉ', cls: 'mastered', icon: '★' };
      }
      return { label: 'CLÔTURÉ', cls: 'completed', icon: '✓' };
    }
    return {
      label: `EN COURS · ${progress.completed}/${progress.total}`,
      cls: 'inprogress',
      icon: '◐'
    };
  }

  function renderCard(saga, progress) {
    const level = saga.level || 'medium';
    const kind = saga.kind || 'saga';
    const meta = LEVEL_META[level] || { icon: '', title: level };
    const dossierNum = 'CAS-IN/' + String(saga.order || 0).padStart(2, '0');
    const s = getStatus(progress);
    const hook = saga.hook || '';
    const kindClass = kind === 'affaire' ? 'dossier-recit-affaire' : 'dossier-recit-saga';
    const ctaLabel = kind === 'affaire'
      ? t('sagas_page.cta_open_affaire', 'OUVRIR LE DOSSIER')
      : t('sagas_page.cta_open_saga', 'OUVRIR LA SAGA');
    // v3.4 — La carte ouvre désormais la vue détaillée (existante dans
    // scene-campaigns-v1.js, qui sait déjà rendre les sagas via c.narrative).
    // Le lecteur voit la liste des actes/scènes avant de lancer une partie.
    const href = `#campaign=${encodeURIComponent(saga.id)}`;
    // Badge moyenne quand des scènes ont été tentées
    const avgBadge = progress.avgPct
      ? `<span class="dossier-perfect">${t('sagas_page.avg_label', 'moy.')} ${progress.avgPct}%</span>`
      : (progress.perfect ? `<span class="dossier-perfect">${progress.perfect} ★</span>` : '');
    return `
      <a href="${href}"
         class="dossier-card dossier-level-${level} dossier-recit ${kindClass}"
         data-saga-id="${escapeHtml(saga.id)}"
         data-campaign-id="${escapeHtml(saga.id)}"
         data-level="${level}"
         data-kind="${escapeHtml(kind)}"
         role="button"
         tabindex="0">
        <div class="dossier-stamp">
          <span class="dossier-num">N° ${escapeHtml(dossierNum)}</span>
          <span class="dossier-classif">${escapeHtml(meta.icon || '')} ${escapeHtml((meta.title || '').toUpperCase())}</span>
        </div>
        <div class="dossier-head">
          <div class="dossier-icon">${escapeHtml(saga.icon || '📖')}</div>
          <div class="dossier-titles">
            <h3 class="dossier-title">${escapeHtml(saga.title || saga.id)}</h3>
            <div class="dossier-subtitle">${escapeHtml(saga.subtitle || '')}</div>
          </div>
        </div>
        ${hook ? `<p class="dossier-hook">« ${escapeHtml(hook)} »</p>` : ''}
        ${saga.description ? `<p class="dossier-desc">${escapeHtml(saga.description)}</p>` : ''}
        <div class="dossier-footer">
          <div class="dossier-progress">
            <div class="dossier-progress-track">
              <div class="dossier-progress-fill" style="width:${progress.pctCatalog}%"></div>
            </div>
          </div>
          <div class="dossier-status dossier-status-${s.cls}">
            <span class="dossier-status-icon">${s.icon}</span>
            <span class="dossier-status-label">${escapeHtml(s.label)}</span>
            ${avgBadge}
          </div>
        </div>
        <div class="dossier-cta">${escapeHtml(ctaLabel)} →</div>
      </a>
    `;
  }

  function updateSummary(items, progressMap) {
    const totalScenes = items.reduce((sum, s) => sum + (s.scenes || []).length, 0);
    const totalCompleted = items.reduce((sum, s) => sum + progressMap[s.id].completed, 0);
    const done = items.filter(s => progressMap[s.id].isCompleted).length;
    const elTotal = document.getElementById('sg-total-sagas');
    const elTotalScenes = document.getElementById('sg-total-scenes');
    const elCompleted = document.getElementById('sg-completed-scenes');
    const elDone = document.getElementById('sg-completed-sagas');
    if (elTotal) elTotal.textContent = items.length;
    if (elTotalScenes) elTotalScenes.textContent = totalScenes;
    if (elCompleted) elCompleted.textContent = totalCompleted;
    if (elDone) elDone.textContent = done;
  }

  function updateLevelCounts(items) {
    const levels = ['all', 'stagiaire', 'inspecteur', 'enqueteur', 'expert'];
    for (const lvl of levels) {
      const el = document.getElementById('sg-count-' + lvl);
      if (!el) continue;
      if (lvl === 'all') {
        el.textContent = items.length;
      } else {
        el.textContent = items.filter(s => (s.level || 'medium') === lvl).length;
      }
    }
  }

  function updateKindCounts(allCampaigns) {
    const sagasOnly = allCampaigns.filter(c => c.kind === 'saga');
    const affairesOnly = allCampaigns.filter(c => c.kind === 'affaire');
    const both = allCampaigns.filter(c => c.kind === 'saga' || c.kind === 'affaire');
    const elAll = document.getElementById('sg-kind-count-all');
    const elSaga = document.getElementById('sg-kind-count-saga');
    const elAffaire = document.getElementById('sg-kind-count-affaire');
    if (elAll) elAll.textContent = both.length;
    if (elSaga) elSaga.textContent = sagasOnly.length;
    if (elAffaire) elAffaire.textContent = affairesOnly.length;
    // v3.4 — Met aussi à jour le compteur du bouton bascule "📖 Sagas (XX)"
    // dans le bandeau Scènes/Sagas. Ce compteur reflète sagas + affaires
    // (tous les récits affichés sur cette page).
    const elToggle = document.getElementById('view-btn-sagas-count');
    if (elToggle) elToggle.textContent = '(' + both.length + ')';
  }

  function applyFilters(allCampaigns, results) {
    const grid = document.getElementById('sg-grid');
    if (!grid) return;
    let recits = allCampaigns.filter(c => c.kind === 'saga' || c.kind === 'affaire');
    if (currentKind === 'saga') recits = recits.filter(c => c.kind === 'saga');
    else if (currentKind === 'affaire') recits = recits.filter(c => c.kind === 'affaire');
    if (currentLevel !== 'all') {
      recits = recits.filter(c => (c.level || 'medium') === currentLevel);
    }
    recits.sort((a, b) => (a.order || 999) - (b.order || 999));
    const progressMap = {};
    recits.forEach(s => { progressMap[s.id] = getSagaProgress(s, results); });

    if (recits.length === 0) {
      grid.innerHTML = `<div style="text-align:center;padding:40px;color:var(--dim);grid-column:1/-1">${t('sagas_page.empty_filter', 'Aucun résultat pour ces filtres.')}</div>`;
      updateSummary(recits, progressMap);
      return;
    }

    // v3.4 — Sections séparées si kind='all' (CSS dans scene-campaigns.css)
    if (currentKind === 'all') {
      const sagas = recits.filter(c => c.kind === 'saga');
      const affaires = recits.filter(c => c.kind === 'affaire');
      let html = '';
      if (sagas.length > 0) {
        html += `
          <div class="sg-section-header">
            <div class="sg-section-header-row">
              <h2>🎬 ${t('sagas_page.section_sagas', 'Sagas narratives')}</h2>
              <span class="sg-section-header-count">${sagas.length} ${t('sagas_page.recits_label', 'récits')}</span>
            </div>
            <p>${t('sagas_page.section_sagas_desc', 'Arcs narratifs continus avec mêmes PNJ d&apos;épisode en épisode — 5 à 8 scènes par récit.')}</p>
          </div>
        `;
        html += sagas.map(s => renderCard(s, progressMap[s.id])).join('');
      }
      if (affaires.length > 0) {
        html += `
          <div class="sg-section-header">
            <div class="sg-section-header-row">
              <h2>📁 ${t('sagas_page.section_affaires', 'Affaires')}</h2>
              <span class="sg-section-header-count">${affaires.length} ${t('sagas_page.dossiers_label', 'dossiers')}</span>
            </div>
            <p>${t('sagas_page.section_affaires_desc', 'Dossiers d&apos;enquête centrés sur un lieu ou un événement précis — 5 à 8 scènes par affaire.')}</p>
          </div>
        `;
        html += affaires.map(s => renderCard(s, progressMap[s.id])).join('');
      }
      grid.innerHTML = html;
    } else {
      grid.innerHTML = recits.map(s => renderCard(s, progressMap[s.id])).join('');
    }

    // v3.4 — Câbler la navigation vers la vue détaillée pour chaque carte
    attachCardClickHandlers(grid);

    updateSummary(recits, progressMap);
    updateLevelCounts(recits);
  }

  // v3.4 — Délégation : marque l'origine "sagas" pour adapter le retour
  // depuis la vue détaillée vers la page sagas (au lieu du tableau des dossiers).
  // Le href "#campaign=..." reste fonctionnel pour middle-click et accessibilité.
  function attachCardClickHandlers(grid) {
    // Marqueur d'origine — délégué au grid pour ne s'attacher qu'une seule fois
    if (!grid.dataset.sagaClickAttached) {
      grid.dataset.sagaClickAttached = '1';
      grid.addEventListener('click', (e) => {
        const card = e.target.closest('.dossier-card[data-saga-id]');
        if (!card) return;
        try { sessionStorage.setItem('cas_sagas_origin', '1'); } catch (_) {}
      }, true); // capture phase pour devancer la navigation hash
    }
    // Support clavier : Entrée est natif sur <a>, on ajoute juste Espace
    grid.querySelectorAll('.dossier-card[data-campaign-id]').forEach(card => {
      card.addEventListener('keydown', (e) => {
        if (e.key === ' ') {
          e.preventDefault();
          const cid = card.dataset.campaignId;
          if (cid) {
            try { sessionStorage.setItem('cas_sagas_origin', '1'); } catch (_) {}
            window.location.hash = '#campaign=' + encodeURIComponent(cid);
          }
        }
      });
    });
  }

  function attachLevelFilterHandlers(allCampaigns, results) {
    document.querySelectorAll('.sg-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.sg-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentLevel = chip.dataset.level || 'all';
        lsSet('cas_sagas_filter_level', currentLevel);
        applyFilters(allCampaigns, results);
      });
    });
  }

  function attachKindFilterHandlers(allCampaigns, results) {
    document.querySelectorAll('.sg-kind-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.sg-kind-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentKind = chip.dataset.kind || 'all';
        lsSet('cas_sagas_filter_kind', currentKind);
        applyFilters(allCampaigns, results);
      });
    });
  }

  function injectKindFilterUI() {
    const filtersBar = document.getElementById('sg-filters');
    if (!filtersBar) return;
    if (document.getElementById('sg-kind-filters')) return;
    const kindRow = document.createElement('div');
    kindRow.id = 'sg-kind-filters';
    kindRow.className = 'sg-filters-row';
    kindRow.innerHTML = `
      <button type="button" class="sg-kind-chip active" data-kind="all">
        <span>${t('sagas_page.kind_all', '📚 Tous récits')}</span>
        <span id="sg-kind-count-all">—</span>
      </button>
      <button type="button" class="sg-kind-chip" data-kind="saga">
        <span>${t('sagas_page.kind_saga', '🎬 Sagas')}</span>
        <span id="sg-kind-count-saga">—</span>
      </button>
      <button type="button" class="sg-kind-chip" data-kind="affaire">
        <span>${t('sagas_page.kind_affaire', '📁 Affaires')}</span>
        <span id="sg-kind-count-affaire">—</span>
      </button>
    `;
    filtersBar.parentElement.insertBefore(kindRow, filtersBar);
  }

  function injectCollectionsCard() {
    // v3.4 — La section hero a été renommée .page-hero (cohérence avec le tableau des dossiers)
    const heroSection = document.querySelector('#screen-sagas .page-hero')
                     || document.querySelector('.sg-hero'); // fallback héritage
    if (!heroSection) return;
    if (document.getElementById('sg-collections-promo')) return;
    const promo = document.createElement('div');
    promo.id = 'sg-collections-promo';
    promo.style.cssText = 'margin:18px auto 0;max-width:100%;padding:14px 18px;background:linear-gradient(135deg,rgba(168,85,247,.10),rgba(99,102,241,.10));border:1px solid rgba(168,85,247,.30);border-radius:14px;text-align:left';
    promo.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;justify-content:space-between;flex-wrap:wrap">
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:.95rem;margin-bottom:4px">📚 ${t('sagas_page.collections_title', '10 collections thématiques')}</div>
          <div style="font-size:.85rem;color:var(--dim);line-height:1.4">${t('sagas_page.collections_desc', 'Au-delà des récits, 10 collections regroupent ~280 scènes indépendantes par thème (Forensique Windows, Coopération internationale, Ransomwares cas réels...).')}</div>
        </div>
        <a href="collections.html" style="background:rgba(168,85,247,.20);color:#c4b5fd;border:1px solid rgba(168,85,247,.4);padding:8px 14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:.85rem;white-space:nowrap">${t('sagas_page.collections_cta', 'Voir les collections')} →</a>
      </div>
    `;
    heroSection.appendChild(promo);
  }

  function updatePageHeader(allCampaigns) {
    const sagaCount = allCampaigns.filter(c => c.kind === 'saga').length;
    const affaireCount = allCampaigns.filter(c => c.kind === 'affaire').length;
    const introEl = document.querySelector('[data-i18n="sagas_page.intro"]');
    if (introEl) {
      introEl.textContent = t('sagas_page.intro_v121a',
        `${sagaCount} sagas narratives et ${affaireCount} affaires multi-actes vous emmènent à travers la cybercriminalité suisse, du Léman au Tessin. Chaque récit raconte une enquête en 5 à 8 scènes — choisissez votre prochaine.`
      );
    }
  }

  // v3.4 — Récupère les méta des grades depuis campaigns.json (levels).
  // Surcharge LEVEL_META utilisé par renderCard pour le tampon de classification.
  function setLevelMeta(levels) {
    if (!levels || typeof levels !== 'object') return;
    LEVEL_META = Object.assign({}, LEVEL_META_FALLBACK);
    for (const [id, info] of Object.entries(levels)) {
      if (info && (info.icon || info.title)) {
        LEVEL_META[id] = {
          icon: info.icon || LEVEL_META_FALLBACK[id]?.icon || '',
          title: info.title || LEVEL_META_FALLBACK[id]?.title || id
        };
      }
    }
  }

  // v3.4 — Adapte le bouton "← Retour au tableau" de la vue détaillée pour
  // qu'il ramène à la page Sagas lorsqu'on y était entré depuis là.
  // S'appuie sur sessionStorage.cas_sagas_origin posé au clic d'une carte saga.
  function installBackLinkPatcher() {
    function patch() {
      try {
        if (sessionStorage.getItem('cas_sagas_origin') !== '1') return;
      } catch (_) { return; }
      const link = document.querySelector(
        '#screen-campaigns .campaign-back-link[data-action="back-to-campaigns"]'
      );
      if (!link || link.dataset.patchedForSagas === '1') return;
      link.dataset.patchedForSagas = '1';
      link.textContent = '← ' + t('sagas_page.back_to_sagas', 'Retour aux sagas');
      // Capture-phase : court-circuite le handler de scene-campaigns-v1.js
      link.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        try { sessionStorage.removeItem('cas_sagas_origin'); } catch (_) {}
        window.location.href = location.pathname + '?view=sagas';
      }, true);
    }
    const target = document.getElementById('screen-campaigns');
    if (!target) {
      // L'écran est créé par scene-campaigns-v1.js au boot — retry court
      setTimeout(installBackLinkPatcher, 200);
      return;
    }
    const observer = new MutationObserver(patch);
    observer.observe(target, { childList: true, subtree: false });
    // Patch immédiat (si on arrive déjà sur #campaign= depuis un refresh)
    patch();
  }

  async function init() {
    const grid = document.getElementById('sg-grid');
    if (!grid) return;

    currentKind = lsGet('cas_sagas_filter_kind', 'all') || 'all';
    currentLevel = lsGet('cas_sagas_filter_level', 'all') || 'all';

    let camp;
    try {
      camp = await fetch(_dataUrl('campaigns.json')).then(r => r.json());
    } catch (e) {
      console.warn('[sagas-app] failed to load campaigns.json', e);
      grid.innerHTML = `<div style="text-align:center;padding:30px;color:var(--dim);grid-column:1/-1">⚠ ${t('sagas_page.load_error', 'Impossible de charger les sagas. Réessayez en mode connecté.')}</div>`;
      return;
    }

    const campaigns = camp.campaigns || [];
    const results = lsGet('scene_results', {}) || {};

    // v3.4 — Importer les méta des grades pour le tampon des cartes
    setLevelMeta(camp.levels);

    injectKindFilterUI();
    injectCollectionsCard();
    updatePageHeader(campaigns);
    updateKindCounts(campaigns);

    // v3.4 — Restauration des filtres via .active uniquement (CSS gère le look)
    document.querySelectorAll('.sg-kind-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.kind === currentKind);
    });
    document.querySelectorAll('.sg-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.level === currentLevel);
    });

    applyFilters(campaigns, results);
    attachLevelFilterHandlers(campaigns, results);
    attachKindFilterHandlers(campaigns, results);

    // v3.4 — Active la rétro-navigation vers la page sagas depuis le détail
    installBackLinkPatcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('cas-locale-changed', function () {
    init();
  });
})();
