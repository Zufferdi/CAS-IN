/* ═══════════════════════════════════════════════════════════════
   cas-in-reputation-ui.js — v121d
   
   Injecte automatiquement une section "Réputation institutionnelle"
   dans le panel #profile-panel-relations de la page profile.html.
   
   Lit window.Reputation (cas-in-reputation.js) et le rend visuellement.
   
   v1.0 — 2026-05-27 (v121d)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  function renderInstitutionRow(inst, value) {
    const color = inst.color || '#7ec0ff';
    const v = Math.max(0, Math.min(100, value || 0));
    return `
      <div class="rep-row" style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;margin-bottom:8px">
        <div style="font-size:24px;flex-shrink:0">${escapeHtml(inst.icon || '🏛️')}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
            <div style="font-size:13px;font-weight:600;color:var(--text)">${escapeHtml(inst.label)}</div>
            <div style="font-size:13px;font-weight:700;color:${color}">${v}<span style="color:var(--dim);font-size:11px;font-weight:400">/100</span></div>
          </div>
          <div style="font-size:11px;color:var(--dim);margin-bottom:6px">${escapeHtml(inst.fullName || '')}</div>
          <div style="height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden">
            <div style="height:100%;background:${color};width:${v}%;transition:width .4s ease"></div>
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    const panel = document.getElementById('profile-panel-relations');
    if (!panel) return;
    if (!window.Reputation) return;

    // Empêcher la double injection
    if (panel.querySelector('#reputation-section')) {
      // Re-render seulement (si le module est chargé deux fois)
      updateExisting();
      return;
    }

    const institutions = window.Reputation.INSTITUTIONS;
    const reps = window.Reputation.getAll();
    const stats = window.Reputation.getStats();

    // Construire la section
    const section = document.createElement('section');
    section.className = 'profile-section';
    section.id = 'reputation-section';
    section.setAttribute('aria-label', 'Réputation institutionnelle');
    section.innerHTML = `
      <div class="dfir-divider">
        <span>🏛️ RÉPUTATION INSTITUTIONNELLE</span>
        <div class="dfir-divider-line"></div>
      </div>
      <div style="background:linear-gradient(135deg,rgba(126,192,255,.06),rgba(168,85,247,.05));border:1px solid rgba(126,192,255,.20);border-radius:14px;padding:16px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
          <div style="font-size:13px;color:var(--text);font-weight:600">Total cumulé</div>
          <div style="font-size:18px;color:var(--text);font-weight:800">${stats.total}<span style="color:var(--dim);font-size:13px;font-weight:400">/${stats.max}</span></div>
        </div>
        <div style="font-size:11px;color:var(--dim);margin-bottom:8px">${stats.institutions_above_50} institution${stats.institutions_above_50 > 1 ? 's' : ''} à 50+ · Moyenne ${stats.avg}/100</div>
        <div style="height:5px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden">
          <div style="height:100%;background:linear-gradient(90deg,#7ec0ff,#a78bfa);width:${stats.pct}%"></div>
        </div>
      </div>
      <div id="reputation-rows">
        ${institutions.map(inst => renderInstitutionRow(inst, reps[inst.id] || 0)).join('')}
      </div>
      <div style="font-size:11px;color:var(--dim);margin-top:12px;line-height:1.5">
        La réputation institutionnelle s'accumule automatiquement quand vous complétez des scènes liées aux tags d'une institution (MPC, OFJ, NCSC, PFPDT, etc.).
        Les scènes excellentes (≥90%) donnent un bonus de réputation.
      </div>
    `;

    // Insérer après la section relations PNJ existante
    const npcSection = panel.querySelector('#npc-relations-section');
    if (npcSection && npcSection.parentNode === panel) {
      npcSection.parentNode.insertBefore(section, npcSection.nextSibling);
    } else {
      panel.appendChild(section);
    }
  }

  function updateExisting() {
    const rowsContainer = document.getElementById('reputation-rows');
    if (!rowsContainer || !window.Reputation) return;
    const institutions = window.Reputation.INSTITUTIONS;
    const reps = window.Reputation.getAll();
    rowsContainer.innerHTML = institutions.map(inst => renderInstitutionRow(inst, reps[inst.id] || 0)).join('');
  }

  // ─────────────────────────────────────────────────────────────
  // Init : tenter dès DOMContentLoaded ; sinon re-essayer
  // (profile-page.js peut tarder à initialiser les panels)
  // ─────────────────────────────────────────────────────────────
  function init() {
    let retries = 0;
    function tryInject() {
      if (document.getElementById('profile-panel-relations') && window.Reputation) {
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

  // Re-render au changement de profil (achievement débloqué, nouvelle scène, etc.)
  if (window.Profile && typeof window.Profile.onChange === 'function') {
    try { window.Profile.onChange(() => updateExisting()); } catch (_) {}
  }

})();
