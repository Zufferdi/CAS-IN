// ═══════════════════════════════════════════════════════════════
// profile-relations.js — v2.71
// Section "Relations PNJ" sur profile.html
// 
// Affiche les relations établies avec les PNJ : compteurs par état
// (hostile/méfiant/professionnel/complice), liste des PNJ proches,
// bouton de reconstruction rétroactive depuis Mastery.
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  let NPC_DATA = null;

  async function loadNpcData() {
    if (NPC_DATA) return NPC_DATA;
    try {
      const r = await fetch('data/npcs.json');
      const d = await r.json();
      NPC_DATA = d.npcs || {};
      window.NPC_DATA = NPC_DATA;
      return NPC_DATA;
    } catch (e) {
      console.warn('[profile-relations] cannot load npcs.json', e);
      return null;
    }
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, ch => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
  }

  async function render() {
    const container = document.getElementById('npc-relations-section-body');
    if (!container) return;

    if (!window.NpcState) {
      container.innerHTML = '<p style="color:var(--text-muted)">Module NpcState non chargé.</p>';
      return;
    }

    await loadNpcData();
    const npcData = NPC_DATA || {};
    const counts = window.NpcState.getCounts();
    const encountered = window.NpcState.getEncountered();
    const total = encountered.length;

    if (total === 0) {
      container.innerHTML = `
        <div class="rel-empty">
          <div class="rel-empty-icon">🤝</div>
          <p>Aucune relation établie pour l'instant.</p>
          <p class="rel-empty-sub">Joue des scénarios pour construire ton réseau.</p>
          ${window.Mastery ? '<button class="rel-rebuild-btn" onclick="ProfileRelations.rebuild()">⚡ Reconstruire depuis ma progression</button>' : ''}
        </div>`;
      return;
    }

    // Header avec compteurs
    let html = '<div class="rel-summary">';
    html += `<div class="rel-stat"><span class="rel-stat-icon">🤝</span><span class="rel-stat-val">${counts.complice}</span><span class="rel-stat-label">Complices</span></div>`;
    html += `<div class="rel-stat"><span class="rel-stat-icon">🙂</span><span class="rel-stat-val">${counts['professionnel']}</span><span class="rel-stat-label">Professionnels</span></div>`;
    html += `<div class="rel-stat"><span class="rel-stat-icon">🤨</span><span class="rel-stat-val">${counts['méfiant']}</span><span class="rel-stat-label">Méfiants</span></div>`;
    html += `<div class="rel-stat"><span class="rel-stat-icon">😠</span><span class="rel-stat-val">${counts.hostile}</span><span class="rel-stat-label">Hostiles</span></div>`;
    html += `<div class="rel-stat"><span class="rel-stat-icon">📊</span><span class="rel-stat-val">${total}</span><span class="rel-stat-label">Total rencontrés</span></div>`;
    html += '</div>';

    // Top 5 complices
    const allStates = encountered.map(id => {
      const data = window.NpcState.get(id);
      const npc = npcData[id];
      return { id, data, npc };
    }).filter(x => x.npc);

    const complices = allStates
      .filter(x => x.data.state === 'complice')
      .sort((a, b) => b.data.trust - a.data.trust)
      .slice(0, 5);

    if (complices.length > 0) {
      html += '<div class="rel-section">';
      html += '<h4 class="rel-section-title">🤝 Complices proches</h4>';
      html += '<div class="rel-list">';
      complices.forEach(x => {
        html += `<a href="npcs.html" class="rel-item">
          <span class="rel-item-icon">${x.npc.icon || '👤'}</span>
          <div class="rel-item-body">
            <div class="rel-item-name">${escapeHTML(x.npc.name || x.id)}</div>
            <div class="rel-item-role">${escapeHTML(x.npc.role || '')}</div>
          </div>
          <div class="rel-item-trust">${x.data.trust}/100</div>
        </a>`;
      });
      html += '</div></div>';
    }

    // Hostiles à surveiller
    const hostiles = allStates
      .filter(x => x.data.state === 'hostile' || x.data.state === 'méfiant')
      .sort((a, b) => a.data.trust - b.data.trust)
      .slice(0, 5);

    if (hostiles.length > 0) {
      html += '<div class="rel-section">';
      html += '<h4 class="rel-section-title">⚠ Relations à reconstruire</h4>';
      html += '<div class="rel-list">';
      hostiles.forEach(x => {
        const color = x.data.trust <= 25 ? '#dc3c46' : '#e68232';
        html += `<a href="npcs.html" class="rel-item">
          <span class="rel-item-icon">${x.npc.icon || '👤'}</span>
          <div class="rel-item-body">
            <div class="rel-item-name">${escapeHTML(x.npc.name || x.id)}</div>
            <div class="rel-item-role">${escapeHTML(x.npc.role || '')}</div>
          </div>
          <div class="rel-item-trust" style="color:${color}">${x.data.trust}/100</div>
        </a>`;
      });
      html += '</div></div>';
    }

    // Quête trust
    if (counts.complice >= 3) {
      html += '<div class="rel-quest-done">✓ <strong>Quête accomplie</strong> : 3 complices atteints !</div>';
    } else {
      html += `<div class="rel-quest">
        <span>🎯 Quête : atteins 3 complices</span>
        <div class="rel-quest-progress"><div class="rel-quest-bar" style="width:${(counts.complice / 3) * 100}%"></div></div>
        <span class="rel-quest-count">${counts.complice}/3</span>
      </div>`;
    }

    // Bouton reset
    html += '<div class="rel-actions"><a href="npcs.html" class="rel-link">Voir tous les personnages →</a>';
    html += '<button class="rel-reset-btn" onclick="ProfileRelations.reset()">↻ Réinitialiser les relations</button></div>';

    container.innerHTML = html;
  }

  function rebuild() {
    if (!window.NpcState || !window.NpcState.rebuildFromMastery) return;
    const result = window.NpcState.rebuildFromMastery();
    if (result) {
      alert(`✓ Reconstruit : ${result.scenes} scènes traitées, ${result.npcs} PNJ avec relations établies.`);
      render();
    } else {
      alert('Reconstruction impossible — données Mastery manquantes.');
    }
  }

  function resetRelations() {
    if (!confirm('Réinitialiser toutes les relations PNJ ? Toutes tes relations actuelles seront effacées.')) return;
    if (window.NpcState && window.NpcState.reset) {
      window.NpcState.reset();
      render();
    }
  }

  // API
  window.ProfileRelations = {
    render,
    rebuild,
    reset: resetRelations,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    setTimeout(render, 100);
  }
})();
