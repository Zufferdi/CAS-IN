/* ═══════════════════════════════════════════════════════════════
   cas-in-competences-ui.js — v121e
   
   Injecte une section "Compétences techniques" dans le panel
   #profile-panel-progression de profile.html.
   
   Lit window.Competences (cas-in-competences.js).
   
   v1.0 — 2026-05-27 (v121e)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  function renderRow(comp) {
    const badge = comp.badge;
    const color = badge.color;
    const pct = comp.score_pct || 0;
    return `
      <div class="comp-row" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;margin-bottom:8px">
        <div style="font-size:24px;flex-shrink:0">${escapeHtml(comp.icon)}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;gap:8px">
            <div style="font-size:13px;font-weight:600;color:var(--text);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(comp.label)}</div>
            <div style="font-size:12px;font-weight:700;color:${color};flex-shrink:0;display:flex;align-items:center;gap:6px">
              <span>${escapeHtml(badge.icon)}</span>
              <span>${escapeHtml(badge.label)}</span>
              <span style="color:var(--text);font-weight:600">${pct}%</span>
            </div>
          </div>
          <div style="font-size:10px;color:var(--dim);margin-bottom:6px">${escapeHtml(comp.description)}</div>
          <div style="height:5px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden">
            <div style="height:100%;background:${color};width:${pct}%;transition:width .4s ease"></div>
          </div>
          ${comp.scenes_count > 0 ? `<div style="font-size:10px;color:var(--dim);margin-top:4px">${comp.scenes_count} scène${comp.scenes_count > 1 ? 's' : ''} · ${comp.scenes_mastered} maîtrisée${comp.scenes_mastered > 1 ? 's' : ''}${comp.bonus_count > 0 ? ' · ' + comp.bonus_count + ' bonus' : ''}</div>` : ''}
        </div>
      </div>
    `;
  }

  function render() {
    const panel = document.getElementById('profile-panel-progression');
    if (!panel) return;
    if (!window.Competences) return;

    if (panel.querySelector('#competences-section')) {
      updateExisting();
      return;
    }

    const all = window.Competences.getAll();
    const stats = window.Competences.getStats();

    const section = document.createElement('section');
    section.className = 'profile-section';
    section.id = 'competences-section';
    section.setAttribute('aria-label', 'Compétences techniques');
    section.innerHTML = `
      <div class="dfir-divider">
        <span>🎓 COMPÉTENCES TECHNIQUES PAR DOMAINE</span>
        <div class="dfir-divider-line"></div>
      </div>
      <div style="background:linear-gradient(135deg,rgba(48,232,138,.06),rgba(34,211,238,.05));border:1px solid rgba(48,232,138,.20);border-radius:14px;padding:16px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
          <div style="font-size:13px;color:var(--text);font-weight:600">Moyenne</div>
          <div style="font-size:18px;color:var(--text);font-weight:800">${stats.avg_pct}<span style="color:var(--dim);font-size:13px;font-weight:400">%</span></div>
        </div>
        <div style="font-size:11px;color:var(--dim);margin-bottom:8px">
          ${stats.started} commencée${stats.started > 1 ? 's' : ''} · ${stats.above_50} à 50%+ · ${stats.above_75} à 75%+ · ${stats.at_master} maîtrisée${stats.at_master > 1 ? 's' : ''}
        </div>
        <div style="height:5px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden">
          <div style="height:100%;background:linear-gradient(90deg,#30e88a,#22d3ee);width:${stats.avg_pct}%"></div>
        </div>
      </div>
      <div id="competences-rows">
        ${all.map(c => renderRow(c)).join('')}
      </div>
      <div style="font-size:11px;color:var(--dim);margin-top:12px;line-height:1.5">
        Les compétences techniques mesurent votre maîtrise par domaine juridique et opérationnel.
        Chaque scène réussie (≥60%) contribue selon ses tags. Les scènes excellentes (≥95%) comptent 1.5× ; les tags spécialisés comptent 2×.
      </div>
    `;

    // Insérer à la fin du panel (après les sections XP, rangs, etc. existantes)
    panel.appendChild(section);
  }

  function updateExisting() {
    const rowsContainer = document.getElementById('competences-rows');
    if (!rowsContainer || !window.Competences) return;
    const all = window.Competences.getAll();
    rowsContainer.innerHTML = all.map(c => renderRow(c)).join('');
  }

  function init() {
    let retries = 0;
    function tryInject() {
      if (document.getElementById('profile-panel-progression') && window.Competences) {
        render();
      } else if (retries < 30) {
        retries++;
        setTimeout(tryInject, 100);
      }
    }
    tryInject();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  if (window.Profile && typeof window.Profile.onChange === 'function') {
    try { window.Profile.onChange(() => updateExisting()); } catch (_) {}
  }

})();
