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
      return { completed: 0, total: 0, pctCatalog: 0, avgPct: 0, isCompleted: false, nextSceneId: null };
    }
    let completed = 0;
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
    if (!nextSceneId && sceneIds.length > 0) nextSceneId = sceneIds[0];
    return { completed, total, pctCatalog, avgPct, isCompleted, nextSceneId };
  }

  function renderCard(saga, progress) {
    const level = saga.level || 'medium';
    const color = LEVEL_COLORS[level] || LEVEL_COLORS.medium;
    const cta = progress.completed === 0
      ? t('sagas_page.cta_start', 'Démarrer')
      : (progress.isCompleted ? t('sagas_page.cta_revisit', '🔄 Revisiter') : t('sagas_page.cta_resume', 'Reprendre'));
    const targetSceneId = progress.isCompleted
      ? (saga.scenes && saga.scenes[0]) || progress.nextSceneId
      : progress.nextSceneId;
    const href = targetSceneId
      ? `scene.html?scene=${encodeURIComponent(targetSceneId)}${progress.isCompleted ? '&revisit=1' : ''}`
      : 'scene.html#campaigns';
    const completedCls = progress.isCompleted ? ' completed' : '';
    return `
      <a href="${href}" class="sg-card${completedCls}" style="--sg-color: ${color}" data-saga="${escapeHtml(saga.id)}" data-level="${level}" data-kind="${escapeHtml(saga.kind || 'saga')}">
        <div class="sg-card-head">
          <div class="sg-card-icon">${escapeHtml(saga.icon || '📖')}</div>
          <div class="sg-card-titles">
            <h3 class="sg-card-title">${escapeHtml(saga.title || saga.id)}</h3>
            <div class="sg-card-sub">${escapeHtml(saga.subtitle || '')}</div>
          </div>
          <span class="sg-card-level" data-level="${level}">${escapeHtml(level)}</span>
        </div>
        ${saga.description ? `<p class="sg-card-desc">${escapeHtml(saga.description)}</p>` : ''}
        <div class="sg-card-progress">
          <div class="sg-card-prog-line">
            <span class="sg-card-prog-num">${progress.completed} / ${progress.total} scènes</span>
            <span class="sg-card-prog-pct">${progress.pctCatalog}%${progress.avgPct ? ' · ' + t('sagas_page.avg_label', 'moy.') + ' ' + progress.avgPct + '%' : ''}</span>
          </div>
          <div class="sg-card-bar"><div class="sg-card-bar-fill" style="width: ${progress.pctCatalog}%"></div></div>
        </div>
        <div class="sg-card-cta">
          <span>${progress.isCompleted ? t('sagas_page.saga_complete_label', '🏆 Complet') : ''}</span>
          <span class="sg-card-cta-act">${cta} →</span>
        </div>
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

    // v3 — Sections séparées si kind='all'
    if (currentKind === 'all') {
      const sagas = recits.filter(c => c.kind === 'saga');
      const affaires = recits.filter(c => c.kind === 'affaire');
      let html = '';
      if (sagas.length > 0) {
        html += `
          <div class="sg-section-header" style="grid-column:1/-1;margin:0 0 8px;padding:14px 0 6px;border-bottom:1px solid rgba(255,255,255,.08)">
            <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
              <h2 style="margin:0;font-size:1.15rem;font-weight:700">🎬 ${t('sagas_page.section_sagas', 'Sagas narratives')}</h2>
              <span style="color:var(--dim);font-size:.85rem">${sagas.length} ${t('sagas_page.recits_label', 'récits')}</span>
            </div>
            <p style="margin:6px 0 0;color:var(--dim);font-size:.85rem;line-height:1.4">${t('sagas_page.section_sagas_desc', 'Arcs narratifs continus avec mêmes PNJ d&apos;épisode en épisode — 5 à 8 scènes par récit.')}</p>
          </div>
        `;
        html += sagas.map(s => renderCard(s, progressMap[s.id])).join('');
      }
      if (affaires.length > 0) {
        html += `
          <div class="sg-section-header" style="grid-column:1/-1;margin:24px 0 8px;padding:14px 0 6px;border-bottom:1px solid rgba(255,255,255,.08)">
            <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
              <h2 style="margin:0;font-size:1.15rem;font-weight:700">📁 ${t('sagas_page.section_affaires', 'Affaires')}</h2>
              <span style="color:var(--dim);font-size:.85rem">${affaires.length} ${t('sagas_page.dossiers_label', 'dossiers')}</span>
            </div>
            <p style="margin:6px 0 0;color:var(--dim);font-size:.85rem;line-height:1.4">${t('sagas_page.section_affaires_desc', 'Dossiers d&apos;enquête centrés sur un lieu ou un événement précis — 5 à 8 scènes par affaire.')}</p>
          </div>
        `;
        html += affaires.map(s => renderCard(s, progressMap[s.id])).join('');
      }
      grid.innerHTML = html;
    } else {
      grid.innerHTML = recits.map(s => renderCard(s, progressMap[s.id])).join('');
    }

    updateSummary(recits, progressMap);
    updateLevelCounts(recits);
  }

  function attachLevelFilterHandlers(allCampaigns, results) {
    document.querySelectorAll('.sg-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.sg-chip').forEach(c => {
          c.classList.remove('active');
          c.style.background = 'rgba(255,255,255,.04)';
          c.style.color = 'var(--dim)';
          c.style.borderColor = 'rgba(255,255,255,.08)';
        });
        chip.classList.add('active');
        chip.style.background = 'rgba(126,192,255,.14)';
        chip.style.color = 'var(--text)';
        chip.style.borderColor = 'rgba(126,192,255,.35)';
        currentLevel = chip.dataset.level || 'all';
        lsSet('cas_sagas_filter_level', currentLevel);
        applyFilters(allCampaigns, results);
      });
    });
  }

  function attachKindFilterHandlers(allCampaigns, results) {
    document.querySelectorAll('.sg-kind-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.sg-kind-chip').forEach(c => {
          c.classList.remove('active');
          c.style.background = 'rgba(255,255,255,.04)';
          c.style.color = 'var(--dim)';
          c.style.borderColor = 'rgba(255,255,255,.08)';
        });
        chip.classList.add('active');
        chip.style.background = 'rgba(126,192,255,.20)';
        chip.style.color = 'var(--text)';
        chip.style.borderColor = 'rgba(126,192,255,.45)';
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
    kindRow.style.cssText = 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 0 12px 0';
    kindRow.innerHTML = `
      <button class="sg-kind-chip active" data-kind="all"
        style="background:rgba(126,192,255,.20);color:var(--text);border:1px solid rgba(126,192,255,.45);padding:8px 18px;border-radius:999px;cursor:pointer;font-size:.9rem;font-weight:600;min-height:38px">
        ${t('sagas_page.kind_all', '📚 Tous récits')} <span id="sg-kind-count-all" style="opacity:.7;font-size:.8rem">—</span>
      </button>
      <button class="sg-kind-chip" data-kind="saga"
        style="background:rgba(255,255,255,.04);color:var(--dim);border:1px solid rgba(255,255,255,.08);padding:8px 18px;border-radius:999px;cursor:pointer;font-size:.9rem;font-weight:600;min-height:38px">
        ${t('sagas_page.kind_saga', '🎬 Sagas')} <span id="sg-kind-count-saga" style="opacity:.7;font-size:.8rem">—</span>
      </button>
      <button class="sg-kind-chip" data-kind="affaire"
        style="background:rgba(255,255,255,.04);color:var(--dim);border:1px solid rgba(255,255,255,.08);padding:8px 18px;border-radius:999px;cursor:pointer;font-size:.9rem;font-weight:600;min-height:38px">
        ${t('sagas_page.kind_affaire', '📁 Affaires')} <span id="sg-kind-count-affaire" style="opacity:.7;font-size:.8rem">—</span>
      </button>
    `;
    filtersBar.parentElement.insertBefore(kindRow, filtersBar);
  }

  function injectCollectionsCard() {
    const heroSection = document.querySelector('.sg-hero');
    if (!heroSection) return;
    if (document.getElementById('sg-collections-promo')) return;
    const promo = document.createElement('div');
    promo.id = 'sg-collections-promo';
    promo.style.cssText = 'margin:14px auto 0;max-width:760px;padding:14px 18px;background:linear-gradient(135deg,rgba(168,85,247,.10),rgba(99,102,241,.10));border:1px solid rgba(168,85,247,.30);border-radius:14px;text-align:left';
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

    injectKindFilterUI();
    injectCollectionsCard();
    updatePageHeader(campaigns);
    updateKindCounts(campaigns);

    document.querySelectorAll('.sg-kind-chip').forEach(c => {
      const isActive = c.dataset.kind === currentKind;
      c.classList.toggle('active', isActive);
      if (isActive) {
        c.style.background = 'rgba(126,192,255,.20)';
        c.style.color = 'var(--text)';
        c.style.borderColor = 'rgba(126,192,255,.45)';
      } else {
        c.style.background = 'rgba(255,255,255,.04)';
        c.style.color = 'var(--dim)';
        c.style.borderColor = 'rgba(255,255,255,.08)';
      }
    });

    document.querySelectorAll('.sg-chip').forEach(c => {
      const isActive = c.dataset.level === currentLevel;
      c.classList.toggle('active', isActive);
      if (isActive) {
        c.style.background = 'rgba(126,192,255,.14)';
        c.style.color = 'var(--text)';
        c.style.borderColor = 'rgba(126,192,255,.35)';
      } else {
        c.style.background = 'rgba(255,255,255,.04)';
        c.style.color = 'var(--dim)';
        c.style.borderColor = 'rgba(255,255,255,.08)';
      }
    });

    applyFilters(campaigns, results);
    attachLevelFilterHandlers(campaigns, results);
    attachKindFilterHandlers(campaigns, results);
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
