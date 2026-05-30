/* ═══════════════════════════════════════════════════════════════
 * scene-arc-context.js — v2.99 (piste B3)
 *
 * Pendant le briefing d'une scène, affiche un mini-pill pour chaque
 * arc ou saga touché par cette scène. Donne à l'utilisateur un sentiment
 * de continuité narrative : "tu valides ici le 3ᵉ stage de l'arc Bachmann
 * et l'acte 2 de la saga Sarine".
 *
 * Le pill est cliquable et redirige vers profile.html#tab=distinctions
 * (pour les arcs) ou scene.html → vue Dossiers (pour les sagas).
 *
 * Architecture :
 *   - Observe les mutations de #briefing-content
 *   - À chaque nouveau briefing rendu, lit window.G.scene pour l'id
 *   - Cherche les arcs (data/npc-arcs.json) et sagas (scenes-chronology.json)
 *     qui incluent cette scène
 *   - Injecte une row .arc-context-bar juste après .briefing-top
 *
 * Pas de dépendance dure : si NpcArcs ou chronology absents, on dégrade
 * gracieusement (rien affiché).
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

if (window.__sceneArcContext) return;
  window.__sceneArcContext = true;

  let _chronologyCache = null;
  let _chronoLoadPromise = null;

  function loadChronology() {
    if (_chronologyCache) return Promise.resolve(_chronologyCache);
    if (_chronoLoadPromise) return _chronoLoadPromise;
    _chronoLoadPromise = fetch(_dataUrl('scenes-chronology.json'))
      .then(r => r.ok ? r.json() : null)
      .then(d => { _chronologyCache = d; return d; })
      .catch(() => null);
    return _chronoLoadPromise;
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, ch => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]
    ));
  }

  function getResults() {
    try { return JSON.parse(localStorage.getItem('scene_results') || '{}'); }
    catch { return {}; }
  }

  function findArcs(sceneId) {
    if (!window.NpcArcs || typeof window.NpcArcs.getAllArcs !== 'function') return [];
    const all = window.NpcArcs.getAllArcs();
    const out = [];
    all.forEach(arc => {
      const matchedStage = (arc.stages || []).findIndex(s => s.scene_id === sceneId);
      if (matchedStage < 0) return;
      const target = arc.progress ? arc.progress.target : (arc.stages.length || 0);
      const current = arc.progress ? arc.progress.current : 0;
      out.push({
        kind: 'arc',
        title: arc.title,
        icon: arc.icon || '👤',
        currentBefore: current,
        target,
        stageNum: matchedStage + 1,
        complete: current >= target && target > 0,
      });
    });
    return out;
  }

  function findSagas(sceneId) {
    if (!_chronologyCache || !_chronologyCache.sagas) return [];
    const results = getResults();
    const out = [];
    _chronologyCache.sagas.forEach(saga => {
      const idx = saga.scenes.indexOf(sceneId);
      if (idx < 0) return;
      const done = saga.scenes.filter(sid => results[sid] && results[sid].pct >= 60).length;
      out.push({
        kind: 'saga',
        title: saga.title,
        icon: saga.icon || '🎬',
        currentBefore: done,
        target: saga.scenes.length,
        stageNum: idx + 1,
        complete: done >= saga.scenes.length,
        xpBonus: saga.completion_xp_bonus || 0,
      });
    });
    return out;
  }

  function renderBar(items) {
    if (items.length === 0) return null;
    const html = items.map(item => {
      const isLast = item.stageNum === item.target;
      const cls = ['arc-context-pill'];
      if (item.kind === 'saga') cls.push('arc-context-pill-saga');
      if (item.kind === 'arc') cls.push('arc-context-pill-arc');
      if (isLast && !item.complete) cls.push('arc-context-pill-final');
      const kindLabel = item.kind === 'saga' ? 'Saga' : 'Arc';
      const finalNote = isLast && !item.complete
        ? `<span class="arc-context-pill-finalize">🏆 Stage final${item.xpBonus ? ` · +${item.xpBonus} XP bonus` : ''}</span>`
        : '';
      return `
        <div class="${cls.join(' ')}" title="${escapeHTML(kindLabel + ' : ' + item.title)}">
          <span class="arc-context-pill-icon">${item.icon}</span>
          <div class="arc-context-pill-body">
            <div class="arc-context-pill-meta">${kindLabel} · Stage ${item.stageNum}/${item.target}</div>
            <div class="arc-context-pill-title">${escapeHTML(item.title)}</div>
            <div class="arc-context-pill-bar">
              <div class="arc-context-pill-bar-fill" style="width:${Math.round((item.currentBefore / item.target) * 100)}%"></div>
            </div>
            ${finalNote}
          </div>
        </div>
      `;
    }).join('');
    const wrap = document.createElement('div');
    wrap.className = 'arc-context-bar';
    wrap.id = 'arc-context-bar';
    wrap.innerHTML = `
      <div class="arc-context-header">
        <span class="arc-context-header-icon">🧭</span>
        <span class="arc-context-header-label">Continuités narratives</span>
        <span class="arc-context-header-count">${items.length}</span>
      </div>
      <div class="arc-context-pills">${html}</div>
    `;
    return wrap;
  }

  async function refresh() {
    const briefingContent = document.getElementById('briefing-content');
    if (!briefingContent) return;
    // Récupère la scène courante
    const scene = window.G && window.G.scene;
    if (!scene || !scene.id) return;

    // Charge les deux sources nécessaires
    if (window.NpcArcs && typeof window.NpcArcs.load === 'function') {
      try { await window.NpcArcs.load(); } catch (_) {}
    }
    await loadChronology();

    const arcs = findArcs(scene.id);
    const sagas = findSagas(scene.id);
    // Sagas en premier (narratif fort), puis arcs (par taux d'avancement)
    const items = [
      ...sagas,
      ...arcs.sort((a, b) => (b.currentBefore / b.target) - (a.currentBefore / a.target)),
    ];

    // Retire l'ancien bar s'il existe
    const old = document.getElementById('arc-context-bar');
    if (old) old.remove();

    if (items.length === 0) return;

    // Insertion : juste après .briefing-top
    const briefingTop = briefingContent.querySelector('.briefing-top');
    const bar = renderBar(items);
    if (!bar) return;
    if (briefingTop && briefingTop.parentNode) {
      briefingTop.parentNode.insertBefore(bar, briefingTop.nextSibling);
    } else {
      briefingContent.insertBefore(bar, briefingContent.firstChild);
    }
  }

  // ─── Observer ─────────────────────────────────────────────────
  function install() {
    const briefingContent = document.getElementById('briefing-content');
    if (!briefingContent) return;

    // Initial render après une première hydration éventuelle
    refresh();

    // Watch innerHTML changes — startScene() écrase briefing-content
    const obs = new MutationObserver(() => {
      clearTimeout(install._t);
      install._t = setTimeout(refresh, 50);
    });
    obs.observe(briefingContent, { childList: true });
  }

  function waitForBriefing(retries = 50) {
    if (document.getElementById('briefing-content')) {
      install();
      return;
    }
    if (retries <= 0) return;
    setTimeout(() => waitForBriefing(retries - 1), 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(waitForBriefing, 200));
  } else {
    setTimeout(waitForBriefing, 200);
  }
})();
