/* ═══════════════════════════════════════════════════════════════
 * scene-campaigns-v1.js — v3.2 (Vue Campagnes)
 *
 * Nouvel écran d'accueil de scene.html : présente 14 campagnes
 * pédagogiques au lieu d'une grille brute de 162 scènes.
 *
 * Architecture :
 *   - Charge data/campaigns.json au boot (cache 1 fois)
 *   - Calcule la progression réelle depuis localStorage.scene_results
 *   - Calcule le grade utilisateur depuis Profile.snapshot() ou par défaut
 *   - Rend screen-campaigns avec sections par niveau + cartes dossier
 *   - Au clic sur une carte → affiche la liste détaillée des scènes
 *   - Bouton "Bibliothèque" → bascule vers screen-lobby (vue classique)
 *
 * Persistance :
 *   localStorage.cas_view_preference = 'campaigns' | 'library'
 *     → si 'library', on bypass screen-campaigns et on va direct au lobby
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__casInCampaigns) return;
  window.__casInCampaigns = true;

  const LS_VIEW_PREF = 'cas_view_preference';
  let _data = null;

  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, ch => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]
    ));
  }

  function getResults() {
    try { return JSON.parse(localStorage.getItem('scene_results') || '{}'); }
    catch { return {}; }
  }

  // ─── Détermination du grade utilisateur ──────────────────────
  function getUserLevel() {
    if (!_data) return 'stagiaire';
    const results = getResults();
    const validatedCount = Object.values(results).filter(r => r && r.pct >= 60).length;
    let level = 'stagiaire';
    let best = -1;
    for (const [id, info] of Object.entries(_data.levels)) {
      if (validatedCount >= info.min_scenes && info.order > best) {
        level = id;
        best = info.order;
      }
    }
    return level;
  }

  // ─── Chargement JSON ─────────────────────────────────────────
  async function loadCampaigns() {
    if (_data) return _data;
    try {
      const r = await fetch('data/campaigns.json');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      _data = await r.json();
      return _data;
    } catch (e) {
      console.warn('[campaigns] fetch failed:', e);
      _data = { levels: {}, campaigns: [] };
      return _data;
    }
  }

  // ─── Stats par campagne ──────────────────────────────────────
  function campaignStats(c, results) {
    const scenes = c.scenes || [];
    const done = scenes.filter(sid => (results[sid] || {}).pct >= 60);
    const perfect = scenes.filter(sid => (results[sid] || {}).pct >= 90);
    const total = scenes.length;
    const pctProgress = total ? Math.round((done.length / total) * 100) : 0;
    let status, statusClass, statusIcon;
    if (done.length === 0) {
      status = 'NON OUVERT'; statusClass = 'new'; statusIcon = '○';
    } else if (done.length === total) {
      if (perfect.length === total) {
        status = 'MAÎTRISÉ'; statusClass = 'mastered'; statusIcon = '★';
      } else {
        status = 'CLÔTURÉ'; statusClass = 'completed'; statusIcon = '✓';
      }
    } else {
      status = `EN COURS · ${done.length}/${total}`;
      statusClass = 'inprogress';
      statusIcon = '◐';
    }
    // Prochaine scène (pour saga = prochaine non-faite dans l'ordre)
    const nextSceneId = scenes.find(sid => !((results[sid] || {}).pct >= 60));
    return {
      done, perfect, total, pctProgress, status, statusClass, statusIcon, nextSceneId,
    };
  }

  // ─── Render carte campagne ───────────────────────────────────
  function renderCampaignCard(c, results) {
    const s = campaignStats(c, results);
    const level = _data.levels[c.level] || {};
    const dossierNum = 'CAS-IN/' + String(c.order).padStart(2, '0');
    const hook = c.hook || '';
    const isNarrative = c.narrative ? 'dossier-narrative' : '';
    const perfectBadge = s.perfect.length ? `<span class="dossier-perfect">${s.perfect.length} ★</span>` : '';
    return `
      <a href="#campaign/${escapeHTML(c.id)}"
         class="dossier-card dossier-level-${escapeHTML(c.level)} ${isNarrative}"
         data-campaign-id="${escapeHTML(c.id)}"
         role="button"
         tabindex="0">
        <div class="dossier-stamp">
          <span class="dossier-num">N° ${escapeHTML(dossierNum)}</span>
          <span class="dossier-classif">${escapeHTML(level.icon || '')} ${escapeHTML((level.title || '').toUpperCase())}</span>
        </div>
        <div class="dossier-head">
          <div class="dossier-icon">${c.icon}</div>
          <div class="dossier-titles">
            <h3 class="dossier-title">${escapeHTML(c.title)}</h3>
            <div class="dossier-subtitle">${escapeHTML(c.subtitle || '')}</div>
          </div>
        </div>
        ${hook ? `<p class="dossier-hook">« ${escapeHTML(hook)} »</p>` : ''}
        <p class="dossier-desc">${escapeHTML(c.description || '')}</p>
        <div class="dossier-footer">
          <div class="dossier-progress">
            <div class="dossier-progress-track">
              <div class="dossier-progress-fill" style="width:${s.pctProgress}%"></div>
            </div>
          </div>
          <div class="dossier-status dossier-status-${s.statusClass}">
            <span class="dossier-status-icon">${s.statusIcon}</span>
            <span class="dossier-status-label">${escapeHTML(s.status)}</span>
            ${perfectBadge}
          </div>
        </div>
        <div class="dossier-cta">OUVRIR LE DOSSIER →</div>
      </a>
    `;
  }

  // ─── Render section niveau ──────────────────────────────────
  function renderLevelSection(levelId, level, campaigns, results, userLevel) {
    const isCurrent = levelId === userLevel;
    const cards = campaigns
      .filter(c => c.level === levelId)
      .sort((a, b) => a.order - b.order)
      .map(c => renderCampaignCard(c, results))
      .join('');
    if (!cards) return '';
    const totalScenes = campaigns
      .filter(c => c.level === levelId)
      .reduce((sum, c) => sum + (c.scenes || []).length, 0);
    return `
      <section class="level-section ${isCurrent ? 'level-section-current' : ''}"
               data-level="${escapeHTML(levelId)}">
        <header class="level-header">
          <div class="level-header-stamp">
            ${level.icon}
            ${isCurrent ? '<span class="level-current-pin">●</span>' : ''}
          </div>
          <div class="level-header-text">
            <h2 class="level-title">— ${escapeHTML((level.title || '').toUpperCase())} —${isCurrent ? ' <span class="level-current-tag">TON GRADE</span>' : ''}</h2>
            <p class="level-desc">${escapeHTML(level.description || '')}</p>
          </div>
          <div class="level-header-count">
            <div class="level-header-count-val">${campaigns.filter(c => c.level === levelId).length}</div>
            <div class="level-header-count-label">dossiers</div>
            <div class="level-header-count-sub">${totalScenes} scènes</div>
          </div>
        </header>
        <div class="dossiers-grid">${cards}</div>
      </section>
    `;
  }

  // ─── Render principal de l'écran ─────────────────────────────
  async function renderCampaignsScreen() {
    await loadCampaigns();
    const screen = document.getElementById('screen-campaigns');
    if (!screen) return;
    const results = getResults();
    const userLevel = getUserLevel();
    const validatedCount = Object.values(results).filter(r => r && r.pct >= 60).length;
    const userLevelInfo = _data.levels[userLevel] || {};

    // Progression vers le grade suivant
    let progressNote = '';
    if (userLevelInfo.next_min) {
      const remaining = userLevelInfo.next_min - validatedCount;
      const nextLevelId = Object.entries(_data.levels).find(([id, l]) => l.order === userLevelInfo.order + 1);
      const nextLevelName = nextLevelId ? nextLevelId[1].title : '';
      progressNote = `Encore ${remaining} scène${remaining > 1 ? 's' : ''} pour passer ${escapeHTML(nextLevelName)}`;
    } else {
      progressNote = 'Grade maximum — tu maîtrises tout';
    }

    // Sections par niveau
    const sections = Object.entries(_data.levels)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([id, lvl]) => renderLevelSection(id, lvl, _data.campaigns, results, userLevel))
      .join('');

    // Profile name (pour le briefing)
    let displayName = 'Enquêteur·trice';
    try {
      if (window.Profile && typeof window.Profile.snapshot === 'function') {
        const snap = window.Profile.snapshot();
        if (snap.rank && snap.rank.name) displayName = snap.rank.name;
      }
    } catch (_) {}

    screen.innerHTML = `
      <div class="campaigns-container">
        <div class="page-hero">
          <div class="page-hero-top">
            <div class="page-hero-left">
              <div class="page-classif">★ CONFIDENTIEL — USAGE INTERNE ★</div>
              <h1 class="page-title">Tableau des <span>dossiers</span></h1>
              <p class="page-subtitle">Cellule d'investigation numérique forensique · ${_data.campaigns.length} campagnes · ${(new Set(_data.campaigns.flatMap(c => c.scenes || []))).size} scènes opérationnelles</p>
            </div>
            <button type="button" class="page-bibliotheque-btn" data-action="open-library">
              <span class="page-bibliotheque-icon">📚</span>
              <span class="page-bibliotheque-text">
                <span class="page-bibliotheque-label">Bibliothèque</span>
                <span class="page-bibliotheque-sub">162 scènes en liste</span>
              </span>
            </button>
          </div>
          <div class="page-meta-bar">
            <span><strong>Cellule :</strong> CAS-IN</span>
            <span><strong>Site :</strong> Confédération suisse</span>
            <span><strong>Statut :</strong> Opérationnel</span>
          </div>
        </div>

        <div class="user-briefing">
          <div class="user-briefing-icon">${userLevelInfo.icon || '🎓'}</div>
          <div class="user-briefing-text">
            <div class="user-briefing-grade">${escapeHTML(userLevelInfo.title || 'Stagiaire')} — <strong>${escapeHTML(displayName)}</strong></div>
            <div class="user-briefing-progress">${validatedCount} scène${validatedCount > 1 ? 's' : ''} validée${validatedCount > 1 ? 's' : ''} · ${progressNote}</div>
          </div>
        </div>

        ${sections}

        <div class="bibliotheque-link">
          <a href="#library" data-action="open-library">📚 Bibliothèque complète — accéder aux 162 scènes en mode liste →</a>
          <div class="bibliotheque-link-meta">Vue classique en grille avec filtres difficulté et tags. Pour quand tu veux picorer hors campagne.</div>
        </div>
      </div>
    `;

    bindEvents(screen);
  }

  // ─── Vue détaillée d'une campagne ────────────────────────────
  function renderCampaignDetail(campaignId) {
    const c = _data.campaigns.find(x => x.id === campaignId);
    if (!c) return null;
    const results = getResults();
    const level = _data.levels[c.level] || {};
    const s = campaignStats(c, results);
    
    // Titres réels des scènes (depuis window.SCENES si dispo, sinon depuis l'id)
    const scenesArr = (window.SCENES || []);
    const sceneMeta = sid => scenesArr.find(s => s && s.id === sid) || null;

    const sceneItems = c.scenes.map((sid, idx) => {
      const meta = sceneMeta(sid);
      const r = results[sid] || null;
      let statusClass, statusLabel, statusIcon;
      if (r && r.pct >= 90) {
        statusClass = 'scene-mastered'; statusLabel = 'MAÎTRISÉ'; statusIcon = '★';
      } else if (r && r.pct >= 60) {
        statusClass = 'scene-completed'; statusLabel = `${r.pct}%`; statusIcon = '✓';
      } else if (r) {
        statusClass = 'scene-tried'; statusLabel = `RATÉ · ${r.pct}%`; statusIcon = '⚠';
      } else {
        statusClass = 'scene-new'; statusLabel = 'NON JOUÉ'; statusIcon = '○';
      }
      const title = meta && meta.title ? meta.title : sid.replace(/-/g, ' ');
      const diff = meta && meta.difficulty ? meta.difficulty : '';
      const stepCount = meta && meta.stepCount ? meta.stepCount : (meta && meta.steps ? meta.steps.length : '?');
      const isSagaAct = !!c.narrative;
      const actLabel = isSagaAct ? `ACTE ${idx + 1}` : `SCÈNE ${idx + 1}`;
      return `
        <a href="#scene=${encodeURIComponent(sid)}" class="campaign-scene-item ${statusClass}" data-scene-id="${escapeHTML(sid)}">
          <div class="campaign-scene-num">${actLabel}</div>
          <div class="campaign-scene-body">
            <div class="campaign-scene-title">${escapeHTML(title)}</div>
            <div class="campaign-scene-meta">
              ${diff ? `<span class="diff-badge diff-${diff}">${escapeHTML(diff)}</span>` : ''}
              <span class="campaign-scene-steps">${stepCount} décisions</span>
            </div>
          </div>
          <div class="campaign-scene-status">
            <span class="campaign-scene-icon">${statusIcon}</span>
            <span class="campaign-scene-label">${escapeHTML(statusLabel)}</span>
          </div>
        </a>
      `;
    }).join('');

    const ctaLabel = s.done.length === 0
      ? (c.narrative ? '▶ COMMENCER LA SAGA' : '▶ COMMENCER LA CAMPAGNE')
      : s.done.length === s.total
        ? (s.perfect.length === s.total ? '★ MAÎTRISÉE — REJOUER' : '↻ REJOUER POUR PARFAIRE')
        : (c.narrative ? `▶ ACTE ${s.done.length + 1} — REPRENDRE` : '▶ PROCHAINE SCÈNE');

    return `
      <div class="campaign-detail-container">
        <a href="#campaigns" class="campaign-back-link" data-action="back-to-campaigns">← Retour au tableau</a>
        
        <header class="campaign-detail-header">
          <div class="campaign-detail-classif">${escapeHTML(level.icon || '')} ${escapeHTML((level.title || '').toUpperCase())} · N° CAS-IN/${String(c.order).padStart(2, '0')}</div>
          <div class="campaign-detail-title-row">
            <div class="campaign-detail-icon">${c.icon}</div>
            <div>
              <h1 class="campaign-detail-title">${escapeHTML(c.title)}</h1>
              <div class="campaign-detail-subtitle">${escapeHTML(c.subtitle || '')}</div>
            </div>
          </div>
          ${c.hook ? `<p class="campaign-detail-hook">« ${escapeHTML(c.hook)} »</p>` : ''}
          <p class="campaign-detail-desc">${escapeHTML(c.description || '')}</p>
          
          <div class="campaign-detail-stats">
            <div class="campaign-stat">
              <div class="campaign-stat-val">${s.done.length}<span class="campaign-stat-max">/${s.total}</span></div>
              <div class="campaign-stat-label">Validées</div>
            </div>
            <div class="campaign-stat">
              <div class="campaign-stat-val">${s.perfect.length}</div>
              <div class="campaign-stat-label">★ Maîtrisées</div>
            </div>
            <div class="campaign-stat">
              <div class="campaign-stat-val">${s.pctProgress}%</div>
              <div class="campaign-stat-label">Avancement</div>
            </div>
          </div>
          
          ${s.nextSceneId ? `
            <button type="button" class="campaign-detail-cta" data-launch-scene="${escapeHTML(s.nextSceneId)}">
              ${ctaLabel}
            </button>
          ` : `
            <button type="button" class="campaign-detail-cta campaign-detail-cta-done" data-launch-scene="${escapeHTML(c.scenes[0] || '')}">
              ${ctaLabel}
            </button>
          `}
        </header>
        
        <section class="campaign-scenes-list">
          <h2 class="campaign-scenes-title">${c.narrative ? 'Actes de la saga' : 'Scènes de la campagne'}</h2>
          ${sceneItems}
        </section>
      </div>
    `;
  }

  // ─── Bindings ────────────────────────────────────────────────
  function bindEvents(root) {
    root.querySelectorAll('[data-campaign-id]').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const cid = card.dataset.campaignId;
        navigateTo('campaign/' + cid);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateTo('campaign/' + card.dataset.campaignId);
        }
      });
    });
    root.querySelectorAll('[data-action="open-library"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openLibrary();
      });
    });
  }

  function bindDetailEvents(root) {
    root.querySelectorAll('[data-action="back-to-campaigns"]').forEach(b => {
      b.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('campaigns');
      });
    });
    root.querySelectorAll('[data-launch-scene]').forEach(b => {
      b.addEventListener('click', (e) => {
        e.preventDefault();
        const sid = b.dataset.launchScene;
        if (!sid) return;
        launchScene(sid);
      });
    });
    root.querySelectorAll('.campaign-scene-item[data-scene-id]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        launchScene(a.dataset.sceneId);
      });
    });
  }

  function launchScene(sceneId) {
    if (typeof window.loadFullScene === 'function' && typeof window.startScene === 'function') {
      window.loadFullScene(sceneId).then(window.startScene).catch(err => {
        console.error('[campaigns] launch failed:', sceneId, err);
        if (err && err.code === 'SW_OFFLINE') {
          alert('Cache navigateur périmé. Recharge la page (Ctrl+Shift+R).');
        } else if (typeof window.showToast === 'function') {
          window.showToast('⚠ Erreur de chargement : ' + (err.message || err));
        }
      });
    } else {
      window.location.hash = '#scene=' + encodeURIComponent(sceneId);
    }
  }

  // ─── Navigation ──────────────────────────────────────────────
  function showScreen(screenId) {
    document.querySelectorAll('#app > .screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(screenId);
    if (el) el.classList.add('active');
  }

  function openLibrary() {
    try { localStorage.setItem(LS_VIEW_PREF, 'library'); } catch (_) {}
    showScreen('screen-lobby');
    // S'assurer que le lobby est rendu
    if (typeof window.renderSceneGrid === 'function') {
      try { window.renderSceneGrid(); } catch (_) {}
    }
  }

  function openCampaigns() {
    try { localStorage.setItem(LS_VIEW_PREF, 'campaigns'); } catch (_) {}
    showScreen('screen-campaigns');
    renderCampaignsScreen();
  }

  async function showCampaignDetail(campaignId) {
    await loadCampaigns();
    const screen = document.getElementById('screen-campaigns');
    if (!screen) return;
    const html = renderCampaignDetail(campaignId);
    if (!html) return;
    screen.innerHTML = html;
    bindDetailEvents(screen);
    showScreen('screen-campaigns');
  }

  function navigateTo(route) {
    if (route === 'campaigns') {
      window.location.hash = '#campaigns';
      openCampaigns();
    } else if (route.startsWith('campaign/')) {
      const cid = route.slice('campaign/'.length);
      window.location.hash = '#campaign=' + cid;
      showCampaignDetail(cid);
    }
  }

  // ─── Init au boot ────────────────────────────────────────────
  function handleHash() {
    const h = window.location.hash;
    // #scene=XXX déjà géré par scene-app.js
    if (h.startsWith('#scene=')) return;
    if (h.startsWith('#campaign=')) {
      const cid = h.slice('#campaign='.length);
      showCampaignDetail(cid);
      return;
    }
    if (h === '#library' || h === '#lobby') {
      openLibrary();
      return;
    }
    if (h === '#campaigns' || h === '') {
      // Si l'utilisateur a explicitement choisi la library dans le passé, respecter
      try {
        const pref = localStorage.getItem(LS_VIEW_PREF);
        if (pref === 'library') {
          openLibrary();
          return;
        }
      } catch (_) {}
      openCampaigns();
    }
  }

  async function init() {
    await loadCampaigns();

    // Créer screen-campaigns si pas dans le HTML
    if (!document.getElementById('screen-campaigns')) {
      const app = document.getElementById('app');
      if (!app) return;
      const screen = document.createElement('div');
      screen.id = 'screen-campaigns';
      screen.className = 'screen';
      // Insérer avant screen-lobby pour priorité visuelle
      const lobby = document.getElementById('screen-lobby');
      if (lobby) {
        // Désactiver le active par défaut sur le lobby pour que campaigns prenne le relais
        lobby.classList.remove('active');
        app.insertBefore(screen, lobby);
      } else {
        app.appendChild(screen);
      }
    }

    handleHash();
    window.addEventListener('hashchange', handleHash);
  }

  // Public API
  window.CasInCampaigns = {
    open: openCampaigns,
    openLibrary,
    showDetail: showCampaignDetail,
    reload: renderCampaignsScreen,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
